"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { db, setLastSyncTime, type PendingSync, type OfflineTaskComment } from '@/lib/offline-db'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'

const SYNC_INTERVAL = 30000
const MAX_RETRIES = 5
const BASE_RETRY_DELAY = 1000

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitialized = useRef(false)
  const syncLock = useRef(false)
  const syncPendingChangesRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true
      setIsOnline(online)
    }

    function handleOnline() {
      setIsOnline(true)
      setLastSyncError(null)
      toast.success("You're back online!", { description: "Syncing your changes..." })
      if (syncPendingChangesRef.current) {
        syncPendingChangesRef.current()
      }
    }

    function handleOffline() {
      setIsOnline(false)
      toast.warning("You're offline", { description: "Changes will sync when you reconnect." })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  useEffect(() => {
    updatePendingCount()
  }, [])

  async function updatePendingCount() {
    try {
      const count = await db.pendingSync.count()
      setPendingCount(count)
    } catch (error) {
      console.error('Error counting pending syncs:', error)
    }
  }

  async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (i < maxRetries - 1) {
          const delayMs = BASE_RETRY_DELAY * Math.pow(2, i)
          await delay(delayMs)
        }
      }
    }
    throw lastError
  }

  const syncPendingChanges = useCallback(async () => {
    if (!navigator.onLine || syncLock.current) return

    syncLock.current = true
    setIsSyncing(true)
    setLastSyncError(null)

    try {
      const pending = await db.pendingSync.orderBy('created_at').toArray()
      let successCount = 0
      let failCount = 0

      for (const item of pending) {
        try {
          await syncItem(item)
          await db.pendingSync.delete(item.id!)
          successCount++
        } catch (error) {
          console.error('Sync failed for item:', item.type, item.entity_id, error)
          failCount++
          
          const newRetries = item.retries + 1
          if (newRetries < MAX_RETRIES) {
            await db.pendingSync.update(item.id!, { retries: newRetries })
          } else {
            await db.pendingSync.delete(item.id!)
            setLastSyncError(`Failed to sync ${item.type} after ${MAX_RETRIES} attempts`)
          }
        }
      }

      await updatePendingCount()

      if (successCount > 0 && failCount === 0) {
        toast.success(`Synced ${successCount} change${successCount > 1 ? 's' : ''}`)
      } else if (failCount > 0) {
        toast.error(`${failCount} change${failCount > 1 ? 's' : ''} failed to sync`)
      }
    } catch (error) {
      console.error('Sync process error:', error)
      setLastSyncError('Sync process failed')
    } finally {
      syncLock.current = false
      setIsSyncing(false)
    }
  }, [])

  async function syncItem(item: PendingSync) {
    const isLocalId = item.entity_id.startsWith('local_')

    switch (item.type) {
      case 'project_create': {
        const res = await retryWithBackoff(() =>
          fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to create project')
        }
        const project = await res.json()
        
        if (isLocalId) {
          await db.tasks.where('project_id').equals(item.entity_id).modify({ project_id: project.id })
          await db.projects.delete(item.entity_id)
        }
        await db.projects.put({ 
          ...project, 
          synced_at: Date.now(), 
          updated_at: Date.now(),
          created_at: project.created_at || new Date().toISOString()
        })
        break
      }

      case 'project_update': {
        if (isLocalId) return
        const res = await retryWithBackoff(() =>
          fetch('/api/projects/' + item.entity_id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to update project')
        }
        const updated = await res.json()
        await db.projects.update(item.entity_id, { 
          ...updated,
          synced_at: Date.now(),
          updated_at: Date.now()
        })
        break
      }

      case 'project_delete': {
        if (isLocalId) {
          await db.projects.delete(item.entity_id)
          return
        }
        const res = await retryWithBackoff(() =>
          fetch('/api/projects/' + item.entity_id, { method: 'DELETE' })
        )
        if (!res.ok && res.status !== 404) {
          throw new Error('Failed to delete project')
        }
        await db.projects.delete(item.entity_id)
        await db.tasks.where('project_id').equals(item.entity_id).delete()
        break
      }

      case 'task_create': {
        const res = await retryWithBackoff(() =>
          fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to create task')
        }
        const task = await res.json()
        
        if (isLocalId) {
          await db.comments.where('task_id').equals(item.entity_id).modify({ task_id: task.id })
          await db.tasks.delete(item.entity_id)
        }
        await db.tasks.put({ 
          ...task, 
          synced_at: Date.now(), 
          updated_at: Date.now(),
          is_dirty: false, 
          labels: task.labels || [],
          created_at: task.created_at || new Date().toISOString()
        })
        break
      }

      case 'task_update': {
        if (isLocalId) return
        const res = await retryWithBackoff(() =>
          fetch('/api/tasks/' + item.entity_id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to update task')
        }
        await db.tasks.update(item.entity_id, { 
          is_dirty: false, 
          synced_at: Date.now(),
          updated_at: Date.now()
        })
        break
      }

      case 'task_delete': {
        if (isLocalId) {
          await db.tasks.delete(item.entity_id)
          await db.comments.where('task_id').equals(item.entity_id).delete()
          return
        }
        const res = await retryWithBackoff(() =>
          fetch('/api/tasks/' + item.entity_id, { method: 'DELETE' })
        )
        if (!res.ok && res.status !== 404) {
          throw new Error('Failed to delete task')
        }
        await db.tasks.delete(item.entity_id)
        await db.comments.where('task_id').equals(item.entity_id).delete()
        break
      }

      case 'chat_create': {
        const res = await retryWithBackoff(() =>
          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to send chat')
        }
        const msg = await res.json()
        
        if (isLocalId) {
          await db.chatMessages.delete(item.entity_id)
        }
        await db.chatMessages.put({ 
          ...msg, 
          synced_at: Date.now(), 
          updated_at: Date.now(),
          is_dirty: false 
        })
        break
      }

      case 'comment_create': {
        const res = await retryWithBackoff(() =>
          fetch(`/api/tasks/${item.data.task_id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: item.data.content }),
          })
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to create comment')
        }
        const comment = await res.json()
        
        if (isLocalId) {
          await db.comments.delete(item.entity_id)
        }
        await db.comments.put({ 
          ...comment, 
          synced_at: Date.now(), 
          updated_at: Date.now(),
          is_dirty: false,
          user_display_name: comment.profiles?.display_name || undefined,
          user_avatar_url: comment.profiles?.avatar_url || undefined,
        })
        break
      }

      case 'pod_create': {
        const res = await retryWithBackoff(() =>
          fetch('/api/pods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to create pod')
        }
        const pod = await res.json()
        
        if (isLocalId) {
          await db.projects.where('pod_id').equals(item.entity_id).modify({ pod_id: pod.id })
          await db.members.where('pod_id').equals(item.entity_id).modify({ pod_id: pod.id })
          await db.chatMessages.where('pod_id').equals(item.entity_id).modify({ pod_id: pod.id })
          await db.pods.delete(item.entity_id)
        }
        await db.pods.put({ 
          ...pod, 
          role: 'founder',
          synced_at: Date.now(), 
          updated_at: Date.now(),
          created_at: pod.created_at || new Date().toISOString()
        })
        break
      }

      case 'pod_update': {
        if (isLocalId) return
        const res = await retryWithBackoff(() =>
          fetch('/api/pods/' + item.entity_id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to update pod')
        }
        await db.pods.update(item.entity_id, { 
          synced_at: Date.now(),
          updated_at: Date.now()
        })
        break
      }
    }
  }

  useEffect(() => {
    syncPendingChangesRef.current = syncPendingChanges
  }, [syncPendingChanges])

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncLock.current) {
      const timer = setTimeout(() => syncPendingChanges(), 1000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, pendingCount, syncPendingChanges])

  useEffect(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
    }

    if (isOnline) {
      syncIntervalRef.current = setInterval(() => {
        if (pendingCount > 0 && !syncLock.current) {
          syncPendingChanges()
        }
      }, SYNC_INTERVAL)
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [isOnline, pendingCount, syncPendingChanges])

  const cachePodData = useCallback(async (
    podId: string,
    podData: {
      pod: { id: string; npn: string; title: string; summary: string | null; avatar_url: string | null; founder_id: string; storage_used_bytes: number };
      role: 'founder' | 'member';
      projects: Array<{ id: string; pod_id: string; name: string; description: string | null; created_by: string; created_at?: string }>;
      tasks: Array<{ id: string; project_id: string; name: string; description: string; due_date: string; assigned_to: string | null; status: 'not_started' | 'ongoing' | 'completed'; priority: 'low' | 'medium' | 'high'; created_by: string; labels: string[]; created_at?: string }>;
      members: Array<{ id: string; pod_id: string; user_id: string; role: 'founder' | 'member'; joined_at: string; profiles: { display_name: string | null; email: string; avatar_url: string | null } }>;
      chatMessages: Array<{ id: string; pod_id: string; user_id: string; content: string; created_at: string }>;
      comments?: Array<{ id: string; task_id: string; user_id: string; content: string; created_at: string; updated_at?: string; profiles?: Profile }>;
    }
  ) => {
    const now = Date.now()

    try {
      await db.pods.put({
        ...podData.pod,
        role: podData.role,
        created_at: new Date().toISOString(),
        synced_at: now,
        updated_at: now,
      })

      const existingProjects = await db.projects.where('pod_id').equals(podId).toArray()
      const dirtyProjectIds = new Set(
        existingProjects
          .filter(p => p.id.startsWith('local_'))
          .map(p => p.id)
      )

      for (const project of podData.projects) {
        if (!dirtyProjectIds.has(project.id)) {
          await db.projects.put({
            ...project,
            created_at: project.created_at || new Date().toISOString(),
            synced_at: now,
            updated_at: now
          })
        }
      }

      const existingTasks = await db.tasks.where('project_id').anyOf(podData.projects.map(p => p.id)).toArray()
      const dirtyTaskIds = new Set(existingTasks.filter(t => t.is_dirty || t.id.startsWith('local_')).map(t => t.id))

      for (const task of podData.tasks) {
        if (!dirtyTaskIds.has(task.id)) {
          await db.tasks.put({
            ...task,
            created_at: task.created_at || new Date().toISOString(),
            synced_at: now,
            updated_at: now,
            is_dirty: false
          })
        }
      }

      await db.members.bulkPut(
        podData.members.map(m => ({
          id: m.id,
          pod_id: m.pod_id,
          user_id: m.user_id,
          role: m.role,
          display_name: m.profiles.display_name,
          email: m.profiles.email,
          avatar_url: m.profiles.avatar_url,
          joined_at: m.joined_at,
          created_at: new Date().toISOString(),
          synced_at: now,
          updated_at: now,
        }))
      )

      const existingMessages = await db.chatMessages.where('pod_id').equals(podId).toArray()
      const dirtyMessageIds = new Set(existingMessages.filter(m => m.is_dirty || m.id.startsWith('local_')).map(m => m.id))

      for (const msg of podData.chatMessages) {
        if (!dirtyMessageIds.has(msg.id)) {
          await db.chatMessages.put({
            ...msg,
            synced_at: now,
            updated_at: now,
            is_dirty: false
          })
        }
      }

      if (podData.comments) {
        const existingComments = await db.comments.where('task_id').anyOf(podData.tasks.map(t => t.id)).toArray()
        const dirtyCommentIds = new Set(existingComments.filter(c => c.is_dirty || c.id.startsWith('local_')).map(c => c.id))

        for (const comment of podData.comments) {
          if (!dirtyCommentIds.has(comment.id)) {
            await db.comments.put({
              ...comment,
              user_display_name: comment.profiles?.display_name || undefined,
              user_avatar_url: comment.profiles?.avatar_url || undefined,
              synced_at: now,
              updated_at: comment.updated_at ? new Date(comment.updated_at).getTime() : now,
              is_dirty: false
            })
          }
        }
      }

      await setLastSyncTime(podId)
    } catch (error) {
      console.error('Error caching pod data:', error)
    }
  }, [])

  const createPodOffline = useCallback(async (data: { title: string; summary: string | null }, userId: string) => {
    const localId = 'local_pod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const now = Date.now()

    const offlinePod = {
      id: localId,
      npn: `NP-${Math.floor(Math.random() * 100000)}`,
      title: data.title,
      summary: data.summary,
      avatar_url: null,
      founder_id: userId,
      storage_used_bytes: 0,
      role: 'founder' as const,
      created_at: new Date().toISOString(),
      synced_at: now,
      updated_at: now,
    }

    await db.pods.put(offlinePod)
    await db.pendingSync.add({
      type: 'pod_create',
      entity_id: localId,
      data,
      created_at: now,
      retries: 0,
    })
    await updatePendingCount()
    return offlinePod
  }, [])

  const updatePodOffline = useCallback(async (podId: string, updates: { title?: string; summary?: string | null }) => {
    const now = Date.now()
    await db.pods.update(podId, { ...updates, updated_at: now })

    if (!podId.startsWith('local_')) {
      await db.pendingSync.add({
        type: 'pod_update',
        entity_id: podId,
        data: updates,
        created_at: now,
        retries: 0,
      })
      await updatePendingCount()
    }
  }, [])

  const createProjectOffline = useCallback(async (data: { pod_id: string; name: string; description: string | null }, createdBy: string) => {
    const localId = 'local_prj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const now = Date.now()

    const offlineProject = {
      id: localId,
      ...data,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      synced_at: now,
      updated_at: now,
    }

    await db.projects.put(offlineProject)
    await db.pendingSync.add({
      type: 'project_create',
      entity_id: localId,
      data,
      created_at: now,
      retries: 0,
    })
    await updatePendingCount()
    return offlineProject
  }, [])

  const updateProjectOffline = useCallback(async (projectId: string, updates: { name?: string; description?: string | null }) => {
    const now = Date.now()
    await db.projects.update(projectId, { ...updates, updated_at: now })

    if (!projectId.startsWith('local_')) {
      await db.pendingSync.add({
        type: 'project_update',
        entity_id: projectId,
        data: updates,
        created_at: now,
        retries: 0,
      })
      await updatePendingCount()
    }
  }, [])

  const deleteProjectOffline = useCallback(async (projectId: string) => {
    await db.projects.delete(projectId)
    await db.tasks.where('project_id').equals(projectId).delete()

    await db.pendingSync.add({
      type: 'project_delete',
      entity_id: projectId,
      data: {},
      created_at: Date.now(),
      retries: 0,
    })
    await updatePendingCount()
  }, [])

  const createTaskOffline = useCallback(async (taskData: {
    project_id: string
    name: string
    description: string
    due_date: string
    assigned_to: string | null
    priority: 'low' | 'medium' | 'high'
    labels: string[]
  }, createdBy: string) => {
    const localId = 'local_task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const now = Date.now()

    const offlineTask = {
      id: localId,
      ...taskData,
      status: 'not_started' as const,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      synced_at: now,
      updated_at: now,
      is_dirty: true,
      local_id: localId,
    }

    await db.tasks.put(offlineTask)
    await db.pendingSync.add({
      type: 'task_create',
      entity_id: localId,
      data: taskData,
      created_at: now,
      retries: 0,
    })
    await updatePendingCount()
    return offlineTask
  }, [])

  const updateTaskOffline = useCallback(async (taskId: string, updates: { status?: 'not_started' | 'ongoing' | 'completed'; [key: string]: unknown }) => {
    const now = Date.now()
    await db.tasks.update(taskId, { ...updates, is_dirty: true, updated_at: now })

    if (!taskId.startsWith('local_')) {
      await db.pendingSync.add({
        type: 'task_update',
        entity_id: taskId,
        data: updates as Record<string, unknown>,
        created_at: now,
        retries: 0,
      })
      await updatePendingCount()
    }
  }, [])

  const deleteTaskOffline = useCallback(async (taskId: string) => {
    await db.tasks.delete(taskId)
    await db.comments.where('task_id').equals(taskId).delete()

    await db.pendingSync.add({
      type: 'task_delete',
      entity_id: taskId,
      data: {},
      created_at: Date.now(),
      retries: 0,
    })
    await updatePendingCount()
  }, [])

  const sendChatOffline = useCallback(async (podId: string, content: string, userId: string) => {
    const localId = 'local_chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const now = Date.now()

    const offlineMessage = {
      id: localId,
      pod_id: podId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      synced_at: now,
      updated_at: now,
      is_dirty: true,
      local_id: localId,
    }

    await db.chatMessages.put(offlineMessage)
    await db.pendingSync.add({
      type: 'chat_create',
      entity_id: localId,
      data: { pod_id: podId, content },
      created_at: now,
      retries: 0,
    })
    await updatePendingCount()
    return offlineMessage
  }, [])

  const addCommentOffline = useCallback(async (taskId: string, content: string, user: Profile) => {
    const localId = 'local_cmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const now = Date.now()

    const offlineComment: OfflineTaskComment = {
      id: localId,
      task_id: taskId,
      user_id: user.id,
      content,
      created_at: new Date().toISOString(),
      synced_at: now,
      updated_at: now,
      is_dirty: true,
      local_id: localId,
      user_display_name: user.display_name || undefined,
      user_avatar_url: user.avatar_url || undefined,
    }

    await db.comments.put(offlineComment)
    await db.pendingSync.add({
      type: 'comment_create',
      entity_id: localId,
      data: { task_id: taskId, content },
      created_at: now,
      retries: 0,
    })
    await updatePendingCount()
    return offlineComment
  }, [])

  const getOfflinePods = useCallback(async () => {
    return await db.pods.toArray()
  }, [])

  const getOfflineProjects = useCallback(async (podId: string) => {
    return await db.projects.where('pod_id').equals(podId).toArray()
  }, [])

  const getOfflineTasks = useCallback(async (projectIds: string[]) => {
    if (projectIds.length === 0) return []
    return await db.tasks.where('project_id').anyOf(projectIds).toArray()
  }, [])

  const getOfflineMembers = useCallback(async (podId: string) => {
    return await db.members.where('pod_id').equals(podId).toArray()
  }, [])

  const getOfflineComments = useCallback(async (taskId: string) => {
    return await db.comments.where('task_id').equals(taskId).sortBy('created_at')
  }, [])

  const getOfflineChat = useCallback(async (podId: string) => {
    return await db.chatMessages.where('pod_id').equals(podId).sortBy('created_at')
  }, [])

  const clearPendingSync = useCallback(async () => {
    await db.pendingSync.clear()
    await updatePendingCount()
  }, [])

  const forceSyncNow = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error("You're offline. Connect to sync.")
      return
    }
    await syncPendingChanges()
  }, [syncPendingChanges])

  return {
    isOnline: isOnline !== false,
    isSyncing,
    pendingCount,
    lastSyncError,
    syncPendingChanges,
    forceSyncNow,
    clearPendingSync,
    cachePodData,
    createPodOffline,
    updatePodOffline,
    createTaskOffline,
    updateTaskOffline,
    deleteTaskOffline,
    createProjectOffline,
    updateProjectOffline,
    deleteProjectOffline,
    sendChatOffline,
    addCommentOffline,
    getOfflinePods,
    getOfflineProjects,
    getOfflineTasks,
    getOfflineMembers,
    getOfflineChat,
    getOfflineComments,
  }
}

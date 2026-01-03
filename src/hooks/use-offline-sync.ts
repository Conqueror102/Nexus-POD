"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { db, setLastSyncTime, type PendingSync } from '@/lib/offline-db'
import { toast } from 'sonner'

export function useOfflineSync() {
  // Initialize as null to indicate "unknown" state during SSR/hydration
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitialized = useRef(false)
  const syncPendingChangesRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    // Only set initial state once to avoid flash
    if (!hasInitialized.current) {
      hasInitialized.current = true
      // Use navigator.onLine, but also check if we can actually reach the network
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true
      setIsOnline(online)
    }

    function handleOnline() {
      setIsOnline(true)
      toast.success("You're back online!", { description: "Syncing your changes..." })
      // Call sync if available
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
    const count = await db.pendingSync.count()
    setPendingCount(count)
  }

  const syncPendingChanges = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return

    setIsSyncing(true)
    try {
      const pending = await db.pendingSync.orderBy('created_at').toArray()
      
      for (const item of pending) {
        try {
          await syncItem(item)
          await db.pendingSync.delete(item.id!)
        } catch (error) {
          console.error('Sync failed for item:', item, error)
          if (item.retries < 3) {
            await db.pendingSync.update(item.id!, { retries: item.retries + 1 })
          } else {
            await db.pendingSync.delete(item.id!)
            toast.error('Failed to sync some changes')
          }
        }
      }

      await updatePendingCount()
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  async function syncItem(item: PendingSync) {
    switch (item.type) {
      case 'task_create': {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        })
        if (!res.ok) throw new Error('Failed to create task')
        const task = await res.json()
        await db.tasks.delete(item.entity_id)
        await db.tasks.put({ ...task, synced_at: Date.now(), is_dirty: false })
        break
      }
      case 'task_update': {
        const res = await fetch('/api/tasks/' + item.entity_id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        })
        if (!res.ok) throw new Error('Failed to update task')
        await db.tasks.update(item.entity_id, { is_dirty: false, synced_at: Date.now() })
        break
      }
      case 'chat_create': {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        })
        if (!res.ok) throw new Error('Failed to send chat')
        const msg = await res.json()
        await db.chatMessages.delete(item.entity_id)
        await db.chatMessages.put({ ...msg, synced_at: Date.now(), is_dirty: false })
        break
      }
    }
  }

  // Update ref whenever syncPendingChanges changes
  useEffect(() => {
    syncPendingChangesRef.current = syncPendingChanges
  }, [syncPendingChanges])

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingChanges()
    }
  }, [isOnline, pendingCount, syncPendingChanges])

  useEffect(() => {
    if (isOnline) {
      syncIntervalRef.current = setInterval(() => {
        if (pendingCount > 0) syncPendingChanges()
      }, 30000)
    }
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
  }, [isOnline, pendingCount, syncPendingChanges])

  const cachePodData = useCallback(async (
    podId: string,
    podData: {
      pod: { id: string; npn: string; title: string; summary: string | null; avatar_url: string | null; founder_id: string; storage_used_bytes: number };
      role: 'founder' | 'member';
      projects: Array<{ id: string; pod_id: string; name: string; description: string | null; created_by: string }>;
      tasks: Array<{ id: string; project_id: string; name: string; description: string; due_date: string; assigned_to: string | null; status: 'not_started' | 'ongoing' | 'completed'; priority: 'low' | 'medium' | 'high'; created_by: string }>;
      members: Array<{ id: string; pod_id: string; user_id: string; role: 'founder' | 'member'; profiles: { display_name: string | null; email: string; avatar_url: string | null } }>;
      chatMessages: Array<{ id: string; pod_id: string; user_id: string; content: string; created_at: string }>;
    }
  ) => {
    const now = Date.now()
    
    await db.pods.put({
      ...podData.pod,
      role: podData.role,
      synced_at: now,
    })

    await db.projects.bulkPut(
      podData.projects.map(p => ({ ...p, synced_at: now }))
    )

    const existingTasks = await db.tasks.where('project_id').anyOf(podData.projects.map(p => p.id)).toArray()
    const dirtyTaskIds = new Set(existingTasks.filter(t => t.is_dirty).map(t => t.id))
    
    for (const task of podData.tasks) {
      if (!dirtyTaskIds.has(task.id)) {
        await db.tasks.put({ ...task, synced_at: now, is_dirty: false })
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
        synced_at: now,
      }))
    )

    const existingMessages = await db.chatMessages.where('pod_id').equals(podId).toArray()
    const dirtyMessageIds = new Set(existingMessages.filter(m => m.is_dirty).map(m => m.id))
    
    for (const msg of podData.chatMessages) {
      if (!dirtyMessageIds.has(msg.id)) {
        await db.chatMessages.put({ ...msg, synced_at: now, is_dirty: false })
      }
    }

    await setLastSyncTime(podId)
  }, [])

  const createTaskOffline = useCallback(async (taskData: {
    project_id: string
    name: string
    description: string
    due_date: string
    assigned_to: string | null
    priority: 'low' | 'medium' | 'high'
  }, createdBy: string) => {
    const localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    const offlineTask = {
      id: localId,
      ...taskData,
      status: 'not_started' as const,
      created_by: createdBy,
      synced_at: Date.now(),
      is_dirty: true,
      local_id: localId,
    }

    await db.tasks.put(offlineTask)
    await db.pendingSync.add({
      type: 'task_create',
      entity_id: localId,
      data: taskData,
      created_at: Date.now(),
      retries: 0,
    })

    await updatePendingCount()
    return offlineTask
  }, [])

  const updateTaskOffline = useCallback(async (taskId: string, updates: { status?: string }) => {
    await db.tasks.update(taskId, { ...updates, is_dirty: true })
    
    await db.pendingSync.add({
      type: 'task_update',
      entity_id: taskId,
      data: updates,
      created_at: Date.now(),
      retries: 0,
    })

    await updatePendingCount()
  }, [])

  const sendChatOffline = useCallback(async (podId: string, content: string, userId: string) => {
    const localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    const offlineMessage = {
      id: localId,
      pod_id: podId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      synced_at: Date.now(),
      is_dirty: true,
      local_id: localId,
    }

    await db.chatMessages.put(offlineMessage)
    await db.pendingSync.add({
      type: 'chat_create',
      entity_id: localId,
      data: { pod_id: podId, content },
      created_at: Date.now(),
      retries: 0,
    })

    await updatePendingCount()
    return offlineMessage
  }, [])

  const getOfflinePods = useCallback(async () => {
    return await db.pods.toArray()
  }, [])

  const getOfflineProjects = useCallback(async (podId: string) => {
    return await db.projects.where('pod_id').equals(podId).toArray()
  }, [])

  const getOfflineTasks = useCallback(async (projectIds: string[]) => {
    return await db.tasks.where('project_id').anyOf(projectIds).toArray()
  }, [])

  const getOfflineMembers = useCallback(async (podId: string) => {
    return await db.members.where('pod_id').equals(podId).toArray()
  }, [])

  const getOfflineChat = useCallback(async (podId: string) => {
    return await db.chatMessages.where('pod_id').equals(podId).sortBy('created_at')
  }, [])

  return {
    // Treat null (unknown/loading) as online to avoid flash of offline UI
    isOnline: isOnline !== false,
    isSyncing,
    pendingCount,
    syncPendingChanges,
    cachePodData,
    createTaskOffline,
    updateTaskOffline,
    sendChatOffline,
    getOfflinePods,
    getOfflineProjects,
    getOfflineTasks,
    getOfflineMembers,
    getOfflineChat,
  }
}

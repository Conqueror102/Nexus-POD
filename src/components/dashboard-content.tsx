"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/offline-db"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
  Hexagon, Plus, FolderKanban, Users, MessageSquare,
  Loader2, Copy, Check, Send, MoreVertical, Trash2, Link as LinkIcon,
  BarChart3, Search, Download, Filter, HardDrive, Menu, Image as ImageIcon
} from "lucide-react"
import { format, formatDistanceToNow, isPast } from "date-fns"
import type { PodWithRole, Project, Task, Notification, ActivityLog, PodFileWithProfile } from "@/lib/types"
import { SplashScreen } from "@/components/splash-screen"
import { ErrorBoundary } from "@/components/error-boundary"
import { FilePreview } from "@/components/file-preview"
import { OfflineIndicator } from "@/components/offline-indicator"
import { PodAvatarUpload } from "@/components/pod-avatar-upload"
import { useOfflineSync } from "@/hooks/use-offline-sync"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  OverviewTab, ProjectsTab, MembersTab, FilesTab, ChatTab, DashboardSidebar, MobileMenuButton,
  TaskWithAssignee, PodMemberWithProfile, ChatMessageWithProfile, TaskCommentWithProfile, statusColors,
} from "@/components/dashboard"
import { DeletePodDialog } from "@/components/delete-pod-dialog"

export function DashboardContent() {
  const { user, signOut } = useAuth()
  const supabase = createClient()
  const { isOnline, isSyncing, pendingCount, syncPendingChanges, cachePodData } = useOfflineSync()
  
  const [pods, setPods] = useState<PodWithRole[]>([])
  const [selectedPod, setSelectedPod] = useState<PodWithRole | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([])
  const [members, setMembers] = useState<PodMemberWithProfile[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessageWithProfile[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [podSettingsOpen, setPodSettingsOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignee | null>(null)
  const [taskComments, setTaskComments] = useState<TaskCommentWithProfile[]>([])

  const [newComment, setNewComment] = useState("")
  const [chatMessage, setChatMessage] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [showSplash, setShowSplash] = useState(true)
  const [podFiles, setPodFiles] = useState<PodFileWithProfile[]>([])
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; mime_type: string | null } | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const [inviteLink, setInviteLink] = useState("")
  const [inviteCopied, setInviteCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletePodDialogOpen, setDeletePodDialogOpen] = useState(false)

  const fetchPods = useCallback(async () => {
    try {
      // If offline, load from IndexedDB
      if (!isOnline) {
        try {
          const offlinePods = await db.pods.toArray()
          setPods(offlinePods)
          if (offlinePods.length > 0 && !selectedPod) {
            setSelectedPod(offlinePods[0])
          }
          setLoading(false)
          return
        } catch (error) {
          console.error('Error loading offline pods:', error)
        }
      }

      try {
        const res = await fetch("/api/pods", { signal: AbortSignal.timeout(10000) })
        if (res.ok) {
          const data = await res.json()
          setPods(data)
          // Save to offline DB
          data.forEach(pod => db.pods.put({ ...pod, synced_at: Date.now() }))
          if (data.length > 0 && !selectedPod) {
            setSelectedPod(data[0])
          }
        } else {
          // If fetch fails, try to load from IndexedDB
          const offlinePods = await db.pods.toArray()
          setPods(offlinePods)
          if (offlinePods.length > 0 && !selectedPod) {
            setSelectedPod(offlinePods[0])
          }
        }
      } catch (fetchError) {
        console.warn('Error fetching pods from API, loading from offline DB:', fetchError)
        // Load from offline DB as fallback
        try {
          const offlinePods = await db.pods.toArray()
          setPods(offlinePods)
          if (offlinePods.length > 0 && !selectedPod) {
            setSelectedPod(offlinePods[0])
          }
        } catch (dbError) {
          console.error('Error loading offline pods:', dbError)
          setPods([])
        }
      }
    } finally {
      setLoading(false)
    }
  }, [isOnline, selectedPod])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (error) {
      console.warn('Error fetching notifications:', error)
      // Silently fail, notifications are not critical
    }
  }, [])

  useEffect(() => {
    fetchPods()
    fetchNotifications()
  }, [fetchPods, fetchNotifications])

  useEffect(() => {
    if (selectedPod) fetchPodData()
  }, [selectedPod])

  const fetchPodData = useCallback(async () => {
    if (!selectedPod) return

    try {
      // If offline, load from IndexedDB
      if (!isOnline) {
        try {
          const offlineProjects = await db.projects.where('pod_id').equals(selectedPod.id).toArray()
          const offlineTasks = await db.tasks.where('project_id').anyOf(offlineProjects.map(p => p.id)).toArray()
          const offlineMessages = await db.chatMessages.where('pod_id').equals(selectedPod.id).toArray()
          
          setProjects(offlineProjects)
          setTasks(offlineTasks)
          setChatMessages(offlineMessages)
          setMembers([])
          setActivityLogs([])
          setPodFiles([])
          return
        } catch (error) {
          console.error('Error loading offline data:', error)
          // Continue to try API
        }
      }

      const [projectsRes, tasksRes, membersRes, chatRes, activityRes, filesRes] = await Promise.all([
        fetch(`/api/projects?pod_id=${selectedPod.id}`, { signal: AbortSignal.timeout(10000) }).catch(e => ({ ok: false })),
        fetch(`/api/tasks?pod_id=${selectedPod.id}`, { signal: AbortSignal.timeout(10000) }).catch(e => ({ ok: false })),
        fetch(`/api/pods/${selectedPod.id}/members`, { signal: AbortSignal.timeout(10000) }).catch(e => ({ ok: false })),
        fetch(`/api/chat?pod_id=${selectedPod.id}`, { signal: AbortSignal.timeout(10000) }).catch(e => ({ ok: false })),
        fetch(`/api/activity?pod_id=${selectedPod.id}`, { signal: AbortSignal.timeout(10000) }).catch(e => ({ ok: false })),
        fetch(`/api/files?pod_id=${selectedPod.id}`, { signal: AbortSignal.timeout(10000) }).catch(e => ({ ok: false })),
      ])

      // Check if all API calls failed - if so, load from IndexedDB
      const allFailed = !projectsRes.ok && !tasksRes.ok && !membersRes.ok && !chatRes.ok
      
      if (allFailed) {
        // All API calls failed, load from IndexedDB
        try {
          const offlineProjects = await db.projects.where('pod_id').equals(selectedPod.id).toArray()
          const offlineTasks = await db.tasks.where('project_id').anyOf(offlineProjects.map(p => p.id)).toArray()
          const offlineMessages = await db.chatMessages.where('pod_id').equals(selectedPod.id).toArray()
          const offlineMembers = await db.members.where('pod_id').equals(selectedPod.id).toArray()
          
          setProjects(offlineProjects)
          setTasks(offlineTasks)
          setChatMessages(offlineMessages)
          setMembers(offlineMembers.map(m => ({
            id: m.id,
            pod_id: m.pod_id,
            user_id: m.user_id,
            role: m.role,
            profiles: {
              display_name: m.display_name,
              email: m.email,
              avatar_url: m.avatar_url,
            }
          })))
          setActivityLogs([])
          setPodFiles([])
          return
        } catch (dbError) {
          console.error('Error loading offline data:', dbError)
          // Continue to try API data if available
        }
      }

      const projectsData = projectsRes.ok ? await projectsRes.json().catch(() => []) : []
      const tasksData = tasksRes.ok ? await tasksRes.json().catch(() => []) : []
      const membersData = membersRes.ok ? await membersRes.json().catch(() => []) : []
      const chatData = chatRes.ok ? await chatRes.json().catch(() => []) : []
      const activityData = activityRes.ok ? await activityRes.json().catch(() => []) : []
      const filesData = filesRes.ok ? await filesRes.json().catch(() => []) : []

      // If some API calls failed, merge with offline data
      if (!projectsRes.ok || !tasksRes.ok || !chatRes.ok) {
        try {
          const offlineProjects = await db.projects.where('pod_id').equals(selectedPod.id).toArray()
          const offlineTasks = await db.tasks.where('project_id').anyOf((projectsData.length > 0 ? projectsData : offlineProjects).map(p => p.id)).toArray()
          const offlineMessages = await db.chatMessages.where('pod_id').equals(selectedPod.id).toArray()
          
          setProjects(projectsData.length > 0 ? projectsData : offlineProjects)
          setTasks(tasksData.length > 0 ? tasksData : offlineTasks)
          setChatMessages(chatData.length > 0 ? chatData : offlineMessages)
        } catch (dbError) {
          console.error('Error merging offline data:', dbError)
        }
      } else {
        setProjects(projectsData)
        setTasks(tasksData)
        setChatMessages(chatData)
      }

      setMembers(membersData)
      setActivityLogs(activityData)
      setPodFiles(filesData)

      if (isOnline && projectsRes.ok) {
        cachePodData(selectedPod.id, {
          pod: selectedPod,
          role: selectedPod.role,
          projects: projectsData,
          tasks: tasksData,
          members: membersData,
          chatMessages: chatData,
        })
      }
    } catch (error) {
      console.warn('Error fetching pod data:', error)
      // Try to load from offline DB as last resort
      try {
        const offlineProjects = await db.projects.where('pod_id').equals(selectedPod.id).toArray()
        const offlineTasks = await db.tasks.where('project_id').anyOf(offlineProjects.map(p => p.id)).toArray()
        const offlineMessages = await db.chatMessages.where('pod_id').equals(selectedPod.id).toArray()
        
        setProjects(offlineProjects)
        setTasks(offlineTasks)
        setChatMessages(offlineMessages)
      } catch (dbError) {
        console.error('Error loading offline fallback data:', dbError)
      }
    }
  }, [selectedPod, isOnline, cachePodData])

  useEffect(() => {
    if (!selectedPod || !user) return

    const channel = supabase
      .channel(`pod-${selectedPod.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `pod_id=eq.${selectedPod.id}` }, async (payload) => {
        const { data: message } = await supabase
          .from('chat_messages')
          .select(`*, profiles:user_id (id, display_name, email, avatar_url)`)
          .eq('id', payload.new.id)
          .single()
        if (message) setChatMessages(prev => [...prev, message as ChatMessageWithProfile])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchPodData())
      .subscribe()

    const notifChannel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, async (payload) => {
        const { data: notification } = await supabase
          .from('notifications')
          .select(`*, pods (id, title, npn), tasks (id, name)`)
          .eq('id', payload.new.id)
          .single()
        if (notification) {
          setNotifications(prev => [notification as Notification, ...prev])
          toast(notification.title, { description: notification.message })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(notifChannel)
    }
  }, [selectedPod, user, supabase, fetchPodData])

  async function handleCreatePod(title: string, summary: string) {
    try {
      // Check if online
      if (!navigator.onLine) {
        // Save offline pod to IndexedDB
        const offlinePod = {
          id: `local_${Date.now()}`,
          npn: `NP-${Math.floor(Math.random() * 100000)}`,
          title,
          summary: summary || null,
          avatar_url: null,
          founder_id: user?.id || '',
          storage_used_bytes: 0,
          role: 'founder' as const,
          synced_at: 0,
        }
        await db.pods.add(offlinePod)
        
        // Add to pending sync
        await db.pendingSync.add({
          type: 'task_create',
          entity_id: offlinePod.id,
          data: { title, summary, type: 'pod' },
          created_at: Date.now(),
          retries: 0,
        })
        
        setPods(prev => [offlinePod, ...prev])
        setSelectedPod(offlinePod)
        toast.success("Pod saved offline. It will sync when you're back online.")
        return
      }

      const res = await fetch("/api/pods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary }),
      })
      if (res.ok) {
        const pod = await res.json()
        // Save to offline DB as synced
        await db.pods.put({ ...pod, role: 'founder', synced_at: Date.now() })
        setPods(prev => [{ ...pod, role: 'founder' }, ...prev])
        setSelectedPod({ ...pod, role: 'founder' })
        toast.success("Pod created successfully!")
      }
    } catch (error) {
      console.error('Pod creation error:', error)
      // If network error, save offline
      if (!navigator.onLine) {
        const offlinePod = {
          id: `local_${Date.now()}`,
          npn: `NP-${Math.floor(Math.random() * 100000)}`,
          title,
          summary: summary || null,
          avatar_url: null,
          founder_id: user?.id || '',
          storage_used_bytes: 0,
          role: 'founder' as const,
          synced_at: 0,
        }
        await db.pods.add(offlinePod)
        setPods(prev => [offlinePod, ...prev])
        toast.success("Pod saved offline. It will sync when you're back online.")
      } else {
        toast.error("Failed to create pod")
      }
    }
  }

  async function handleCreateProject(name: string, description: string) {
    if (!selectedPod) return
    try {
      if (!navigator.onLine) {
        const offlineProject = {
          id: `local_${Date.now()}`,
          pod_id: selectedPod.id,
          name,
          description: description || null,
          created_by: user?.id || '',
          synced_at: 0,
        }
        await db.projects.add(offlineProject)
        await db.pendingSync.add({
          type: 'task_create',
          entity_id: offlineProject.id,
          data: { pod_id: selectedPod.id, name, description, type: 'project' },
          created_at: Date.now(),
          retries: 0,
        })
        setProjects(prev => [offlineProject, ...prev])
        toast.success("Project saved offline. It will sync when you're back online.")
        return
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pod_id: selectedPod.id, name, description }),
      })
      if (res.ok) {
        const project = await res.json()
        await db.projects.put({ ...project, synced_at: Date.now() })
        setProjects(prev => [project, ...prev])
        toast.success("Project created successfully!")
      }
    } catch (error) {
      console.error('Project creation error:', error)
      if (!navigator.onLine) {
        const offlineProject = {
          id: `local_${Date.now()}`,
          pod_id: selectedPod.id,
          name,
          description: description || null,
          created_by: user?.id || '',
          synced_at: 0,
        }
        await db.projects.add(offlineProject)
        setProjects(prev => [offlineProject, ...prev])
        toast.success("Project saved offline. It will sync when you're back online.")
      } else {
        toast.error("Failed to create project")
      }
    }
  }

  async function handleCreateTask(data: { project_id: string; name: string; description: string; due_date: string; assigned_to: string; priority: "low" | "medium" | "high" }) {
    try {
      if (!navigator.onLine) {
        const offlineTask = {
          id: `local_${Date.now()}`,
          project_id: data.project_id,
          name: data.name,
          description: data.description,
          due_date: new Date(data.due_date).toISOString(),
          assigned_to: data.assigned_to || null,
          status: 'not_started' as const,
          priority: data.priority,
          created_by: user?.id || '',
          synced_at: 0,
          is_dirty: true,
        }
        await db.tasks.add(offlineTask)
        await db.pendingSync.add({
          type: 'task_create',
          entity_id: offlineTask.id,
          data: { ...data, due_date: new Date(data.due_date).toISOString(), assigned_to: data.assigned_to || null, type: 'task' },
          created_at: Date.now(),
          retries: 0,
        })
        fetchPodData()
        toast.success("Task saved offline. It will sync when you're back online.")
        return
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, due_date: new Date(data.due_date).toISOString(), assigned_to: data.assigned_to || null }),
      })
      if (res.ok) {
        const task = await res.json()
        await db.tasks.put({ ...task, synced_at: Date.now(), is_dirty: false })
        fetchPodData()
        toast.success("Task created successfully!")
      }
    } catch (error) {
      console.error('Task creation error:', error)
      if (!navigator.onLine) {
        const offlineTask = {
          id: `local_${Date.now()}`,
          project_id: data.project_id,
          name: data.name,
          description: data.description,
          due_date: new Date(data.due_date).toISOString(),
          assigned_to: data.assigned_to || null,
          status: 'not_started' as const,
          priority: data.priority,
          created_by: user?.id || '',
          synced_at: 0,
          is_dirty: true,
        }
        await db.tasks.add(offlineTask)
        fetchPodData()
        toast.success("Task saved offline. It will sync when you're back online.")
      } else {
        toast.error("Failed to create task")
      }
    }
  }

  async function handleCreateInvite() {
    if (!selectedPod) return
    setSubmitting(true)
    const res = await fetch(`/api/pods/${selectedPod.id}/invite`, { method: "POST" })
    if (res.ok) {
      const invite = await res.json()
      setInviteLink(`${window.location.origin}/join/${invite.invite_code}`)
    }
    setSubmitting(false)
  }

  async function copyInviteLink() {
    await navigator.clipboard.writeText(inviteLink)
    setInviteCopied(true)
    toast.success("Invite link copied!")
    setTimeout(() => setInviteCopied(false), 2000)
  }

  async function handleUpdateTaskStatus(taskId: string, status: string) {
    await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    fetchPodData()
  }

  async function handleSendChat() {
    if (!chatMessage.trim() || !selectedPod) return
    try {
      const tempMessage = chatMessage
      setChatMessage("")

      if (!navigator.onLine) {
        const offlineMessage = {
          id: `local_${Date.now()}`,
          pod_id: selectedPod.id,
          user_id: user?.id || '',
          content: tempMessage,
          created_at: new Date().toISOString(),
          synced_at: 0,
          is_dirty: true,
        }
        await db.chatMessages.add(offlineMessage)
        await db.pendingSync.add({
          type: 'chat_create',
          entity_id: offlineMessage.id,
          data: { pod_id: selectedPod.id, content: tempMessage },
          created_at: Date.now(),
          retries: 0,
        })
        // Add to local chat display
        setChatMessages(prev => [...prev, offlineMessage])
        toast.success("Message saved offline. It will send when you're back online.")
        return
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pod_id: selectedPod.id, content: tempMessage })
      })
      if (res.ok) {
        const message = await res.json()
        await db.chatMessages.put({ ...message, synced_at: Date.now(), is_dirty: false })
        setChatMessages(prev => [...prev, message])
      }
    } catch (error) {
      console.error('Chat error:', error)
      if (!navigator.onLine) {
        // Restore message and mark for retry
        setChatMessage(chatMessage)
        toast.success("Message saved offline. It will send when you're back online.")
      } else {
        toast.error("Failed to send message")
      }
    }
  }

  async function openTaskDetail(task: TaskWithAssignee) {
    setSelectedTask(task)
    setTaskDetailOpen(true)
    const res = await fetch(`/api/tasks/${task.id}/comments`)
    if (res.ok) setTaskComments(await res.json())
  }

  async function handleAddComment() {
    if (!newComment.trim() || !selectedTask) return
    setSubmitting(true)
    const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newComment }) })
    if (res.ok) {
      const comment = await res.json()
      setTaskComments(prev => [...prev, comment])
      setNewComment("")
    }
    setSubmitting(false)
  }

  async function handleRemoveMember(userId: string) {
    if (!selectedPod) return
    await fetch(`/api/pods/${selectedPod.id}/members`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) })
    fetchPodData()
    toast.success("Member removed")
  }

  async function handleDeletePod() {
    setDeletePodDialogOpen(true)
  }

  function handleDeletePodSuccess() {
    if (selectedPod) {
      setPods(prev => prev.filter(p => p.id !== selectedPod.id))
      setSelectedPod(pods.find(p => p.id !== selectedPod.id) || null)
    }
  }

  async function handleMarkAllNotificationsRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mark_all_read: true }) })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function handleMarkNotificationRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notification_id: id }) })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function handleFileDelete(fileId: string) {
    const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" })
    if (res.ok) { toast.success("File deleted"); fetchPodData() }
    else toast.error("Failed to delete file")
  }

  async function handleFilePreview(file: PodFileWithProfile) {
    const res = await fetch(`/api/files/${file.id}`)
    if (res.ok) {
      const { url } = await res.json()
      setPreviewFile({ name: file.name, url, mime_type: file.mime_type })
      setPreviewOpen(true)
    } else toast.error("Failed to load file preview")
  }

  async function handleFileDownload(file: PodFileWithProfile) {
    const res = await fetch(`/api/files/${file.id}`)
    if (res.ok) {
      const { url } = await res.json()
      const link = document.createElement("a")
      link.href = url; link.download = file.name; link.target = "_blank"
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
    }
  }

  async function handleExport(format: "json" | "csv") {
    if (!selectedPod) return
    const res = await fetch(`/api/export?pod_id=${selectedPod.id}&format=${format}`)
    if (res.ok) {
      if (format === "csv") {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a"); a.href = url; a.download = `${selectedPod.title}-tasks.csv`; a.click(); URL.revokeObjectURL(url)
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a"); a.href = url; a.download = `${selectedPod.title}-export.json`; a.click(); URL.revokeObjectURL(url)
      }
      toast.success(`Exported as ${format.toUpperCase()}`)
    }
  }

  function handlePodAvatarChange(url: string) {
    if (selectedPod) {
      const updatedPod = { ...selectedPod, avatar_url: url }
      setSelectedPod(updatedPod)
      setPods(prev => prev.map(p => p.id === selectedPod.id ? updatedPod : p))
    }
  }

  const isFounder = selectedPod?.role === "founder"

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <DashboardSidebar
          user={user}
          pods={pods}
          selectedPod={selectedPod}
          notifications={notifications}
          onSelectPod={setSelectedPod}
          onCreatePod={handleCreatePod}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onSignOut={signOut}
          isOpen={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
        />

        <main className="md:ml-72 min-h-screen">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b md:hidden px-4 py-3 flex items-center justify-between">
            <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
            <span className="font-semibold">{selectedPod?.title || "Dashboard"}</span>
            <OfflineIndicator isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingCount} onSync={syncPendingChanges} />
          </div>

          <div className="p-4 md:p-6">
            {selectedPod ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 hidden md:flex">
                      <AvatarImage src={selectedPod.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">{selectedPod.title.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-xl md:text-2xl font-semibold">{selectedPod.title}</h1>
                        <Badge variant="outline" className="hidden sm:inline-flex">{selectedPod.npn}</Badge>
                      </div>
                      {selectedPod.summary && <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{selectedPod.summary}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="hidden md:block">
                      <OfflineIndicator isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingCount} onSync={syncPendingChanges} />
                    </div>
                    
                    <div className="relative flex-1 md:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full md:w-40" />
                    </div>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-24 md:w-28"><Filter className="w-3 h-3 mr-1 hidden md:inline" /><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-24 md:w-28"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><Download className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExport("json")}>Export JSON</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport("csv")}>Export CSV</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {isFounder && (
                      <>
                        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                          <DialogTrigger asChild><Button variant="outline" className="flex"><Users className="w-4 h-4 mr-2" />Invite</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Invite Team Members</DialogTitle><DialogDescription>Share this link to invite people</DialogDescription></DialogHeader>
                            <div className="space-y-4 py-4">
                              {inviteLink ? (
                                <div className="flex gap-2">
                                  <Input value={inviteLink} readOnly />
                                  <Button onClick={copyInviteLink} variant="secondary">{inviteCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
                                </div>
                              ) : (
                                <Button onClick={handleCreateInvite} disabled={submitting} className="w-full">{submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LinkIcon className="w-4 h-4 mr-2" />}Generate Invite Link</Button>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={podSettingsOpen} onOpenChange={setPodSettingsOpen}>
                          <DialogTrigger asChild><Button variant="outline" size="icon"><ImageIcon className="w-4 h-4" /></Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Pod Settings</DialogTitle><DialogDescription>Customize your pod</DialogDescription></DialogHeader>
                            <div className="py-4 space-y-6">
                              <PodAvatarUpload podId={selectedPod.id} currentAvatar={selectedPod.avatar_url} podTitle={selectedPod.title} onAvatarChange={handlePodAvatarChange} />
                            </div>
                          </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDeletePod} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete Pod</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="w-full md:w-auto overflow-x-auto">
                    <TabsTrigger value="overview" className="flex-1 md:flex-none"><BarChart3 className="w-4 h-4 mr-2 hidden sm:inline" />Overview</TabsTrigger>
                    <TabsTrigger value="projects" className="flex-1 md:flex-none"><FolderKanban className="w-4 h-4 mr-2 hidden sm:inline" />Projects</TabsTrigger>
                    <TabsTrigger value="members" className="flex-1 md:flex-none"><Users className="w-4 h-4 mr-2 hidden sm:inline" />Team</TabsTrigger>
                    <TabsTrigger value="files" className="flex-1 md:flex-none"><HardDrive className="w-4 h-4 mr-2 hidden sm:inline" />Files</TabsTrigger>
                    <TabsTrigger value="chat" className="flex-1 md:flex-none"><MessageSquare className="w-4 h-4 mr-2 hidden sm:inline" />Chat</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview"><OverviewTab tasks={tasks} activityLogs={activityLogs} user={user} onTaskClick={openTaskDetail} /></TabsContent>
                  <TabsContent value="projects"><ProjectsTab projects={projects} tasks={tasks} members={members} isFounder={isFounder} searchQuery={searchQuery} filterPriority={filterPriority} filterStatus={filterStatus} onTaskClick={openTaskDetail} onUpdateTaskStatus={handleUpdateTaskStatus} onCreateProject={handleCreateProject} onCreateTask={handleCreateTask} /></TabsContent>
                  <TabsContent value="members"><MembersTab members={members} isFounder={isFounder} onRemoveMember={handleRemoveMember} /></TabsContent>
                  <TabsContent value="files"><FilesTab selectedPod={selectedPod} podFiles={podFiles} isFounder={isFounder} user={user} onFilePreview={handleFilePreview} onFileDownload={handleFileDownload} onFileDelete={handleFileDelete} fetchPodData={fetchPodData} /></TabsContent>
                  <TabsContent value="chat"><ChatTab chatMessages={chatMessages} user={user} chatMessage={chatMessage} onChatMessageChange={setChatMessage} onSendChat={handleSendChat} /></TabsContent>
                </Tabs>

                <Dialog open={taskDetailOpen} onOpenChange={setTaskDetailOpen}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedTask && (
                      <>
                        <DialogHeader>
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${statusColors[selectedTask.status]}`} />
                            <DialogTitle>{selectedTask.name}</DialogTitle>
                          </div>
                          <DialogDescription>{selectedTask.projects?.name}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div><h4 className="text-sm font-medium mb-2">Description</h4><p className="text-muted-foreground text-sm">{selectedTask.description}</p></div>
                          <div className="flex gap-4 flex-wrap">
                            <div><h4 className="text-sm font-medium mb-1">Due Date</h4><p className={`text-sm ${isPast(new Date(selectedTask.due_date)) && selectedTask.status !== "completed" ? "text-destructive" : "text-muted-foreground"}`}>{format(new Date(selectedTask.due_date), "PPpp")}</p></div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Status</h4>
                              <Select value={selectedTask.status} onValueChange={(val) => { handleUpdateTaskStatus(selectedTask.id, val); setSelectedTask({ ...selectedTask, status: val as Task["status"] }) }} disabled={!isFounder && selectedTask.assigned_to !== user?.id}>
                                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_started">Not Started</SelectItem>
                                  <SelectItem value="ongoing">Ongoing</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div><h4 className="text-sm font-medium mb-1">Assignee</h4><p className="text-sm text-muted-foreground">{selectedTask.profiles?.display_name || selectedTask.profiles?.email || "Unassigned"}</p></div>
                          </div>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium mb-3">Comments</h4>
                            <ScrollArea className="h-48 pr-4">
                              <div className="space-y-3">
                                {taskComments.map((comment) => (
                                  <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8"><AvatarImage src={comment.profiles?.avatar_url || undefined} /><AvatarFallback className="text-xs">{comment.profiles?.display_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback></Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2"><span className="text-sm font-medium">{comment.profiles?.display_name}</span><span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span></div>
                                      <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                                {taskComments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>}
                              </div>
                            </ScrollArea>
                            <div className="flex gap-2 mt-4">
                              <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()} placeholder="Add a comment..." />
                              <Button onClick={handleAddComment} disabled={submitting || !newComment.trim()}><Send className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Hexagon className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-medium mb-2">No Pod Selected</h2>
                <p className="text-muted-foreground mb-4 text-center">Create or select a pod to get started</p>
                <Button onClick={() => setMobileMenuOpen(true)} className="md:hidden"><Plus className="w-4 h-4 mr-2" />Create Pod</Button>
              </div>
            )}
          </div>
        </main>
      </div>
      <FilePreview open={previewOpen} onOpenChange={setPreviewOpen} file={previewFile} />
      <DeletePodDialog 
        isOpen={deletePodDialogOpen}
        onOpenChange={setDeletePodDialogOpen}
        pod={selectedPod}
        onDeleteSuccess={handleDeletePodSuccess}
      />
    </ErrorBoundary>
  )
}

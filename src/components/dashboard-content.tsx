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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
  Hexagon, Plus, FolderKanban, Users, MessageSquare,
  Loader2, Copy, Check, Send, MoreVertical, Trash2, Link as LinkIcon,
  BarChart3, Search, Download, Filter, HardDrive, Menu, Image as ImageIcon, Settings
} from "lucide-react"
import { format, formatDistanceToNow, isPast } from "date-fns"
import type { PodWithRole, Project, Task, Notification, ActivityLog, PodFileWithProfile } from "@/lib/types"
import { SplashScreen } from "@/components/splash-screen"
import { ErrorBoundary } from "@/components/error-boundary"
import { FilePreview } from "@/components/file-preview"
import { OfflineIndicator } from "@/components/offline-indicator"
import { PodAvatarUpload } from "@/components/pod-avatar-upload"
import { PodSubscriptionManager } from "@/components/pod-subscription-manager"
import { useOfflineSync } from "@/hooks/use-offline-sync"
import { useReminders } from "@/hooks/use-reminders"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  OverviewTab, ProjectsTab, MembersTab, FilesTab, ChatTab, DashboardSidebar, MobileMenuButton,
  TaskWithAssignee, PodMemberWithProfile, ChatMessageWithProfile, TaskCommentWithProfile, statusColors,
} from "@/components/dashboard"
import { TaskComments } from "@/components/task-comments"
import { DeletePodDialog } from "@/components/delete-pod-dialog"

export function DashboardContent() {
  const { user, signOut } = useAuth()
  const supabase = createClient()
  const { 
    isOnline, isSyncing, pendingCount, syncPendingChanges, cachePodData,
    createTaskOffline, updateTaskOffline, deleteTaskOffline,
    createProjectOffline, updateProjectOffline, deleteProjectOffline,
    sendChatOffline, addCommentOffline
  } = useOfflineSync()
  
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

  const [editPodTitle, setEditPodTitle] = useState("")
  const [editPodSummary, setEditPodSummary] = useState("")

  const fetchPods = useCallback(async () => {
    try {
      if (!isOnline) {
        try {
          const offlinePods = await db.pods.toArray()
          setPods(offlinePods)
          if (offlinePods.length > 0 && !selectedPod) setSelectedPod(offlinePods[0])
          setLoading(false)
          return
        } catch (error) { console.error('Error loading offline pods:', error) }
      }

      try {
        const res = await fetch("/api/pods", { signal: AbortSignal.timeout(10000) })
        if (res.ok) {
          const data = await res.json()
          setPods(data)
          data.forEach(pod => db.pods.put({ ...pod, synced_at: Date.now() }))
          if (data.length > 0 && !selectedPod) setSelectedPod(data[0])
        } else {
          const offlinePods = await db.pods.toArray()
          setPods(offlinePods)
          if (offlinePods.length > 0 && !selectedPod) setSelectedPod(offlinePods[0])
        }
      } catch (fetchError) {
        const offlinePods = await db.pods.toArray()
        setPods(offlinePods)
        if (offlinePods.length > 0 && !selectedPod) setSelectedPod(offlinePods[0])
      }
    } finally { setLoading(false) }
  }, [isOnline, selectedPod])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { signal: AbortSignal.timeout(10000) })
      if (res.ok) setNotifications(await res.json())
    } catch (error) { console.warn('Error fetching notifications:', error) }
  }, [])

  useEffect(() => {
    fetchPods()
    fetchNotifications()
  }, [fetchPods, fetchNotifications])

  useReminders(tasks, user)

  useEffect(() => {
    if (selectedPod) {
      fetchPodData()
      setEditPodTitle(selectedPod.title)
      setEditPodSummary(selectedPod.summary || "")
    }
  }, [selectedPod])

  const fetchPodData = useCallback(async () => {
    if (!selectedPod) return

    try {
      if (!isOnline) {
        try {
          const offlineProjects = await db.projects.where('pod_id').equals(selectedPod.id).toArray()
          const offlineTasks = await db.tasks.where('project_id').anyOf(offlineProjects.map(p => p.id)).toArray()
          const offlineMessages = await db.chatMessages.where('pod_id').equals(selectedPod.id).toArray()
          const offlineMembers = await db.members.where('pod_id').equals(selectedPod.id).toArray()
          
          setProjects(offlineProjects)
          setTasks(offlineTasks as any)
          setChatMessages(offlineMessages as any)
          setMembers(offlineMembers.map(m => ({
            id: m.id,
            pod_id: m.pod_id,
            user_id: m.user_id,
            role: m.role,
            profiles: { display_name: m.display_name, email: m.email, avatar_url: m.avatar_url }
          })))
          setActivityLogs([])
          setPodFiles([])
          return
        } catch (error) { console.error('Error loading offline data:', error) }
      }

      const [projectsRes, tasksRes, membersRes, chatRes, activityRes, filesRes] = await Promise.all([
        fetch(`/api/projects?pod_id=${selectedPod.id}`, { signal: AbortSignal.timeout(10000) }).catch(() => ({ ok: false })),
        fetch(`/api/tasks?pod_id=${selectedPod.id}`, { signal: AbortSignal.timeout(10000) }).catch(() => ({ ok: false })),
        fetch(`/api/pods/${selectedPod.id}/members`, { signal: AbortSignal.timeout(10000) }).catch(() => ({ ok: false })),
        fetch(`/api/chat?pod_id=${selectedPod.id}`, { signal: AbortSignal.timeout(10000) }).catch(() => ({ ok: false })),
        fetch(`/api/activity?pod_id=${selectedPod.id}`, { signal: AbortSignal.timeout(10000) }).catch(() => ({ ok: false })),
        fetch(`/api/files?pod_id=${selectedPod.id}`, { signal: AbortSignal.timeout(10000) }).catch(() => ({ ok: false })),
      ])

      const projectsData = projectsRes.ok ? await (projectsRes as Response).json() : []
      const tasksData = tasksRes.ok ? await (tasksRes as Response).json() : []
      const membersData = membersRes.ok ? await (membersRes as Response).json() : []
      const chatData = chatRes.ok ? await (chatRes as Response).json() : []
      const activityData = activityRes.ok ? await (activityRes as Response).json() : []
      const filesData = filesRes.ok ? await (filesRes as Response).json() : []

      setProjects(projectsData)
      setTasks(tasksData)
      setChatMessages(chatData)
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
    } catch (error) { console.warn('Error fetching pod data:', error) }
  }, [selectedPod, isOnline, cachePodData])

  useEffect(() => {
    if (!selectedPod || !user) return

    const channel = supabase
      .channel(`pod-${selectedPod.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `pod_id=eq.${selectedPod.id}` }, async (payload) => {
        const { data: message } = await supabase.from('chat_messages').select(`*, profiles:user_id (id, display_name, email, avatar_url)`).eq('id', payload.new.id).single()
        if (message) setChatMessages(prev => [...prev, message as ChatMessageWithProfile])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchPodData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedPod, user, supabase, fetchPodData])

  async function handleCreatePod(title: string, summary: string) {
    try {
      if (!isOnline) {
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
        setSelectedPod(offlinePod)
        toast.success("Pod saved offline")
        return
      }

      const res = await fetch("/api/pods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, summary }) })
      if (res.ok) {
        const pod = await res.json()
        await db.pods.put({ ...pod, role: 'founder', synced_at: Date.now() })
        setPods(prev => [{ ...pod, role: 'founder' }, ...prev])
        setSelectedPod({ ...pod, role: 'founder' })
        toast.success("Pod created successfully!")
      }
    } catch (error) { toast.error("Failed to create pod") }
  }

  async function handleUpdatePod() {
    if (!selectedPod || !editPodTitle.trim()) return
    setSubmitting(true)
    try {
      if (!isOnline) {
        const updatedPod = { ...selectedPod, title: editPodTitle, summary: editPodSummary }
        await db.pods.put(updatedPod)
        setSelectedPod(updatedPod)
        setPods(prev => prev.map(p => p.id === selectedPod.id ? updatedPod : p))
        toast.success("Pod updated offline")
        setPodSettingsOpen(false)
        return
      }

      const res = await fetch(`/api/pods/${selectedPod.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editPodTitle, summary: editPodSummary })
      })
      if (res.ok) {
        const pod = await res.json()
        const updatedPod = { ...selectedPod, ...pod }
        await db.pods.put({ ...updatedPod, synced_at: Date.now() })
        setSelectedPod(updatedPod)
        setPods(prev => prev.map(p => p.id === selectedPod.id ? updatedPod : p))
        toast.success("Pod updated successfully")
        setPodSettingsOpen(false)
      }
    } finally { setSubmitting(false) }
  }

  async function handleCreateProject(name: string, description: string) {
    if (!selectedPod || !user) return
    if (!isOnline) {
      const offlineProject = await createProjectOffline({ pod_id: selectedPod.id, name, description }, user.id)
      setProjects(prev => [offlineProject as Project, ...prev])
      toast.success("Project saved offline")
      return
    }
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pod_id: selectedPod.id, name, description }) })
    if (res.ok) { fetchPodData(); toast.success("Project created") }
  }

  async function handleUpdateProject(id: string, name: string, description: string) {
    if (!isOnline) {
      await updateProjectOffline(id, { name, description })
      setProjects(prev => prev.map(p => p.id === id ? { ...p, name, description } : p))
      toast.success("Project updated offline")
      return
    }
    const res = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) })
    if (res.ok) { fetchPodData(); toast.success("Project updated") }
  }

  async function handleCreateTask(data: any) {
    if (!user) return
    if (!isOnline) {
      await createTaskOffline({ ...data, due_date: new Date(data.due_date).toISOString(), labels: [] }, user.id)
      fetchPodData(); toast.success("Task saved offline")
      return
    }
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, due_date: new Date(data.due_date).toISOString() }) })
    if (res.ok) { fetchPodData(); toast.success("Task created") }
  }

  async function handleUpdateTask(id: string, data: any) {
    if (!isOnline) {
      await updateTaskOffline(id, data)
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
      toast.success("Task updated offline")
      return
    }
    const res = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    if (res.ok) { fetchPodData(); toast.success("Task updated") }
  }

  async function handleUpdateTaskStatus(taskId: string, status: string) {
    if (!isOnline) {
      await updateTaskOffline(taskId, { status: status as any })
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: status as any } : t))
      toast.success("Status updated offline")
      return
    }
    await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    fetchPodData()
  }

  async function handleSendChat() {
    if (!chatMessage.trim() || !selectedPod || !user) return
    const tempMessage = chatMessage
    setChatMessage("")
    if (!isOnline) {
      const offlineMessage = await sendChatOffline(selectedPod.id, tempMessage, user.id)
      setChatMessages(prev => [...prev, { ...offlineMessage, profiles: user } as ChatMessageWithProfile])
      return
    }
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pod_id: selectedPod.id, content: tempMessage }) })
    if (res.ok) { const message = await res.json(); setChatMessages(prev => [...prev, message]) }
  }

  async function handleDeleteTask(taskId: string) {
    if (!isOnline) {
      await deleteTaskOffline(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      return
    }
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
    if (res.ok) { setTasks(prev => prev.filter(t => t.id !== taskId)); toast.success("Task deleted") }
  }

  async function handleDeleteProject(projectId: string) {
    if (!isOnline) {
      await deleteProjectOffline(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
      setTasks(prev => prev.filter(t => t.project_id !== projectId))
      return
    }
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
    if (res.ok) { setProjects(prev => prev.filter(p => p.id !== projectId)); fetchPodData(); toast.success("Project deleted") }
  }

  async function handleFilePreview(file: PodFileWithProfile) {
    const res = await fetch(`/api/files/${file.id}`)
    if (res.ok) {
      const { url } = await res.json()
      setPreviewFile({ name: file.name, url, mime_type: file.mime_type })
      setPreviewOpen(true)
    }
  }

  async function handleFileDownload(file: PodFileWithProfile) {
    try {
      const res = await fetch(`/api/files/${file.id}`)
      if (res.ok) {
        const { url } = await res.json()
        const response = await fetch(url)
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement("a"); link.href = blobUrl; link.download = file.name; link.click(); window.URL.revokeObjectURL(blobUrl)
      }
    } catch (error) { console.error("Download error:", error) }
  }

  async function handleFileDelete(fileId: string) {
    const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" })
    if (res.ok) { setPodFiles(prev => prev.filter(f => f.id !== fileId)); fetchPodData(); toast.success("File deleted") }
  }

  function handlePodAvatarChange(url: string) {
    if (selectedPod) {
      const updatedPod = { ...selectedPod, avatar_url: url }
      setSelectedPod(updatedPod)
      setPods(prev => prev.map(p => p.id === selectedPod.id ? updatedPod : p))
    }
  }

  async function handleCreateInvite() {
    if (!selectedPod) return
    setSubmitting(true)
    const res = await fetch(`/api/pods/${selectedPod.id}/invite`, { method: "POST" })
    if (res.ok) {
      const { code } = await res.json()
      setInviteLink(`${window.location.origin}/join/${code}`)
    }
    setSubmitting(false)
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteLink)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
    toast.success("Invite link copied")
  }

  async function handleRemoveMember(memberId: string) {
    if (!selectedPod) return
    const res = await fetch(`/api/pods/${selectedPod.id}/members?id=${memberId}`, { method: "DELETE" })
    if (res.ok) { setMembers(prev => prev.filter(m => m.id !== memberId)); toast.success("Member removed") }
  }

  async function handleMarkNotificationRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notification_id: id }) })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function handleMarkAllNotificationsRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mark_all: true }) })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  function openTaskDetail(task: TaskWithAssignee) {
    setSelectedTask(task)
    setTaskDetailOpen(true)
  }

  const isFounder = selectedPod?.role === "founder"

  const filteredTasksToDisplay = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority
    const matchesStatus = filterStatus === "all" || t.status === filterStatus
    const isVisibleToUser = isFounder || t.assigned_to === user?.id || t.created_by === user?.id
    return matchesSearch && matchesPriority && matchesStatus && isVisibleToUser
  })

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

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
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{selectedPod.title}</h1>
                        <Badge variant="outline" className="hidden sm:inline-flex font-mono">{selectedPod.npn}</Badge>
                      </div>
                      {selectedPod.summary && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium text-primary/80">Pod Summary</p>
                          <p className="text-muted-foreground text-sm line-clamp-2 bg-muted/30 p-2 rounded-md border border-border/50">
                            {selectedPod.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="hidden md:block"><OfflineIndicator isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingCount} onSync={syncPendingChanges} /></div>
                    <div className="relative flex-1 md:flex-none"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full md:w-40" /></div>
                    
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-24 md:w-28"><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-24 md:w-28"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="not_started">Not Started</SelectItem><SelectItem value="ongoing">Ongoing</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                    </Select>

                    {isFounder && (
                      <>
                        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                          <DialogTrigger asChild><Button variant="outline"><Users className="w-4 h-4 mr-2" />Invite</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Invite Team Members</DialogTitle><DialogDescription>Share this link to invite people</DialogDescription></DialogHeader>
                            <div className="space-y-4 py-4">
                              {inviteLink ? (
                                <div className="flex gap-2"><Input value={inviteLink} readOnly /><Button onClick={copyInviteLink} variant="secondary">{inviteCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button></div>
                              ) : (
                                <Button onClick={handleCreateInvite} disabled={submitting} className="w-full">{submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LinkIcon className="w-4 h-4 mr-2" />}Generate Invite Link</Button>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={podSettingsOpen} onOpenChange={setPodSettingsOpen}>
                          <DialogTrigger asChild><Button variant="outline" size="icon"><Settings className="w-4 h-4" /></Button></DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Pod Settings</DialogTitle><DialogDescription>Manage your pod details and subscription</DialogDescription></DialogHeader>
                            <Tabs defaultValue="general" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                              </TabsList>
                              <TabsContent value="general" className="py-4 space-y-4">
                                <div className="space-y-2">
                                  <Label>Pod Title</Label>
                                  <Input value={editPodTitle} onChange={(e) => setEditPodTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Pod Summary</Label>
                                  <Textarea value={editPodSummary} onChange={(e) => setEditPodSummary(e.target.value)} rows={3} />
                                </div>
                                <Button onClick={handleUpdatePod} disabled={submitting || !editPodTitle.trim()} className="w-full">{submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Changes"}</Button>
                              </TabsContent>
                              <TabsContent value="appearance" className="py-4"><PodAvatarUpload podId={selectedPod.id} currentAvatar={selectedPod.avatar_url} podTitle={selectedPod.title} onAvatarChange={handlePodAvatarChange} /></TabsContent>
                              <TabsContent value="subscription" className="py-4"><PodSubscriptionManager pod={selectedPod} isFounder={isFounder} memberCount={members.length} storageUsedBytes={selectedPod.storage_used_bytes || 0} /></TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setDeletePodDialogOpen(true)} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete Pod</DropdownMenuItem></DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="w-full md:w-auto overflow-x-auto">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
                      <TabsTrigger value="projects">Projects</TabsTrigger>
                      <TabsTrigger value="members">Team</TabsTrigger>
                      <TabsTrigger value="files">Files</TabsTrigger>
                      <TabsTrigger value="chat">Chat</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview"><OverviewTab tasks={tasks} activityLogs={activityLogs} user={user} onTaskClick={openTaskDetail} /></TabsContent>
                    <TabsContent value="deadlines">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-amber-500" />
                              All Upcoming Deadlines
                            </CardTitle>
                            <CardDescription>Comprehensive list of all tasks sorted by due date</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {tasks
                                .filter(t => t.status !== "completed")
                                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                                .map((task) => {
                                  const isOverdue = isPast(new Date(task.due_date))
                                  return (
                                    <div 
                                      key={task.id} 
                                      className={`flex items-center gap-4 p-4 rounded-xl border ${isOverdue ? "border-destructive/20 bg-destructive/5" : "bg-muted/30"} hover:bg-muted/50 transition-colors cursor-pointer`}
                                      onClick={() => openTaskDetail(task)}
                                    >
                                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColors[task.status]}`} />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold text-sm sm:text-base truncate">{task.name}</h4>
                                          <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'} className="text-[10px] h-4">
                                            {task.priority.toUpperCase()}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{task.projects?.name}</p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <p className={`text-xs font-bold ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                                          {format(new Date(task.due_date), "MMM d")}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                          {format(new Date(task.due_date), "HH:mm")}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              {tasks.filter(t => t.status !== "completed").length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                  <p>No upcoming deadlines. All caught up!</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    <TabsContent value="projects">

                    <ProjectsTab 
                      projects={projects} 
                      tasks={filteredTasksToDisplay} 
                      members={members} 
                      isFounder={isFounder} 
                      searchQuery={searchQuery} 
                      filterPriority={filterPriority} 
                      filterStatus={filterStatus} 
                      onTaskClick={openTaskDetail} 
                      onUpdateTaskStatus={handleUpdateTaskStatus} 
                      onCreateProject={handleCreateProject}
                      onUpdateProject={handleUpdateProject} 
                      onCreateTask={handleCreateTask}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                      onDeleteProject={handleDeleteProject}
                      user={user}
                    />
                  </TabsContent>
                  <TabsContent value="members"><MembersTab members={members} isFounder={isFounder} onRemoveMember={handleRemoveMember} /></TabsContent>
                  <TabsContent value="files"><FilesTab selectedPod={selectedPod} podFiles={podFiles} isFounder={isFounder} user={user} onFilePreview={handleFilePreview} onFileDownload={handleFileDownload} onFileDelete={handleFileDelete} fetchPodData={fetchPodData} /></TabsContent>
                  <TabsContent value="chat"><ChatTab chatMessages={chatMessages} user={user} chatMessage={chatMessage} onChatMessageChange={setChatMessage} onSendChat={handleSendChat} /></TabsContent>
                </Tabs>

                <Dialog open={taskDetailOpen} onOpenChange={setTaskDetailOpen}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedTask && (
                      <>
                        <DialogHeader>
                          <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${statusColors[selectedTask.status]}`} /><DialogTitle>{selectedTask.name}</DialogTitle></div>
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
                                <SelectContent><SelectItem value="not_started">Not Started</SelectItem><SelectItem value="ongoing">Ongoing</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                              </Select>
                            </div>
                            <div><h4 className="text-sm font-medium mb-1">Assignee</h4><p className="text-sm text-muted-foreground">{selectedTask.profiles?.display_name || selectedTask.profiles?.email || "Unassigned"}</p></div>
                          </div>
                          <Separator />
                          {selectedPod && user && <TaskComments taskId={selectedTask.id} podId={selectedPod.id} user={user} />}
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
      <DeletePodDialog isOpen={deletePodDialogOpen} onOpenChange={setDeletePodDialogOpen} pod={selectedPod} onDeleteSuccess={() => { setSelectedPod(null); fetchPods() }} />
    </ErrorBoundary>
  )
}

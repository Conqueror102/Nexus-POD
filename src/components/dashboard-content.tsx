"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"
import { 
  Hexagon, Plus, FolderKanban, Users, MessageSquare, LogOut, 
  Loader2, Copy, Check, Send, MoreVertical, Trash2, Link as LinkIcon,
  BarChart3, Search, Bell, Settings, User, Download, Filter, HardDrive
} from "lucide-react"
import { format, formatDistanceToNow, isPast } from "date-fns"
import type { PodWithRole, Project, Task, Profile, Notification, ActivityLog, PodFileWithProfile } from "@/lib/types"
import { SplashScreen } from "@/components/splash-screen"
import { ErrorBoundary } from "@/components/error-boundary"
import { FilePreview } from "@/components/file-preview"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  OverviewTab,
  ProjectsTab,
  MembersTab,
  FilesTab,
  ChatTab,
  TaskWithAssignee,
  PodMemberWithProfile,
  ChatMessageWithProfile,
  TaskCommentWithProfile,
  statusColors,
} from "@/components/dashboard"

export function DashboardContent() {
  const { user, signOut, refreshUser } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
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

  const [createPodOpen, setCreatePodOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignee | null>(null)
  const [taskComments, setTaskComments] = useState<TaskCommentWithProfile[]>([])

  const [newPodTitle, setNewPodTitle] = useState("")
  const [newPodSummary, setNewPodSummary] = useState("")
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

  const unreadNotifications = notifications.filter(n => !n.is_read)

  const fetchPods = useCallback(async () => {
    const res = await fetch("/api/pods")
    if (res.ok) {
      const data = await res.json()
      setPods(data)
      if (data.length > 0 && !selectedPod) {
        setSelectedPod(data[0])
      }
    }
    setLoading(false)
  }, [selectedPod])

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications")
    if (res.ok) {
      const data = await res.json()
      setNotifications(data)
    }
  }, [])

  useEffect(() => {
    fetchPods()
    fetchNotifications()
  }, [fetchPods, fetchNotifications])

  useEffect(() => {
    if (selectedPod) {
      fetchPodData()
    }
  }, [selectedPod])

  const fetchPodData = useCallback(async () => {
    if (!selectedPod) return

    const [projectsRes, tasksRes, membersRes, chatRes, activityRes, filesRes] = await Promise.all([
      fetch(`/api/projects?pod_id=${selectedPod.id}`),
      fetch(`/api/tasks?pod_id=${selectedPod.id}`),
      fetch(`/api/pods/${selectedPod.id}/members`),
      fetch(`/api/chat?pod_id=${selectedPod.id}`),
      fetch(`/api/activity?pod_id=${selectedPod.id}`),
      fetch(`/api/files?pod_id=${selectedPod.id}`),
    ])

    if (projectsRes.ok) setProjects(await projectsRes.json())
    if (tasksRes.ok) setTasks(await tasksRes.json())
    if (membersRes.ok) setMembers(await membersRes.json())
    if (chatRes.ok) setChatMessages(await chatRes.json())
    if (activityRes.ok) setActivityLogs(await activityRes.json())
    if (filesRes.ok) setPodFiles(await filesRes.json())
  }, [selectedPod])

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
        if (message) {
          setChatMessages(prev => [...prev, message as ChatMessageWithProfile])
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchPodData()
      })
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

  async function handleCreatePod() {
    if (!newPodTitle.trim()) return
    setSubmitting(true)

    const res = await fetch("/api/pods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newPodTitle, summary: newPodSummary }),
    })

    if (res.ok) {
      const pod = await res.json()
      setPods(prev => [{ ...pod, role: 'founder' }, ...prev])
      setSelectedPod({ ...pod, role: 'founder' })
      setCreatePodOpen(false)
      setNewPodTitle("")
      setNewPodSummary("")
      toast.success("Pod created successfully!")
    }
    setSubmitting(false)
  }

  async function handleCreateProject(name: string, description: string) {
    if (!selectedPod) return

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pod_id: selectedPod.id, name, description }),
    })

    if (res.ok) {
      const project = await res.json()
      setProjects(prev => [project, ...prev])
      toast.success("Project created successfully!")
    }
  }

  async function handleCreateTask(data: {
    project_id: string
    name: string
    description: string
    due_date: string
    assigned_to: string
    priority: "low" | "medium" | "high"
  }) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        due_date: new Date(data.due_date).toISOString(),
        assigned_to: data.assigned_to || null,
      }),
    })

    if (res.ok) {
      fetchPodData()
      toast.success("Task created successfully!")
    }
  }

  async function handleCreateInvite() {
    if (!selectedPod) return
    setSubmitting(true)

    const res = await fetch(`/api/pods/${selectedPod.id}/invite`, {
      method: "POST",
    })

    if (res.ok) {
      const invite = await res.json()
      const link = `${window.location.origin}/join/${invite.invite_code}`
      setInviteLink(link)
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
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    fetchPodData()
  }

  async function handleSendChat() {
    if (!chatMessage.trim() || !selectedPod) return

    const tempMessage = chatMessage
    setChatMessage("")

    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pod_id: selectedPod.id, content: tempMessage }),
    })
  }

  async function openTaskDetail(task: TaskWithAssignee) {
    setSelectedTask(task)
    setTaskDetailOpen(true)
    
    const res = await fetch(`/api/tasks/${task.id}/comments`)
    if (res.ok) {
      setTaskComments(await res.json())
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !selectedTask) return
    setSubmitting(true)

    const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    })

    if (res.ok) {
      const comment = await res.json()
      setTaskComments(prev => [...prev, comment])
      setNewComment("")
    }
    setSubmitting(false)
  }

  async function handleRemoveMember(userId: string) {
    if (!selectedPod) return

    await fetch(`/api/pods/${selectedPod.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    fetchPodData()
    toast.success("Member removed")
  }

  async function handleDeletePod() {
    if (!selectedPod) return

    await fetch(`/api/pods/${selectedPod.id}`, { method: "DELETE" })
    setPods(prev => prev.filter(p => p.id !== selectedPod.id))
    setSelectedPod(pods.find(p => p.id !== selectedPod.id) || null)
    toast.success("Pod deleted")
  }

  async function handleMarkAllNotificationsRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function handleMarkNotificationRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function handleFileDelete(fileId: string) {
    const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("File deleted")
      fetchPodData()
    } else {
      toast.error("Failed to delete file")
    }
  }

  async function handleFilePreview(file: PodFileWithProfile) {
    const res = await fetch(`/api/files/${file.id}`)
    if (res.ok) {
      const { url } = await res.json()
      setPreviewFile({ name: file.name, url, mime_type: file.mime_type })
      setPreviewOpen(true)
    } else {
      toast.error("Failed to load file preview")
    }
  }

  async function handleFileDownload(file: PodFileWithProfile) {
    const res = await fetch(`/api/files/${file.id}`)
    if (res.ok) {
      const { url } = await res.json()
      const link = document.createElement("a")
      link.href = url
      link.download = file.name
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  async function handleExport(format: "json" | "csv") {
    if (!selectedPod) return
    const res = await fetch(`/api/export?pod_id=${selectedPod.id}&format=${format}`)
    if (res.ok) {
      if (format === "csv") {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${selectedPod.title}-tasks.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${selectedPod.title}-export.json`
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success(`Exported as ${format.toUpperCase()}`)
    }
  }

  const isFounder = selectedPod?.role === "founder"

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

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
        <div className="flex">
          <aside className="w-72 min-h-screen border-r bg-card/50 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b">
              <Link href="/" className="flex items-center gap-2">
                <div className="relative">
                  <Hexagon className="w-8 h-8 text-primary fill-primary/10" strokeWidth={1.5} />
                  <span className="absolute inset-0 flex items-center justify-center text-primary font-bold text-xs">N</span>
                </div>
                <span className="text-lg font-semibold tracking-tight">Nexus Pod</span>
              </Link>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Pods</span>
                <Dialog open={createPodOpen} onOpenChange={setCreatePodOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-6 w-6">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Pod</DialogTitle>
                      <DialogDescription>Start a new workspace for your team</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Pod Title</Label>
                        <Input
                          value={newPodTitle}
                          onChange={(e) => setNewPodTitle(e.target.value)}
                          placeholder="My Awesome Project"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Summary (optional)</Label>
                        <Textarea
                          value={newPodSummary}
                          onChange={(e) => setNewPodSummary(e.target.value)}
                          placeholder="Brief description of your pod..."
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreatePod} disabled={submitting || !newPodTitle.trim()}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Pod
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {pods.map((pod) => (
                    <button
                      key={pod.id}
                      onClick={() => setSelectedPod(pod)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedPod?.id === pod.id 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
                        {pod.title.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pod.title}</p>
                        <p className="text-xs text-muted-foreground">{pod.npn}</p>
                      </div>
                      {pod.role === "founder" && (
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                          Founder
                        </Badge>
                      )}
                    </button>
                  ))}
                  {pods.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No pods yet</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            <div className="flex-1" />

            <div className="p-4 border-t">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback>
                    {user?.display_name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                
                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="relative">
                      <Bell className="w-4 h-4" />
                      {unreadNotifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                          {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="flex items-center justify-between p-3 border-b">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      {unreadNotifications.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllNotificationsRead} className="text-xs h-auto py-1">
                          Mark all read
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-72">
                      {notifications.length > 0 ? (
                        <div className="divide-y">
                          {notifications.slice(0, 20).map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleMarkNotificationRead(notification.id)}
                              className={`w-full p-3 text-left hover:bg-muted transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{notification.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Bell className="w-8 h-8 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <SheetTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Quick Settings</SheetTitle>
                      <SheetDescription>Manage your account</SheetDescription>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Profile
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={user?.avatar_url || undefined} />
                              <AvatarFallback className="text-lg">
                                {user?.display_name?.substring(0, 2).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{user?.display_name}</p>
                              <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                          </div>
                          <Link href="/settings">
                            <Button variant="outline" className="w-full">
                              <Settings className="w-4 h-4 mr-2" />
                              Open Full Settings
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Appearance</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Theme</span>
                          <ThemeToggle />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => { signOut(); router.push("/"); }}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </aside>

          <main className="flex-1 p-6">
            {selectedPod ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-semibold">{selectedPod.title}</h1>
                      <Badge variant="outline">{selectedPod.npn}</Badge>
                    </div>
                    {selectedPod.summary && (
                      <p className="text-muted-foreground mt-1">{selectedPod.summary}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tasks, projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-48"
                      />
                    </div>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-28">
                        <Filter className="w-3 h-3 mr-1" />
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExport("json")}>Export as JSON</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {isFounder && (
                      <>
                        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <Users className="w-4 h-4 mr-2" />
                              Invite
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Invite Team Members</DialogTitle>
                              <DialogDescription>Share this link with people you want to invite</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {inviteLink ? (
                                <div className="flex gap-2">
                                  <Input value={inviteLink} readOnly />
                                  <Button onClick={copyInviteLink} variant="secondary">
                                    {inviteCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                  </Button>
                                </div>
                              ) : (
                                <Button onClick={handleCreateInvite} disabled={submitting} className="w-full">
                                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                                  Generate Invite Link
                                </Button>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDeletePod} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Pod
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="overview">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="projects">
                      <FolderKanban className="w-4 h-4 mr-2" />
                      Projects
                    </TabsTrigger>
                    <TabsTrigger value="members">
                      <Users className="w-4 h-4 mr-2" />
                      Team
                    </TabsTrigger>
                    <TabsTrigger value="files">
                      <HardDrive className="w-4 h-4 mr-2" />
                      Files
                    </TabsTrigger>
                    <TabsTrigger value="chat">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <OverviewTab
                      tasks={tasks}
                      activityLogs={activityLogs}
                      user={user}
                      onTaskClick={openTaskDetail}
                    />
                  </TabsContent>

                  <TabsContent value="projects" className="space-y-6">
                    <ProjectsTab
                      projects={projects}
                      tasks={tasks}
                      members={members}
                      isFounder={isFounder}
                      searchQuery={searchQuery}
                      filterPriority={filterPriority}
                      filterStatus={filterStatus}
                      onTaskClick={openTaskDetail}
                      onUpdateTaskStatus={handleUpdateTaskStatus}
                      onCreateProject={handleCreateProject}
                      onCreateTask={handleCreateTask}
                    />
                  </TabsContent>

                  <TabsContent value="members" className="space-y-6">
                    <MembersTab
                      members={members}
                      isFounder={isFounder}
                      onRemoveMember={handleRemoveMember}
                    />
                  </TabsContent>

                  <TabsContent value="files" className="space-y-4">
                    <FilesTab
                      selectedPod={selectedPod}
                      podFiles={podFiles}
                      isFounder={isFounder}
                      user={user}
                      onFilePreview={handleFilePreview}
                      onFileDownload={handleFileDownload}
                      onFileDelete={handleFileDelete}
                      fetchPodData={fetchPodData}
                    />
                  </TabsContent>

                  <TabsContent value="chat" className="space-y-4">
                    <ChatTab
                      chatMessages={chatMessages}
                      user={user}
                      chatMessage={chatMessage}
                      onChatMessageChange={setChatMessage}
                      onSendChat={handleSendChat}
                    />
                  </TabsContent>
                </Tabs>

                <Dialog open={taskDetailOpen} onOpenChange={setTaskDetailOpen}>
                  <DialogContent className="max-w-2xl">
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
                          <div>
                            <h4 className="text-sm font-medium mb-2">Description</h4>
                            <p className="text-muted-foreground">{selectedTask.description}</p>
                          </div>
                          <div className="flex gap-4 flex-wrap">
                            <div>
                              <h4 className="text-sm font-medium mb-1">Due Date</h4>
                              <p className={`text-sm ${isPast(new Date(selectedTask.due_date)) && selectedTask.status !== "completed" ? "text-destructive" : "text-muted-foreground"}`}>
                                {format(new Date(selectedTask.due_date), "PPpp")}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Status</h4>
                              <Select
                                value={selectedTask.status}
                                onValueChange={(val) => {
                                  handleUpdateTaskStatus(selectedTask.id, val)
                                  setSelectedTask({ ...selectedTask, status: val as Task["status"] })
                                }}
                                disabled={!isFounder && selectedTask.assigned_to !== user?.id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_started">Not Started</SelectItem>
                                  <SelectItem value="ongoing">Ongoing</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Assignee</h4>
                              <p className="text-sm text-muted-foreground">
                                {selectedTask.profiles?.display_name || selectedTask.profiles?.email || "Unassigned"}
                              </p>
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium mb-3">Comments</h4>
                            <ScrollArea className="h-48 pr-4">
                              <div className="space-y-3">
                                {taskComments.map((comment) => (
                                  <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {comment.profiles?.display_name?.substring(0, 2).toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{comment.profiles?.display_name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                                {taskComments.length === 0 && (
                                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                                )}
                              </div>
                            </ScrollArea>
                            <div className="flex gap-2 mt-4">
                              <Input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                                placeholder="Add a comment..."
                              />
                              <Button onClick={handleAddComment} disabled={submitting || !newComment.trim()}>
                                <Send className="w-4 h-4" />
                              </Button>
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
                <p className="text-muted-foreground mb-4">Create or select a pod to get started</p>
                <Button onClick={() => setCreatePodOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Pod
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
      <FilePreview open={previewOpen} onOpenChange={setPreviewOpen} file={previewFile} />
    </ErrorBoundary>
  )
}

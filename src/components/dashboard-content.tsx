"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"
import { 
  Hexagon, Plus, FolderKanban, Users, MessageSquare, LogOut, 
  ChevronRight, Calendar, CheckCircle2, Circle, Clock, Loader2, Copy, Check,
  Send, MoreVertical, Trash2, UserMinus, Link as LinkIcon, TrendingUp,
  AlertTriangle, Target, BarChart3, Activity, Search, Bell, Settings, User, X,
  Download, Filter, ArrowUpCircle, ArrowRightCircle, ArrowDownCircle
} from "lucide-react"
import { format, formatDistanceToNow, isPast, differenceInDays } from "date-fns"
import type { PodWithRole, Project, Task, Profile, Notification, ActivityLog } from "@/lib/types"
import { SplashScreen } from "@/components/splash-screen"
import { ErrorBoundary } from "@/components/error-boundary"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

interface PodMemberWithProfile {
  id: string
  role: 'founder' | 'member'
  joined_at: string
  profiles: Profile
}

interface TaskWithAssignee extends Task {
  profiles?: Profile | null
  projects?: { id: string; name: string } | null
}

interface ChatMessageWithProfile {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: Profile
}

interface TaskCommentWithProfile {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: Profile
}

export function DashboardContent() {
  const { user, signOut, refreshUser } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const chatEndRef = useRef<HTMLDivElement>(null)
  
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
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignee | null>(null)
  const [taskComments, setTaskComments] = useState<TaskCommentWithProfile[]>([])

  const [newPodTitle, setNewPodTitle] = useState("")
  const [newPodSummary, setNewPodSummary] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [newTaskAssignee, setNewTaskAssignee] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [newComment, setNewComment] = useState("")
  const [chatMessage, setChatMessage] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [showSplash, setShowSplash] = useState(true)

  const [profileDisplayName, setProfileDisplayName] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

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
    if (user) {
      setProfileDisplayName(user.display_name || "")
    }
  }, [user])

  useEffect(() => {
    if (selectedPod) {
      fetchPodData()
    }
  }, [selectedPod])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  async function fetchPodData() {
    if (!selectedPod) return

    const [projectsRes, tasksRes, membersRes, chatRes, activityRes] = await Promise.all([
      fetch(`/api/projects?pod_id=${selectedPod.id}`),
      fetch(`/api/tasks?pod_id=${selectedPod.id}`),
      fetch(`/api/pods/${selectedPod.id}/members`),
      fetch(`/api/chat?pod_id=${selectedPod.id}`),
      fetch(`/api/activity?pod_id=${selectedPod.id}`),
    ])

    if (projectsRes.ok) setProjects(await projectsRes.json())
    if (tasksRes.ok) setTasks(await tasksRes.json())
    if (membersRes.ok) setMembers(await membersRes.json())
    if (chatRes.ok) setChatMessages(await chatRes.json())
    if (activityRes.ok) setActivityLogs(await activityRes.json())
  }

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
  }, [selectedPod, user, supabase])

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

  async function handleCreateProject() {
    if (!newProjectName.trim() || !selectedPod) return
    setSubmitting(true)

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        pod_id: selectedPod.id, 
        name: newProjectName, 
        description: newProjectDescription 
      }),
    })

    if (res.ok) {
      const project = await res.json()
      setProjects(prev => [project, ...prev])
      setCreateProjectOpen(false)
      setNewProjectName("")
      setNewProjectDescription("")
      toast.success("Project created successfully!")
    }
    setSubmitting(false)
  }

  async function handleCreateTask() {
    if (!newTaskName.trim() || !newTaskDescription.trim() || !newTaskDueDate || !selectedProjectId) return
    setSubmitting(true)

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        project_id: selectedProjectId,
        name: newTaskName,
        description: newTaskDescription,
        due_date: new Date(newTaskDueDate).toISOString(),
        assigned_to: newTaskAssignee || null,
        priority: newTaskPriority,
      }),
    })

    if (res.ok) {
      fetchPodData()
      setCreateTaskOpen(false)
      setNewTaskName("")
      setNewTaskDescription("")
      setNewTaskDueDate("")
      setNewTaskAssignee("")
      setNewTaskPriority("medium")
      setSelectedProjectId("")
      toast.success("Task created successfully!")
    }
    setSubmitting(false)
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

  async function handleSaveProfile() {
    setSavingProfile(true)
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: profileDisplayName }),
    })

    if (res.ok) {
      toast.success("Profile updated successfully!")
      refreshUser()
      setSettingsOpen(false)
    } else {
      toast.error("Failed to update profile")
    }
    setSavingProfile(false)
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

  const statusColors = {
    not_started: "bg-slate-500 dark:bg-slate-500",
    ongoing: "bg-amber-500",
    completed: "bg-emerald-500",
  }

  const statusLabels = {
    not_started: "Not Started",
    ongoing: "Ongoing",
    completed: "Completed",
  }

  const priorityColors = {
    low: "text-blue-500",
    medium: "text-amber-500",
    high: "text-red-500",
  }

  const priorityIcons = {
    low: ArrowDownCircle,
    medium: ArrowRightCircle,
    high: ArrowUpCircle,
  }

  const isFounder = selectedPod?.role === "founder"
  const myTasks = tasks.filter(t => t.assigned_to === user?.id)
  const completedTasks = tasks.filter(t => t.status === "completed")
  const ongoingTasks = tasks.filter(t => t.status === "ongoing")
  const notStartedTasks = tasks.filter(t => t.status === "not_started")
  const overdueTasks = tasks.filter(t => t.status !== "completed" && isPast(new Date(t.due_date)))
  const upcomingTasks = tasks.filter(t => t.status !== "completed" && !isPast(new Date(t.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority
    const matchesStatus = filterStatus === "all" || t.status === filterStatus
    return matchesSearch && matchesPriority && matchesStatus
  })

  const filteredProjects = searchQuery
    ? projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    : projects

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
                    <DialogDescription>
                      Start a new workspace for your team
                    </DialogDescription>
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
                    <Badge variant="outline">
                      {selectedPod.npn}
                    </Badge>
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
                            <DialogDescription>
                              Share this link with people you want to invite
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {inviteLink ? (
                              <div className="flex gap-2">
                                <Input
                                  value={inviteLink}
                                  readOnly
                                />
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
                  <TabsTrigger value="chat">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
                        <Target className="w-4 h-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{tasks.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {completedTasks.length} completed
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{completionRate}%</p>
                        <Progress value={completionRate} className="mt-2 h-2" />
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                        <Activity className="w-4 h-4 text-amber-500" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-amber-600 dark:text-amber-500">{ongoingTasks.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notStartedTasks.length} not started
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className={`bg-gradient-to-br ${overdueTasks.length > 0 ? "from-destructive/10 to-destructive/5 border-destructive/20" : "from-muted to-muted/50"}`}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
                        <AlertTriangle className={`w-4 h-4 ${overdueTasks.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                      </CardHeader>
                      <CardContent>
                        <p className={`text-3xl font-bold ${overdueTasks.length > 0 ? "text-destructive" : ""}`}>
                          {overdueTasks.length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          tasks need attention
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="col-span-1 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="w-3 h-3 rounded-full bg-slate-500" />
                          Not Started
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold">{notStartedTasks.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">tasks pending</p>
                      </CardContent>
                    </Card>
                    <Card className="col-span-1 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          Ongoing
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold text-amber-600 dark:text-amber-500">{ongoingTasks.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">in progress</p>
                      </CardContent>
                    </Card>
                    <Card className="col-span-1 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          Completed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-500">{completedTasks.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">tasks done</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          My Tasks
                        </CardTitle>
                        <CardDescription>Tasks assigned to you ({myTasks.length})</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-72">
                          {myTasks.length > 0 ? (
                            <div className="space-y-2">
                              {myTasks.map((task) => (
                                <button
                                  key={task.id}
                                  onClick={() => openTaskDetail(task)}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                                >
                                  <div className={`w-2 h-2 rounded-full ${statusColors[task.status]}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{task.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs ${isPast(new Date(task.due_date)) && task.status !== "completed" ? "text-destructive" : "text-muted-foreground"}`}>
                                          <Calendar className="w-3 h-3 inline mr-1" />
                                          {format(new Date(task.due_date), "MMM d, yyyy")}
                                        </span>
                                        {task.priority && (
                                          <span className={`text-xs ${priorityColors[task.priority]}`}>
                                            {(() => { const Icon = priorityIcons[task.priority]; return <Icon className="w-3 h-3 inline" />; })()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <Badge className={statusColors[task.status]} variant="secondary">
                                      {statusLabels[task.status]}
                                    </Badge>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <CheckCircle2 className="w-12 h-12 text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-muted-foreground">No tasks assigned to you</p>
                              </div>
                            )}
                          </ScrollArea>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Upcoming Deadlines
                          </CardTitle>
                          <CardDescription>Tasks due soon ({upcomingTasks.length})</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-72">
                            {upcomingTasks.length > 0 ? (
                              <div className="space-y-2">
                                {upcomingTasks.slice(0, 10).map((task) => {
                                  const daysUntil = differenceInDays(new Date(task.due_date), new Date())
                                  const PriorityIcon = priorityIcons[task.priority || "medium"]
                                  return (
                                    <button
                                      key={task.id}
                                      onClick={() => openTaskDetail(task)}
                                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                                    >
                                      <div className={`w-2 h-2 rounded-full ${statusColors[task.status]}`} />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-medium truncate">{task.name}</p>
                                          <PriorityIcon className={`w-3 h-3 flex-shrink-0 ${priorityColors[task.priority || "medium"]}`} />
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{task.projects?.name}</p>
                                      </div>
                                      <Badge variant={daysUntil <= 1 ? "destructive" : daysUntil <= 3 ? "secondary" : "outline"}>
                                        {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                                      </Badge>
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Calendar className="w-12 h-12 text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  {overdueTasks.length > 0 && (
                    <Card className="border-destructive/50 bg-destructive/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-5 h-5" />
                          Overdue Tasks
                        </CardTitle>
                        <CardDescription>These tasks need immediate attention</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {overdueTasks.map((task) => (
                            <button
                              key={task.id}
                              onClick={() => openTaskDetail(task)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted transition-colors text-left"
                            >
                              <div className={`w-2 h-2 rounded-full ${statusColors[task.status]}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{task.name}</p>
                                <p className="text-xs text-muted-foreground">{task.projects?.name}</p>
                              </div>
                              <span className="text-xs text-destructive">
                                Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                              </span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>Latest updates in this pod</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-4">
                            {activityLogs.length > 0 ? activityLogs.slice(0, 12).map((activity) => (
                              <div key={activity.id} className="flex items-start gap-3">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={activity.profiles?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {activity.profiles?.display_name?.substring(0, 2).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm">
                                    <span className="font-medium">{activity.profiles?.display_name || "User"}</span>
                                    {" "}{activity.action}{" "}
                                    {activity.entity_name && <span className="text-primary">{activity.entity_name}</span>}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {activity.entity_type}
                                </Badge>
                              </div>
                            )) : tasks.slice(0, 8).map((task) => (
                              <div key={task.id} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${statusColors[task.status]}`} />
                                <div className="flex-1">
                                  <p className="text-sm">
                                    <span className="font-medium">{task.name}</span>
                                    {" "}in{" "}
                                    <span className="text-primary">{task.projects?.name}</span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {statusLabels[task.status]}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>

                <TabsContent value="projects" className="space-y-6">
                  {isFounder && (
                    <div className="flex justify-end gap-2">
                      <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Project Name</Label>
                              <Input
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Project name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={newProjectDescription}
                                onChange={(e) => setNewProjectDescription(e.target.value)}
                                placeholder="Project description..."
                                className="resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreateProject} disabled={submitting || !newProjectName.trim()}>
                              Create Project
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            New Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Task</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Project</Label>
                              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                  {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Task Name</Label>
                              <Input
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                placeholder="Task name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                placeholder="Task description..."
                                className="resize-none"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                  type="datetime-local"
                                  value={newTaskDueDate}
                                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as "low" | "medium" | "high")}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">
                                      <div className="flex items-center gap-2">
                                        <ArrowDownCircle className="w-4 h-4 text-blue-500" />
                                        Low
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="medium">
                                      <div className="flex items-center gap-2">
                                        <ArrowRightCircle className="w-4 h-4 text-amber-500" />
                                        Medium
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="high">
                                      <div className="flex items-center gap-2">
                                        <ArrowUpCircle className="w-4 h-4 text-red-500" />
                                        High
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Assign To</Label>
                              <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent>
                                  {members.map((m) => (
                                    <SelectItem key={m.profiles.id} value={m.profiles.id}>
                                      {m.profiles.display_name || m.profiles.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreateTask} disabled={submitting || !newTaskName.trim() || !selectedProjectId}>
                              Create Task
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {filteredProjects.length > 0 ? (
                    <div className="space-y-6">
                      {filteredProjects.map((project) => {
                        const projectTasks = filteredTasks.filter(t => t.project_id === project.id)
                        const projectCompleted = projectTasks.filter(t => t.status === "completed").length
                        const projectProgress = projectTasks.length > 0 ? Math.round((projectCompleted / projectTasks.length) * 100) : 0
                        
                        return (
                          <Card key={project.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <CardTitle>{project.name}</CardTitle>
                                  {project.description && (
                                    <CardDescription className="mt-1">{project.description}</CardDescription>
                                  )}
                                </div>
                                <div className="text-right">
                                  <Badge variant="secondary">
                                    {projectTasks.length} tasks
                                  </Badge>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Progress value={projectProgress} className="w-24 h-2" />
                                    <span className="text-xs text-muted-foreground">{projectProgress}%</span>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {projectTasks.length > 0 ? (
                                <div className="space-y-2">
                                  {projectTasks.map((task) => (
                                    <button
                                      key={task.id}
                                      onClick={() => openTaskDetail(task)}
                                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const nextStatus = task.status === "not_started" ? "ongoing" : task.status === "ongoing" ? "completed" : "not_started"
                                          handleUpdateTaskStatus(task.id, nextStatus)
                                        }}
                                        className="flex-shrink-0"
                                      >
                                        {task.status === "completed" ? (
                                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        ) : task.status === "ongoing" ? (
                                          <Clock className="w-5 h-5 text-amber-500" />
                                        ) : (
                                          <Circle className="w-5 h-5 text-muted-foreground" />
                                        )}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}>
                                          {task.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className={`text-xs ${isPast(new Date(task.due_date)) && task.status !== "completed" ? "text-destructive" : "text-muted-foreground"}`}>
                                            <Calendar className="w-3 h-3 inline mr-1" />
                                            {format(new Date(task.due_date), "MMM d")}
                                          </span>
                                          {task.profiles && (
                                            <span className="text-xs text-muted-foreground">
                                              <Users className="w-3 h-3 inline mr-1" />
                                              {task.profiles.display_name || task.profiles.email}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <Badge variant="outline">
                                        {statusLabels[task.status]}
                                      </Badge>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No tasks in this project</p>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          {searchQuery ? "No projects found" : "No projects yet"}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {searchQuery ? "Try a different search term" : "Create your first project to start organizing tasks"}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="members" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>{members.length} members in this pod</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.profiles.avatar_url || undefined} />
                                <AvatarFallback>
                                  {member.profiles.display_name?.substring(0, 2).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {member.profiles.display_name || member.profiles.email}
                                </p>
                                <p className="text-xs text-muted-foreground">{member.profiles.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={member.role === "founder" ? "default" : "secondary"}>
                                {member.role === "founder" ? "Founder" : "Member"}
                              </Badge>
                              {isFounder && member.role !== "founder" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveMember(member.profiles.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chat" className="space-y-4">
                  <Card className="h-[calc(100vh-280px)] flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle>Pod Chat</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col min-h-0">
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                          {chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.user_id === user?.id ? "flex-row-reverse" : ""}`}>
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {msg.profiles?.display_name?.substring(0, 2).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`max-w-[70%] ${msg.user_id === user?.id ? "text-right" : ""}`}>
                                <div className={`rounded-lg px-3 py-2 ${msg.user_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                  <p className="text-sm">{msg.content}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {msg.profiles?.display_name} · {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2 pt-4 mt-4 border-t">
                        <Input
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                          placeholder="Type a message..."
                        />
                        <Button onClick={handleSendChat} disabled={!chatMessage.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
                        <DialogDescription>
                          {selectedTask.projects?.name}
                        </DialogDescription>
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
    </ErrorBoundary>
  )
}

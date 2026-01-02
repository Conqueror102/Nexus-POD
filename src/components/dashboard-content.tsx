"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
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
import { 
  Hexagon, Plus, FolderKanban, Users, MessageSquare, Settings, LogOut, 
  ChevronRight, Calendar, CheckCircle2, Circle, Clock, Loader2, Copy, Check,
  Send, MoreVertical, Trash2, UserMinus, Link as LinkIcon
} from "lucide-react"
import { format, formatDistanceToNow, isPast } from "date-fns"
import type { PodWithRole, Project, Task, Profile } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  
  const [pods, setPods] = useState<PodWithRole[]>([])
  const [selectedPod, setSelectedPod] = useState<PodWithRole | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([])
  const [members, setMembers] = useState<PodMemberWithProfile[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessageWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const [createPodOpen, setCreatePodOpen] = useState(false)
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
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
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [newComment, setNewComment] = useState("")
  const [chatMessage, setChatMessage] = useState("")

  const [inviteLink, setInviteLink] = useState("")
  const [inviteCopied, setInviteCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  useEffect(() => {
    fetchPods()
  }, [fetchPods])

  useEffect(() => {
    if (selectedPod) {
      fetchPodData()
    }
  }, [selectedPod])

  async function fetchPodData() {
    if (!selectedPod) return

    const [projectsRes, tasksRes, membersRes, chatRes] = await Promise.all([
      fetch(`/api/projects?pod_id=${selectedPod.id}`),
      fetch(`/api/tasks?pod_id=${selectedPod.id}`),
      fetch(`/api/pods/${selectedPod.id}/members`),
      fetch(`/api/chat?pod_id=${selectedPod.id}`),
    ])

    if (projectsRes.ok) setProjects(await projectsRes.json())
    if (tasksRes.ok) setTasks(await tasksRes.json())
    if (membersRes.ok) setMembers(await membersRes.json())
    if (chatRes.ok) setChatMessages(await chatRes.json())
  }

  useEffect(() => {
    if (!selectedPod) return

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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedPod, supabase])

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
      }),
    })

    if (res.ok) {
      fetchPodData()
      setCreateTaskOpen(false)
      setNewTaskName("")
      setNewTaskDescription("")
      setNewTaskDueDate("")
      setNewTaskAssignee("")
      setSelectedProjectId("")
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
  }

  async function handleDeletePod() {
    if (!selectedPod) return

    await fetch(`/api/pods/${selectedPod.id}`, { method: "DELETE" })
    setPods(prev => prev.filter(p => p.id !== selectedPod.id))
    setSelectedPod(pods.find(p => p.id !== selectedPod.id) || null)
  }

  const statusColors = {
    not_started: "bg-slate-500",
    ongoing: "bg-amber-500",
    completed: "bg-emerald-500",
  }

  const statusLabels = {
    not_started: "Not Started",
    ongoing: "Ongoing",
    completed: "Completed",
  }

  const isFounder = selectedPod?.role === "founder"
  const myTasks = tasks.filter(t => t.assigned_to === user?.id)
  const upcomingTasks = tasks.filter(t => t.status !== "completed" && !isPast(new Date(t.due_date)))
  const overdueTasks = tasks.filter(t => t.status !== "completed" && isPast(new Date(t.due_date)))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      <div className="flex">
        <aside className="w-72 min-h-screen border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative">
                <Hexagon className="w-8 h-8 text-emerald-500 fill-emerald-500/10" strokeWidth={1.5} />
                <span className="absolute inset-0 flex items-center justify-center text-emerald-400 font-bold text-xs">N</span>
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">Nexus Pod</span>
            </Link>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Your Pods</span>
              <Dialog open={createPodOpen} onOpenChange={setCreatePodOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Pod</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Start a new workspace for your team
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Pod Title</Label>
                      <Input
                        value={newPodTitle}
                        onChange={(e) => setNewPodTitle(e.target.value)}
                        placeholder="My Awesome Project"
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Summary (optional)</Label>
                      <Textarea
                        value={newPodSummary}
                        onChange={(e) => setNewPodSummary(e.target.value)}
                        placeholder="Brief description of your pod..."
                        className="bg-slate-800/50 border-slate-700 text-white resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreatePod} disabled={submitting || !newPodTitle.trim()} className="bg-emerald-600 hover:bg-emerald-500">
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
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-medium">
                      {pod.title.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pod.title}</p>
                      <p className="text-xs text-slate-500">{pod.npn}</p>
                    </div>
                    {pod.role === "founder" && (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-0">
                        Founder
                      </Badge>
                    )}
                  </button>
                ))}
                {pods.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No pods yet</p>
                )}
              </div>
            </ScrollArea>
          </div>

          <Separator className="bg-slate-800" />

          <div className="flex-1" />

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback className="bg-slate-800 text-slate-300">
                  {user?.display_name?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.display_name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => { signOut(); router.push("/"); }}
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6">
          {selectedPod ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold text-white">{selectedPod.title}</h1>
                    <Badge variant="outline" className="text-slate-400 border-slate-700">
                      {selectedPod.npn}
                    </Badge>
                  </div>
                  {selectedPod.summary && (
                    <p className="text-slate-400 mt-1">{selectedPod.summary}</p>
                  )}
                </div>

                {isFounder && (
                  <div className="flex items-center gap-2">
                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                          <Users className="w-4 h-4 mr-2" />
                          Invite
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-800">
                        <DialogHeader>
                          <DialogTitle className="text-white">Invite Team Members</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Share this link with people you want to invite
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {inviteLink ? (
                            <div className="flex gap-2">
                              <Input
                                value={inviteLink}
                                readOnly
                                className="bg-slate-800/50 border-slate-700 text-white"
                              />
                              <Button onClick={copyInviteLink} variant="secondary">
                                {inviteCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={handleCreateInvite} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500">
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                              Generate Invite Link
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                        <DropdownMenuItem onClick={handleDeletePod} className="text-red-400 focus:text-red-400 focus:bg-red-500/10">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Pod
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-800/50 border border-slate-700">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <FolderKanban className="w-4 h-4 mr-2" />
                    Projects
                  </TabsTrigger>
                  <TabsTrigger value="members" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <Users className="w-4 h-4 mr-2" />
                    Team
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Projects</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">{projects.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Tasks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">{tasks.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Team Members</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-white">{members.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Overdue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-red-400">{overdueTasks.length}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white">My Tasks</CardTitle>
                        <CardDescription className="text-slate-400">Tasks assigned to you</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          {myTasks.length > 0 ? (
                            <div className="space-y-2">
                              {myTasks.map((task) => (
                                <button
                                  key={task.id}
                                  onClick={() => openTaskDetail(task)}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
                                >
                                  <div className={`w-2 h-2 rounded-full ${statusColors[task.status]}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{task.name}</p>
                                    <p className="text-xs text-slate-500">
                                      Due {format(new Date(task.due_date), "MMM d, yyyy")}
                                    </p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-500" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 text-center py-8">No tasks assigned to you</p>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white">Recent Activity</CardTitle>
                        <CardDescription className="text-slate-400">Latest updates in this pod</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-3">
                            {tasks.slice(0, 5).map((task) => (
                              <div key={task.id} className="flex items-start gap-3 text-sm">
                                <div className={`w-2 h-2 rounded-full mt-2 ${statusColors[task.status]}`} />
                                <div>
                                  <p className="text-slate-300">
                                    <span className="font-medium text-white">{task.name}</span>
                                    {" "}in{" "}
                                    <span className="text-emerald-400">{task.projects?.name}</span>
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="projects" className="space-y-6">
                  {isFounder && (
                    <div className="flex justify-end gap-2">
                      <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-emerald-600 hover:bg-emerald-500">
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800">
                          <DialogHeader>
                            <DialogTitle className="text-white">Create New Project</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">Project Name</Label>
                              <Input
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Project name"
                                className="bg-slate-800/50 border-slate-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Description</Label>
                              <Textarea
                                value={newProjectDescription}
                                onChange={(e) => setNewProjectDescription(e.target.value)}
                                placeholder="Project description..."
                                className="bg-slate-800/50 border-slate-700 text-white resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreateProject} disabled={submitting || !newProjectName.trim()} className="bg-emerald-600 hover:bg-emerald-500">
                              Create Project
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-slate-700 text-slate-300">
                            <Plus className="w-4 h-4 mr-2" />
                            New Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800">
                          <DialogHeader>
                            <DialogTitle className="text-white">Create New Task</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">Project</Label>
                              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                                  <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                  {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Task Name</Label>
                              <Input
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                placeholder="Task name"
                                className="bg-slate-800/50 border-slate-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Description</Label>
                              <Textarea
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                placeholder="Task description..."
                                className="bg-slate-800/50 border-slate-700 text-white resize-none"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Due Date</Label>
                              <Input
                                type="datetime-local"
                                value={newTaskDueDate}
                                onChange={(e) => setNewTaskDueDate(e.target.value)}
                                className="bg-slate-800/50 border-slate-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Assign To</Label>
                              <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                                  <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
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
                            <Button onClick={handleCreateTask} disabled={submitting || !newTaskName.trim() || !selectedProjectId} className="bg-emerald-600 hover:bg-emerald-500">
                              Create Task
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {projects.length > 0 ? (
                    <div className="space-y-6">
                      {projects.map((project) => {
                        const projectTasks = tasks.filter(t => t.project_id === project.id)
                        return (
                          <Card key={project.id} className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-white">{project.name}</CardTitle>
                                  {project.description && (
                                    <CardDescription className="text-slate-400 mt-1">{project.description}</CardDescription>
                                  )}
                                </div>
                                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                                  {projectTasks.length} tasks
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {projectTasks.length > 0 ? (
                                <div className="space-y-2">
                                  {projectTasks.map((task) => (
                                    <button
                                      key={task.id}
                                      onClick={() => openTaskDetail(task)}
                                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
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
                                          <Circle className="w-5 h-5 text-slate-500" />
                                        )}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${task.status === "completed" ? "text-slate-500 line-through" : "text-white"}`}>
                                          {task.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className={`text-xs ${isPast(new Date(task.due_date)) && task.status !== "completed" ? "text-red-400" : "text-slate-500"}`}>
                                            <Calendar className="w-3 h-3 inline mr-1" />
                                            {format(new Date(task.due_date), "MMM d")}
                                          </span>
                                          {task.profiles && (
                                            <span className="text-xs text-slate-500">
                                              <Users className="w-3 h-3 inline mr-1" />
                                              {task.profiles.display_name || task.profiles.email}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <Badge className={`${statusColors[task.status]} text-white border-0`}>
                                        {statusLabels[task.status]}
                                      </Badge>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500 text-center py-4">No tasks in this project</p>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardContent className="py-12 text-center">
                        <FolderKanban className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
                        <p className="text-slate-400 mb-4">Create your first project to start organizing tasks</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="members" className="space-y-6">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white">Team Members</CardTitle>
                      <CardDescription className="text-slate-400">{members.length} members in this pod</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.profiles.avatar_url || undefined} />
                                <AvatarFallback className="bg-slate-700 text-slate-300">
                                  {member.profiles.display_name?.substring(0, 2).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {member.profiles.display_name || member.profiles.email}
                                </p>
                                <p className="text-xs text-slate-500">{member.profiles.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={member.role === "founder" ? "default" : "secondary"} className={member.role === "founder" ? "bg-emerald-500/20 text-emerald-400 border-0" : "bg-slate-700 text-slate-300 border-0"}>
                                {member.role === "founder" ? "Founder" : "Member"}
                              </Badge>
                              {isFounder && member.role !== "founder" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveMember(member.profiles.id)}
                                  className="text-slate-400 hover:text-red-400"
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
                  <Card className="bg-slate-900/50 border-slate-800 h-[calc(100vh-280px)] flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white">Pod Chat</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col min-h-0">
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                          {chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.user_id === user?.id ? "flex-row-reverse" : ""}`}>
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                                  {msg.profiles?.display_name?.substring(0, 2).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`max-w-[70%] ${msg.user_id === user?.id ? "text-right" : ""}`}>
                                <div className={`rounded-lg px-3 py-2 ${msg.user_id === user?.id ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-200"}`}>
                                  <p className="text-sm">{msg.content}</p>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {msg.profiles?.display_name} · {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2 pt-4 mt-4 border-t border-slate-800">
                        <Input
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                          placeholder="Type a message..."
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                        <Button onClick={handleSendChat} disabled={!chatMessage.trim()} className="bg-emerald-600 hover:bg-emerald-500">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Dialog open={taskDetailOpen} onOpenChange={setTaskDetailOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
                  {selectedTask && (
                    <>
                      <DialogHeader>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${statusColors[selectedTask.status]}`} />
                          <DialogTitle className="text-white">{selectedTask.name}</DialogTitle>
                        </div>
                        <DialogDescription className="text-slate-400">
                          {selectedTask.projects?.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2">Description</h4>
                          <p className="text-slate-400">{selectedTask.description}</p>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-slate-300 mb-1">Due Date</h4>
                            <p className={`text-sm ${isPast(new Date(selectedTask.due_date)) && selectedTask.status !== "completed" ? "text-red-400" : "text-slate-400"}`}>
                              {format(new Date(selectedTask.due_date), "PPpp")}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-300 mb-1">Status</h4>
                            <Select
                              value={selectedTask.status}
                              onValueChange={(val) => {
                                handleUpdateTaskStatus(selectedTask.id, val)
                                setSelectedTask({ ...selectedTask, status: val as Task["status"] })
                              }}
                              disabled={!isFounder && selectedTask.assigned_to !== user?.id}
                            >
                              <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800">
                                <SelectItem value="not_started">Not Started</SelectItem>
                                <SelectItem value="ongoing">Ongoing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-300 mb-1">Assignee</h4>
                            <p className="text-sm text-slate-400">
                              {selectedTask.profiles?.display_name || selectedTask.profiles?.email || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <Separator className="bg-slate-800" />
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-3">Comments</h4>
                          <ScrollArea className="h-48 pr-4">
                            <div className="space-y-3">
                              {taskComments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                                      {comment.profiles?.display_name?.substring(0, 2).toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-white">{comment.profiles?.display_name}</span>
                                      <span className="text-xs text-slate-500">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                              {taskComments.length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-4">No comments yet</p>
                              )}
                            </div>
                          </ScrollArea>
                          <div className="flex gap-2 mt-4">
                            <Input
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                              placeholder="Add a comment..."
                              className="bg-slate-800/50 border-slate-700 text-white"
                            />
                            <Button onClick={handleAddComment} disabled={submitting || !newComment.trim()} className="bg-emerald-600 hover:bg-emerald-500">
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
              <Hexagon className="w-16 h-16 text-slate-700 mb-4" />
              <h2 className="text-xl font-medium text-white mb-2">No Pod Selected</h2>
              <p className="text-slate-400 mb-4">Create or select a pod to get started</p>
              <Button onClick={() => setCreatePodOpen(true)} className="bg-emerald-600 hover:bg-emerald-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Pod
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

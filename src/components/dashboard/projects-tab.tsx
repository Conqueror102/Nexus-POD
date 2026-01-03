"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, FolderKanban, Calendar, CheckCircle2, Circle, Clock, Loader2, Users,
  ArrowUpCircle, ArrowRightCircle, ArrowDownCircle
} from "lucide-react"
import { format, isPast } from "date-fns"
import type { DashboardTabProps, TaskWithAssignee, PodMemberWithProfile } from "./types"
import { statusColors, statusLabels } from "./types"
import type { Project } from "@/lib/types"

interface ProjectsTabProps {
  projects: Project[]
  tasks: TaskWithAssignee[]
  members: PodMemberWithProfile[]
  isFounder: boolean
  searchQuery: string
  filterPriority: string
  filterStatus: string
  onTaskClick: (task: TaskWithAssignee) => void
  onUpdateTaskStatus: (taskId: string, status: string) => void
  onCreateProject: (name: string, description: string) => Promise<void>
  onCreateTask: (data: {
    project_id: string
    name: string
    description: string
    due_date: string
    assigned_to: string
    priority: "low" | "medium" | "high"
  }) => Promise<void>
}

export function ProjectsTab({
  projects,
  tasks,
  members,
  isFounder,
  searchQuery,
  filterPriority,
  filterStatus,
  onTaskClick,
  onUpdateTaskStatus,
  onCreateProject,
  onCreateTask,
}: ProjectsTabProps) {
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [newTaskAssignee, setNewTaskAssignee] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [selectedProjectId, setSelectedProjectId] = useState("")

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

  async function handleCreateProject() {
    if (!newProjectName.trim()) return
    setSubmitting(true)
    await onCreateProject(newProjectName, newProjectDescription)
    setCreateProjectOpen(false)
    setNewProjectName("")
    setNewProjectDescription("")
    setSubmitting(false)
  }

  async function handleCreateTask() {
    if (!newTaskName.trim() || !newTaskDescription.trim() || !newTaskDueDate || !selectedProjectId) return
    setSubmitting(true)
    await onCreateTask({
      project_id: selectedProjectId,
      name: newTaskName,
      description: newTaskDescription,
      due_date: newTaskDueDate,
      assigned_to: newTaskAssignee,
      priority: newTaskPriority,
    })
    setCreateTaskOpen(false)
    setNewTaskName("")
    setNewTaskDescription("")
    setNewTaskDueDate("")
    setNewTaskAssignee("")
    setNewTaskPriority("medium")
    setSelectedProjectId("")
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
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
                          onClick={() => onTaskClick(task)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const nextStatus = task.status === "not_started" ? "ongoing" : task.status === "ongoing" ? "completed" : "not_started"
                              onUpdateTaskStatus(task.id, nextStatus)
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
    </div>
  )
}

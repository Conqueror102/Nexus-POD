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
  ArrowUpCircle, ArrowRightCircle, ArrowDownCircle, MoreVertical, Trash2, Pencil, Tag
} from "lucide-react"
import type { Profile } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { format, isPast } from "date-fns"
import type { DashboardTabProps, TaskWithAssignee, PodMemberWithProfile } from "./types"
import { statusColors, statusLabels } from "./types"
import type { Project } from "@/lib/types"
import { toast } from "sonner"

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
  onUpdateProject: (id: string, name: string, description: string) => Promise<void>
  onCreateTask: (data: any) => Promise<void>
  onUpdateTask: (id: string, data: any) => Promise<void>
  onDeleteTask: (taskId: string) => void
  onDeleteProject: (projectId: string) => void
  user: Profile | null
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
  onUpdateProject,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onDeleteProject,
  user,
}: ProjectsTabProps) {
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [editTaskOpen, setEditTaskOpen] = useState(false)
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false)
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false)
  
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null)

  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [newTaskAssignee, setNewTaskAssignee] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority
    const matchesStatus = filterStatus === "all" || t.status === filterStatus
    return matchesSearch && matchesPriority && matchesStatus
  })

  const filteredProjects = projects.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    // Members only see projects they have tasks in
    const hasTasks = tasks.some(t => t.project_id === p.id)
    const isVisible = isFounder || hasTasks
    
    return matchesSearch && isVisible
  })

  async function handleCreateProject() {
    if (!newProjectName.trim()) return
    setSubmitting(true)
    await onCreateProject(newProjectName, newProjectDescription)
    setCreateProjectOpen(false)
    setNewProjectName("")
    setNewProjectDescription("")
    setSubmitting(false)
  }

  async function handleUpdateProject() {
    if (!editingProject || !newProjectName.trim()) return
    setSubmitting(true)
    await onUpdateProject(editingProject.id, newProjectName, newProjectDescription)
    setEditProjectOpen(false)
    setEditingProject(null)
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
    resetTaskForm()
    setSubmitting(false)
  }

  async function handleUpdateTask() {
    if (!editingTask || !newTaskName.trim()) return
    setSubmitting(true)
    await onUpdateTask(editingTask.id, {
      name: newTaskName,
      description: newTaskDescription,
      due_date: newTaskDueDate,
      assigned_to: newTaskAssignee,
      priority: newTaskPriority,
    })
    setEditTaskOpen(false)
    setEditingTask(null)
    setSubmitting(false)
  }

  function resetTaskForm() {
    setNewTaskName("")
    setNewTaskDescription("")
    setNewTaskDueDate("")
    setNewTaskAssignee("")
    setNewTaskPriority("medium")
    setSelectedProjectId("")
  }

  function startEditProject(project: Project) {
    setEditingProject(project)
    setNewProjectName(project.name)
    setNewProjectDescription(project.description || "")
    setEditProjectOpen(true)
  }

  function startEditTask(task: TaskWithAssignee) {
    setEditingTask(task)
    setNewTaskName(task.name)
    setNewTaskDescription(task.description || "")
    setNewTaskDueDate(task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "")
    setNewTaskAssignee(task.assigned_to || "")
    setNewTaskPriority(task.priority)
    setEditTaskOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
          {isFounder && (
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />New Project</Button>
            </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Project</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Project name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} placeholder="Project description..." className="resize-none" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateProject} disabled={submitting || !newProjectName.trim()}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><Plus className="w-4 h-4 mr-2" />New Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Task Name</Label>
                <Input value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} placeholder="Task name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Task description..." className="resize-none" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="datetime-local" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.profiles.id} value={m.profiles.id}>{m.profiles.display_name || m.profiles.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTask} disabled={submitting || !newTaskName.trim() || !selectedProjectId}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} className="resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateProject} disabled={submitting || !newProjectName.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Name</Label>
              <Input value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} className="resize-none" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="datetime-local" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.profiles.id} value={m.profiles.id}>{m.profiles.display_name || m.profiles.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateTask} disabled={submitting || !newTaskName.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredProjects.map((project) => {
        const projectTasks = filteredTasks.filter(t => t.project_id === project.id)
        const projectProgress = projectTasks.length > 0 ? Math.round((projectTasks.filter(t => t.status === "completed").length / projectTasks.length) * 100) : 0
        return (
          <Card key={project.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex-1">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{projectTasks.length} tasks</Badge>
                {isFounder && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEditProject(project)}><Pencil className="w-4 h-4 mr-2" />Edit Project</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setProjectToDelete(project.id); setDeleteProjectOpen(true) }} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete Project</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Progress value={projectProgress} className="h-1.5" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{projectProgress}%</span>
              </div>
              <div className="space-y-2">
                {projectTasks.map((task) => (
                  <div key={task.id} className="group flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => onTaskClick(task)}>
                    <div onClick={(e) => { e.stopPropagation(); onUpdateTaskStatus(task.id, task.status === 'completed' ? 'ongoing' : 'completed') }} className="flex-shrink-0">
                      {task.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : task.status === "ongoing" ? <Clock className="w-5 h-5 text-amber-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}>{task.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${isPast(new Date(task.due_date)) && task.status !== "completed" ? "text-destructive" : "text-muted-foreground"}`}><Calendar className="w-3 h-3 inline mr-1" />{format(new Date(task.due_date), "MMM d")}</span>
                        {task.profiles && <span className="text-xs text-muted-foreground"><Users className="w-3 h-3 inline mr-1" />{task.profiles.display_name || task.profiles.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(isFounder || task.assigned_to === user?.id || task.created_by === user?.id) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startEditTask(task) }}><Pencil className="w-4 h-4 mr-2" />Edit Task</DropdownMenuItem>
                            {isFounder && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTaskToDelete(task.id); setDeleteTaskOpen(true) }} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete Task</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
                {projectTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>}
              </div>
            </CardContent>
          </Card>
        )
      })}

      <AlertDialog open={deleteTaskOpen} onOpenChange={setDeleteTaskOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Task?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (taskToDelete) onDeleteTask(taskToDelete); setTaskToDelete(null) }} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Project?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the project and all its tasks.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (projectToDelete) onDeleteProject(projectToDelete); setProjectToDelete(null) }} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Target, TrendingUp, Activity, AlertTriangle, User, Clock, Calendar,
  CheckCircle2, ChevronRight, ArrowUpCircle, ArrowRightCircle, ArrowDownCircle
} from "lucide-react"
import { format, formatDistanceToNow, isPast, differenceInDays } from "date-fns"
import type { DashboardTabProps, TaskWithAssignee } from "./types"
import { statusColors, statusLabels, priorityColors } from "./types"

const priorityIcons = {
  low: ArrowDownCircle,
  medium: ArrowRightCircle,
  high: ArrowUpCircle,
}

interface OverviewTabProps extends Pick<DashboardTabProps, 'tasks' | 'activityLogs' | 'user' | 'onTaskClick'> {}

export function OverviewTab({ tasks, activityLogs, user, onTaskClick }: OverviewTabProps) {
  const myTasks = tasks.filter(t => t.assigned_to === user?.id)
  const completedTasks = tasks.filter(t => t.status === "completed")
  const ongoingTasks = tasks.filter(t => t.status === "ongoing")
  const notStartedTasks = tasks.filter(t => t.status === "not_started")
  const overdueTasks = tasks.filter(t => t.status !== "completed" && isPast(new Date(t.due_date)))
  const upcomingTasks = tasks.filter(t => t.status !== "completed" && !isPast(new Date(t.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  return (
    <div className="space-y-6">
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
                    <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
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
                        onClick={() => onTaskClick(task)}
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
                  onClick={() => onTaskClick(task)}
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
    </div>
  )
}

function TaskRow({ task, onClick }: { task: TaskWithAssignee; onClick: () => void }) {
  const PriorityIcon = priorityIcons[task.priority || "medium"]
  return (
    <button
      onClick={onClick}
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
              <PriorityIcon className="w-3 h-3 inline" />
            </span>
          )}
        </div>
      </div>
      <Badge className={statusColors[task.status]} variant="secondary">
        {statusLabels[task.status]}
      </Badge>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  )
}

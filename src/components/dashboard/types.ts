import type { Profile, Task, Project, PodWithRole, ActivityLog, PodFileWithProfile } from "@/lib/types"

export interface PodMemberWithProfile {
  id: string
  role: 'founder' | 'member'
  joined_at: string
  profiles: Profile
}

export interface TaskWithAssignee extends Task {
  profiles?: Profile | null
  projects?: { id: string; name: string } | null
}

export interface ChatMessageWithProfile {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: Profile
}

export interface TaskCommentWithProfile {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: Profile
}

export const statusColors = {
  not_started: "bg-slate-500 dark:bg-slate-500",
  ongoing: "bg-amber-500",
  completed: "bg-emerald-500",
}

export const statusLabels = {
  not_started: "Not Started",
  ongoing: "Ongoing",
  completed: "Completed",
}

export const priorityColors = {
  low: "text-blue-500",
  medium: "text-amber-500",
  high: "text-red-500",
}

export interface DashboardTabProps {
  selectedPod: PodWithRole
  user: Profile | null
  isFounder: boolean
  tasks: TaskWithAssignee[]
  projects: Project[]
  members: PodMemberWithProfile[]
  activityLogs: ActivityLog[]
  podFiles: PodFileWithProfile[]
  searchQuery: string
  filterPriority: string
  filterStatus: string
  onTaskClick: (task: TaskWithAssignee) => void
  onUpdateTaskStatus: (taskId: string, status: string) => void
  fetchPodData: () => void
}

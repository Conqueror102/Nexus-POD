export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Pod {
  id: string
  npn: string
  title: string
  summary: string | null
  avatar_url: string | null
  founder_id: string
  storage_used_bytes: number
  created_at: string
  updated_at: string
}

export interface PodMember {
  id: string
  pod_id: string
  user_id: string
  role: 'founder' | 'member'
  joined_at: string
}

export interface PodInvite {
  id: string
  pod_id: string
  invite_code: string
  created_by: string
  expires_at: string | null
  used_at: string | null
  used_by: string | null
  created_at: string
}

export interface Project {
  id: string
  pod_id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  name: string
  description: string
  due_date: string
  assigned_to: string | null
  status: 'not_started' | 'ongoing' | 'completed'
  created_by: string
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
}

export interface ChatMessage {
  id: string
  pod_id: string
  user_id: string
  content: string
  created_at: string
}

export interface TaskReminder {
  id: string
  task_id: string
  reminder_time: string
  hours_before: number
  sent: boolean
  created_at: string
}

export interface PodWithRole extends Pod {
  role: 'founder' | 'member'
  member_count?: number
}

export interface TaskWithDetails extends Task {
  project?: Project
  assigned_user?: Profile
  created_user?: Profile
  comments_count?: number
}

export interface ProjectWithTasks extends Project {
  tasks?: Task[]
  task_count?: number
}

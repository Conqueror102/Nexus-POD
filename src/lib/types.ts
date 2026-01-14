export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  notification_email: boolean
  notification_push: boolean
  timezone: string
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
  priority: 'low' | 'medium' | 'high'
  labels: string[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  pod_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  metadata: Record<string, unknown>
  created_at: string
  profiles?: Profile
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at?: string
  profiles?: Profile
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
  hours_before: number // 24, 12, 6, 1
  sent: boolean
  created_at: string
}

export interface PodFile {
  id: string
  pod_id: string
  name: string
  size_bytes: number
  mime_type: string | null
  storage_path: string
  uploaded_by: string
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

export interface PodFileWithProfile extends PodFile {
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  pod_id: string | null
  task_id: string | null
  type: 'task_reminder' | 'task_assigned' | 'task_completed' | 'comment_added' | 'member_joined' | 'task_due_reminder' | 'task_comment' | 'pod_invite' | 'pod_join' | 'general'
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
  pods?: { id: string; title: string; npn: string } | null
  tasks?: { id: string; name: string } | null
}

export interface PodSubscription {
  id: string
  pod_id: string
  plan_code: string
  plan_name: 'lite' | 'pro' | 'enterprise'
  paystack_subscription_code: string | null
  paystack_customer_code: string | null
  paystack_email_token: string | null
  status: 'inactive' | 'active' | 'cancelled' | 'past_due' | 'pending'
  member_limit: number
  storage_limit_bytes: number
  features: {
    basic_features: boolean
    premium_automations: boolean
  }
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  code: string
  price: number
  interval: 'monthly' | 'annually'
  member_limit: number
  storage_gb: number
  features: string[]
}

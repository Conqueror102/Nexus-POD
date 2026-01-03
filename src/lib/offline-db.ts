import Dexie, { type EntityTable } from 'dexie'

export interface OfflinePod {
  id: string
  npn: string
  title: string
  summary: string | null
  avatar_url: string | null
  founder_id: string
  storage_used_bytes: number
  role: 'founder' | 'member'
  synced_at: number
}

export interface OfflineProject {
  id: string
  pod_id: string
  name: string
  description: string | null
  created_by: string
  synced_at: number
}

export interface OfflineTask {
  id: string
  project_id: string
  name: string
  description: string
  due_date: string
  assigned_to: string | null
  status: 'not_started' | 'ongoing' | 'completed'
  priority: 'low' | 'medium' | 'high'
  created_by: string
  synced_at: number
  is_dirty?: boolean
  local_id?: string
}

export interface OfflineChatMessage {
  id: string
  pod_id: string
  user_id: string
  content: string
  created_at: string
  synced_at: number
  is_dirty?: boolean
  local_id?: string
}

export interface OfflineMember {
  id: string
  pod_id: string
  user_id: string
  role: 'founder' | 'member'
  display_name: string | null
  email: string
  avatar_url: string | null
  synced_at: number
}

export interface PendingSync {
  id?: number
  type: 'task_create' | 'task_update' | 'chat_create'
  entity_id: string
  data: Record<string, unknown>
  created_at: number
  retries: number
}

export interface SyncMeta {
  key: string
  value: string
}

export interface CachedUser {
  id: string
  email: string
  display_name: string | null
  avatar_url?: string
  notification_email?: boolean
  notification_push?: boolean
  timezone?: string
}

const db = new Dexie('NexusPodOffline') as Dexie & {
  pods: EntityTable<OfflinePod, 'id'>
  projects: EntityTable<OfflineProject, 'id'>
  tasks: EntityTable<OfflineTask, 'id'>
  chatMessages: EntityTable<OfflineChatMessage, 'id'>
  members: EntityTable<OfflineMember, 'id'>
  pendingSync: EntityTable<PendingSync, 'id'>
  syncMeta: EntityTable<SyncMeta, 'key'>
  cachedUser: EntityTable<CachedUser, 'id'>
}

db.version(1).stores({
  pods: 'id, npn, founder_id',
  projects: 'id, pod_id',
  tasks: 'id, project_id, assigned_to, status, is_dirty',
  chatMessages: 'id, pod_id, created_at, is_dirty',
  members: 'id, pod_id, user_id',
  pendingSync: '++id, type, entity_id, created_at',
  syncMeta: 'key',
  cachedUser: 'id',
})

export { db }

export async function clearOfflineData() {
  await db.pods.clear()
  await db.projects.clear()
  await db.tasks.clear()
  await db.chatMessages.clear()
  await db.members.clear()
  await db.pendingSync.clear()
  await db.syncMeta.clear()
  await db.cachedUser.clear()
}

export async function getLastSyncTime(podId: string): Promise<number | null> {
  const meta = await db.syncMeta.get('lastSync_' + podId)
  return meta ? parseInt(meta.value) : null
}

export async function setLastSyncTime(podId: string) {
  await db.syncMeta.put({ key: 'lastSync_' + podId, value: Date.now().toString() })
}

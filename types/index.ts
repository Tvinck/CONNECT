export type UserRole = 'ceo' | 'design' | 'dev' | 'sales' | 'support'
export type UserStatus = 'online' | 'offline' | 'busy'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ClientStatus = 'lead' | 'active' | 'vip' | 'churned'
export type ProjectStatus = 'active' | 'dev' | 'planning'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  position?: string
  points: number
  level: number
  is_active: boolean
  status: UserStatus
  created_at: string
}

export interface Project {
  id: string
  name: string
  slug: string
  emoji?: string
  status: ProjectStatus
  progress: number
  color: string
  description?: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  assignee_id?: string
  creator_id: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string
  project_id?: string
  points_reward: number
  created_at: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  source?: string
  status: ClientStatus
  manager_id?: string
  total_spent: number
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  sender_id: string
  content: string
  reply_to?: string | null
  is_pinned: boolean
  created_at: string
}

export interface Channel {
  id: string
  name: string
  description?: string
  is_private: boolean
  created_at: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category: string
  author_id: string
  views: number
  read_time: number
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body?: string
  is_read: boolean
  link?: string
  created_at: string
}

export interface NavItem {
  key: string
  label: string
  href: string
  badge?: number | null
  ceo?: boolean
}

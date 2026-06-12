/**
 * types/index.ts — Shared TypeScript types for the entire application.
 *
 * These types mirror the Supabase database schema. They are used both in
 * server components (data fetching) and client components (props, state).
 *
 * Keep this file in sync with the database schema in supabase/migrations/.
 * Nullable DB columns are represented as `field?: string` (optional) or
 * `field: string | null` depending on whether the column has a default.
 */

/** All permission roles a user can hold. Stored in `users.role`. */
export type UserRole = 'ceo' | 'coowner' | 'design' | 'dev' | 'sales' | 'support'

/** Online presence status. Updated by the client on focus/blur. */
export type UserStatus = 'online' | 'offline' | 'busy'

/** Kanban column a task lives in. */
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

/** Task urgency level, affects colour coding and sorting. */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

/** CRM client lifecycle stage. */
export type ClientStatus = 'lead' | 'active' | 'vip' | 'churned'

/** Current state of a project. */
export type ProjectStatus = 'active' | 'dev' | 'planning'

/** Row from the `users` table (public profile, not auth.users). */
export interface User {
  id: string
  email: string
  full_name: string
  /** URL to a stored avatar image (optional — most users use initials). */
  avatar_url?: string
  role: UserRole
  /** Job title / position, e.g. "Менеджер по продажам". */
  position?: string
  /** Cumulative gamification points. Protected by DB trigger from self-modification. */
  points: number
  /** Current level tier (0–4), derived from points. */
  level: number
  /** False = deactivated/fired, filtered out of employee lists. */
  is_active: boolean
  status: UserStatus
  last_seen?: string
  created_at: string
}

/** Row from the `projects` table. */
export interface Project {
  id: string
  name: string
  /** URL-safe identifier used for future project-detail routes. */
  slug: string
  /** Single emoji displayed on the project card. */
  emoji?: string
  status: ProjectStatus
  /** Completion percentage 0–100. */
  progress: number
  /** Hex accent colour for the project card gradient. */
  color: string
  description?: string
  created_at: string
}

/** Row from the `tasks` table. */
export interface Task {
  id: string
  title: string
  description?: string
  /** User the task is assigned to. */
  assignee_id?: string
  /** User who created the task. */
  creator_id: string
  status: TaskStatus
  priority: TaskPriority
  /** ISO 8601 deadline, or undefined for open-ended tasks. */
  due_date?: string
  /** Tasks can optionally be grouped under a project. */
  project_id?: string
  /** Points awarded to the assignee when the task is moved to 'done'. */
  points_reward: number
  created_at: string
}

/** Row from the `clients` CRM table. */
export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  /** Acquisition channel, e.g. "WB", "Ozon", "Referral". */
  source?: string
  status: ClientStatus
  /** The employee managing this account. */
  manager_id?: string
  /** Total revenue from this client in roubles. */
  total_spent: number
  created_at: string
}

/** Row from the `messages` table (chat). */
export interface Message {
  id: string
  /** The channel this message belongs to. */
  channel_id: string
  sender_id: string
  content: string
  /** ID of the message being quoted/replied to, if any. */
  reply_to?: string | null
  is_pinned: boolean
  created_at: string
}

/** Row from the `channels` table. */
export interface Channel {
  id: string
  /** Display name shown in the channel list. */
  name: string
  description?: string
  /** True for DMs and private groups. */
  is_private: boolean
  created_at: string
}

/** Row from the `knowledge_articles` table. */
export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  /** Matches one of the CATEGORY_META keys in KnowledgeClient. */
  category: string
  author_id: string
  /** Cumulative view count, incremented client-side on open. */
  views: number
  /** Estimated reading time in minutes, calculated from word count at save time. */
  read_time: number
  created_at: string
}

/** Row from the `notifications` table. */
export interface Notification {
  id: string
  user_id: string
  /** Category for icon selection: 'task' | 'ach' | 'alert' | 'info'. */
  type: string
  title: string
  /** Optional body text with details. */
  body?: string
  is_read: boolean
  /** Optional deep-link URL the user is taken to on click. */
  link?: string
  created_at: string
}

/** Shape of a sidebar navigation entry (defined in Sidebar.tsx). */
export interface NavItem {
  key: string
  label: string
  href: string
  /** Unread / pending count shown as a badge. */
  badge?: number | null
  /** If true, the item is only shown to users with the 'ceo' role. */
  ceo?: boolean
}

/** Row from the `news` table. */
export interface News {
  id: string
  title: string
  content: string
  tags: string[]
  author_id: string
  created_at: string
  updated_at: string
}

/** Row from the `news_comments` table. */
export interface NewsComment {
  id: string
  news_id: string
  user_id: string
  content: string
  created_at: string
}

/** Row from the `news_reads` table. */
export interface NewsRead {
  news_id: string
  user_id: string
  created_at: string
}
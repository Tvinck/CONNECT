/**
 * lib/utils.ts — Shared utility functions and constants used across the app.
 *
 * Covers:
 *  - Tailwind class merging (cn)
 *  - Number/currency formatting (fmtRub, fmtNum)
 *  - Avatar colour generation (colorFor, getInitials)
 *  - Role and level lookup tables (ROLES, LEVELS, levelInfo)
 *  - Date helpers (timeAgo, dueLabel)
 *  - Priority and status colour maps
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind classes, resolving conflicts correctly.
 * Use instead of plain template literals when class names may overlap
 * (e.g. `cn('px-2', condition && 'px-4')` → 'px-4').
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a Russian Rouble amount, e.g. 1500 → "1 500 ₽".
 * Rounds to the nearest integer before formatting.
 */
export function fmtRub(n: number): string {
  return Math.round(n).toLocaleString('ru-RU') + ' ₽'
}

/**
 * Formats a number with Russian locale digit separators, e.g. 12000 → "12 000".
 */
export function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('ru-RU')
}

/**
 * Lightens or darkens a hex colour by `percent` RGB steps.
 * Positive percent = lighter, negative = darker.
 * Clamps each channel to [0, 255].
 */
export function shadeColor(hex: string, percent: number): string {
  const c = hex.replace('#', '')
  const num = parseInt(c, 16)
  let r = (num >> 16) + percent
  let g = ((num >> 8) & 0xff) + percent
  let b = (num & 0xff) + percent
  r = Math.max(0, Math.min(255, r))
  g = Math.max(0, Math.min(255, g))
  b = Math.max(0, Math.min(255, b))
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

/** All user roles with display label, emoji, and brand colour. */
export const ROLES = [
  { id: 'ceo',     label: 'CEO',          emoji: '👑', color: '#FFC833' },
  { id: 'coowner', label: 'Совладелец',   emoji: '🤝', color: '#6F4FE8' },
  { id: 'design',  label: 'Дизайнер',     emoji: '🎨', color: '#FF4D9D' },
  { id: 'sales',   label: 'Продажи',      emoji: '💰', color: '#F59E0B' },
  { id: 'dev',     label: 'Разработка',   emoji: '💻', color: '#1472F5' },
  { id: 'support', label: 'Чат / SEO',    emoji: '💬', color: '#22C55E' },
] as const

/**
 * Maps priority and tag tone values to hex colours.
 * Keys include task priorities (urgent/high/medium/low) and Tag component tones.
 */
export const PRIORITY_COLOR: Record<string, string> = {
  urgent:  '#EF4444',
  high:    '#F59E0B',
  medium:  '#1472F5',
  low:     '#8B92B4',
  err:     '#EF4444',
  warn:    '#F59E0B',
  accent:  '#1472F5',
  mute:    '#8B92B4',
  ok:      '#22C55E',
}

/** Human-readable Russian labels for task status values stored in the DB. */
export const STATUS_LABEL: Record<string, string> = {
  todo:        'К выполнению',
  in_progress: 'В процессе',
  review:      'На проверке',
  done:        'Готово',
}

/**
 * Fixed palette used for avatar background colours.
 * Kept small so colours are visually distinct.
 */
const AVATAR_PALETTE = ['#1472F5', '#FF4D9D', '#22C55E', '#F59E0B', '#00C2FF', '#6F4FE8']

/**
 * Extracts up to two initials from a full name.
 * "Иван Петров" → "ИП", "Anna" → "A", null/undefined → "—".
 */
export function getInitials(name?: string | null): string {
  if (!name) return '—'
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Returns a deterministic avatar colour for any string seed (name or UUID).
 * Uses a simple polynomial hash so the same person always gets the same colour
 * without needing to store it in the database.
 */
export function colorFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

/**
 * Level thresholds. Each level unlocks at `min` cumulative points.
 * The last level (Легенда) has no ceiling — progress is shown as 100%.
 */
export const LEVELS = [
  { name: 'Новичок',    min: 0 },
  { name: 'Специалист', min: 250 },
  { name: 'Старший',    min: 500 },
  { name: 'Эксперт',    min: 1000 },
  { name: 'Легенда',    min: 2000 },
] as const

/**
 * Calculates the current level name, the next level threshold, progress
 * percentage toward the next level, and remaining points needed.
 *
 * @param points — user's current cumulative point balance
 */
export function levelInfo(points: number) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) idx = i
  const current = LEVELS[idx]
  const next = LEVELS[idx + 1] ?? null
  const progress = next
    ? Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100))
    : 100
  return { current, next, progress, remaining: next ? next.min - points : 0 }
}

/**
 * Returns a human-readable relative time string in Russian.
 * e.g. "только что", "5 мин назад", "2 ч назад", "3 дн назад".
 *
 * @param iso — ISO 8601 timestamp string from the database
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч назад`
  const d = Math.floor(h / 24)
  return `${d} дн назад`
}

/**
 * Returns a short deadline label for a task due date.
 * Handles overdue, today, tomorrow, within-a-week, and formatted date cases.
 *
 * @param iso — ISO 8601 date string, or null/undefined for tasks without a deadline
 */
export function dueLabel(iso?: string | null): string {
  if (!iso) return 'Без срока'
  const due = new Date(iso)
  const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date()
  const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.round((d1.getTime() - d2.getTime()) / 86400000)

  if (diffDays < 0) return 'Просрочено'
  if (diffDays === 0) return 'Сегодня'
  if (diffDays === 1) return 'Завтра'
  if (diffDays <= 7) return `Через ${diffDays} дн`
  return due.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

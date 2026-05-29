import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtRub(n: number): string {
  return Math.round(n).toLocaleString('ru-RU') + ' ₽'
}

export function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('ru-RU')
}

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

export const ROLES = [
  { id: 'ceo',     label: 'CEO',          emoji: '👑', color: '#FFC833' },
  { id: 'design',  label: 'Дизайнер',     emoji: '🎨', color: '#FF4D9D' },
  { id: 'sales',   label: 'Продажи',      emoji: '💰', color: '#F59E0B' },
  { id: 'dev',     label: 'Разработка',   emoji: '💻', color: '#1472F5' },
  { id: 'support', label: 'Чат / SEO',    emoji: '💬', color: '#22C55E' },
] as const

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

export const STATUS_LABEL: Record<string, string> = {
  todo:        'К выполнению',
  in_progress: 'В процессе',
  review:      'На проверке',
  done:        'Готово',
}

const AVATAR_PALETTE = ['#1472F5', '#FF4D9D', '#22C55E', '#F59E0B', '#00C2FF', '#6F4FE8']

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

// Deterministic avatar color from any string (name / id), so the same person
// always gets the same color without storing it.
export function colorFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

export const LEVELS = [
  { name: 'Новичок',    min: 0 },
  { name: 'Специалист', min: 250 },
  { name: 'Старший',    min: 500 },
  { name: 'Эксперт',    min: 1000 },
  { name: 'Легенда',    min: 2000 },
] as const

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

export function dueLabel(iso?: string | null): string {
  if (!iso) return 'Без срока'
  const due = new Date(iso)
  const diffDays = Math.ceil((due.getTime() - Date.now()) / 86400000)
  if (diffDays < 0) return 'Просрочено'
  if (diffDays === 0) return 'Сегодня'
  if (diffDays === 1) return 'Завтра'
  if (diffDays <= 7) return `Через ${diffDays} дн`
  return due.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

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

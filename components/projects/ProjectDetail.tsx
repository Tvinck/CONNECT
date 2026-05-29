/**
 * components/projects/ProjectDetail.tsx — Full project detail view.
 *
 * Sections:
 *  1. Header card — emoji, name, status, description, progress bar, edit button.
 *  2. Team panel  — list of assigned members with role; add/remove.
 *  3. Links panel — named URLs (GitHub, Figma, etc.); add/delete.
 *  4. Tasks list  — tasks for this project; filter by status; create new.
 *
 * All mutations use optimistic UI + rollback on error.
 *
 * Sub-modals: EditProjectModal · AddMemberModal · AddLinkModal
 * Task creation reuses CreateTaskModal with the project pre-selected.
 */

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Pencil, Plus, Trash2, ExternalLink, Link2, Loader2, User2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Progress } from '@/components/ui/Progress'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'
import { getInitials, colorFor, dueLabel, PRIORITY_COLOR } from '@/lib/utils'
import type { TaskRow } from '@/components/tasks/TasksBoard'
import { AddTransactionModal, TX_CATEGORIES, type TxRow } from '@/components/finance/FinancesClient'
import type { ProjectStatus, TaskStatus } from '@/types'
import { fmtRub } from '@/lib/utils'

// ─── local types ──────────────────────────────────────────────────────────────

export type ProjectFull = {
  id: string
  name: string
  slug: string
  emoji: string | null
  color: string
  status: ProjectStatus
  progress: number
  description: string | null
  created_at: string
}

export type ProjectMemberRow = {
  role: 'lead' | 'member'
  user: {
    id: string
    full_name: string
    role: string
    position: string | null
    status: string
  }
}

export type ProjectLinkRow = {
  id: string
  label: string
  url: string
}

type UserOption = { id: string; full_name: string }

interface Props {
  project: ProjectFull
  initialMembers: ProjectMemberRow[]
  initialLinks: ProjectLinkRow[]
  initialTasks: TaskRow[]
  initialTransactions: TxRow[]
  allUsers: UserOption[]
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'mute'> = {
  active: 'ok', dev: 'warn', planning: 'mute',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Активный', dev: 'В разработке', planning: 'Планирование',
}
const ROLE_TONE: Record<string, 'accent' | 'mute'> = { lead: 'accent', member: 'mute' }
const ROLE_LABEL: Record<string, string> = { lead: 'Лид', member: 'Участник' }

const TASK_STATUS_LABEL: Record<string, string> = {
  todo: 'Сделать', in_progress: 'В работе', review: 'Проверка', done: 'Готово',
}
const TASK_STATUS_TONE: Record<string, 'mute' | 'accent' | 'warn' | 'ok'> = {
  todo: 'mute', in_progress: 'accent', review: 'warn', done: 'ok',
}

const COLOR_OPTIONS = ['#1472F5', '#FF4D9D', '#22C55E', '#F59E0B', '#00C2FF', '#6F4FE8']
const EMOJI_OPTIONS = ['🎁', '✨', '🛒', '🚀', '📦', '💡', '🎨', '📊', '🔧', '🌟', '🎯', '💬']

/** Returns the hostname of a URL, or empty string on parse failure. */
function domainOf(url: string) {
  try { return new URL(url).hostname } catch { return '' }
}

const FIELD = 'w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all'
const SELECT = 'w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13px] transition-all'
const LABEL = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

// ─── sub-modals ───────────────────────────────────────────────────────────────

function EditProjectModal({
  project, onClose, onSaved,
}: {
  project: ProjectFull
  onClose: () => void
  onSaved: (p: ProjectFull) => void
}) {
  const supabase = createClient()
  const [name,        setName]        = useState(project.name)
  const [emoji,       setEmoji]       = useState(project.emoji ?? '🚀')
  const [color,       setColor]       = useState(project.color)
  const [status,      setStatus]      = useState<ProjectStatus>(project.status)
  const [progress,    setProgress]    = useState(project.progress)
  const [description, setDescription] = useState(project.description ?? '')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const save = async () => {
    if (!name.trim()) { setError('Укажите название'); return }
    setSaving(true); setError('')
    const { data, error: dbErr } = await supabase
      .from('projects')
      .update({ name: name.trim(), emoji, color, status, progress, description: description.trim() || null })
      .eq('id', project.id)
      .select('id, name, slug, emoji, color, status, progress, description, created_at')
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) onSaved(data as ProjectFull)
    onClose()
  }

  return (
    <Modal
      title="Редактировать проект"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving && <Loader2 size={15} className="animate-spin" />} Сохранить
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Название *</label>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Иконка</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_OPTIONS.map(em => (
              <button key={em} onClick={() => setEmoji(em)} type="button"
                className={`w-9 h-9 rounded-xl text-lg inline-flex items-center justify-center border transition-all ${
                  emoji === em ? 'border-accent bg-accent/15' : 'border-line hover:border-line2 bg-white/[0.02]'
                }`}>
                {em}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL}>Цвет</label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map(c => (
              <button key={c} onClick={() => setColor(c)} type="button"
                className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-[#151829]' : ''}`}
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Статус</label>
            <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)} className={SELECT}>
              <option value="planning">Планирование</option>
              <option value="dev">В разработке</option>
              <option value="active">Активный</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Готовность: {progress}%</label>
            <input type="range" min={0} max={100} step={5} value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              className="w-full h-10 accent-accent" />
          </div>
        </div>
        <div>
          <label className={LABEL}>Описание</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="О проекте…"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all resize-none" />
        </div>
        {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
      </div>
    </Modal>
  )
}

function AddMemberModal({
  projectId, allUsers, existing, onClose, onAdded,
}: {
  projectId: string
  allUsers: UserOption[]
  existing: ProjectMemberRow[]
  onClose: () => void
  onAdded: (m: ProjectMemberRow) => void
}) {
  const supabase = createClient()
  const available = allUsers.filter(u => !existing.some(m => m.user.id === u.id))
  const [userId,  setUserId]  = useState(available[0]?.id ?? '')
  const [role,    setRole]    = useState<'lead' | 'member'>('member')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const add = async () => {
    if (!userId) { setError('Выберите сотрудника'); return }
    setSaving(true); setError('')
    const { error: dbErr } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role })
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    const picked = allUsers.find(u => u.id === userId)!
    onAdded({ role, user: { id: picked.id, full_name: picked.full_name, role: '', position: null, status: 'offline' } })
    onClose()
  }

  return (
    <Modal
      title="Добавить участника"
      onClose={onClose}
      maxWidth="max-w-[400px]"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={add} disabled={saving || available.length === 0}>
            {saving && <Loader2 size={15} className="animate-spin" />} Добавить
          </Button>
        </>
      }
    >
      {available.length === 0 ? (
        <p className="text-[13px] text-mute py-2">Все сотрудники уже добавлены в проект.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Сотрудник</label>
            <select value={userId} onChange={e => setUserId(e.target.value)} className={SELECT}>
              {available.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Роль в проекте</label>
            <select value={role} onChange={e => setRole(e.target.value as 'lead' | 'member')} className={SELECT}>
              <option value="member">Участник</option>
              <option value="lead">Лид</option>
            </select>
          </div>
          {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
        </div>
      )}
    </Modal>
  )
}

function AddLinkModal({
  projectId, onClose, onAdded,
}: {
  projectId: string
  onClose: () => void
  onAdded: (l: ProjectLinkRow) => void
}) {
  const supabase = createClient()
  const [label,  setLabel]  = useState('')
  const [url,    setUrl]    = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const add = async () => {
    if (!label.trim()) { setError('Укажите название ссылки'); return }
    if (!url.trim())   { setError('Укажите URL'); return }
    const normalized = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`
    setSaving(true); setError('')
    const { data, error: dbErr } = await supabase
      .from('project_links')
      .insert({ project_id: projectId, label: label.trim(), url: normalized })
      .select('id, label, url')
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) onAdded(data as ProjectLinkRow)
    onClose()
  }

  return (
    <Modal
      title="Добавить ссылку"
      onClose={onClose}
      maxWidth="max-w-[400px]"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={add} disabled={saving}>
            {saving && <Loader2 size={15} className="animate-spin" />} Добавить
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Название</label>
          <input value={label} onChange={e => setLabel(e.target.value)} autoFocus
            placeholder="GitHub, Figma, Документация…" className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://…" type="url" className={FIELD} />
        </div>
        {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
      </div>
    </Modal>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function ProjectDetail({ project: initialProject, initialMembers, initialLinks, initialTasks, initialTransactions, allUsers }: Props) {
  const supabase = createClient()
  const addToast = useUIStore(s => s.addToast)

  const [project,     setProject]     = useState<ProjectFull>(initialProject)
  const [members,     setMembers]     = useState<ProjectMemberRow[]>(initialMembers)
  const [links,       setLinks]       = useState<ProjectLinkRow[]>(initialLinks)
  const [tasks,       setTasks]       = useState<TaskRow[]>(initialTasks)
  const [txList,      setTxList]      = useState<TxRow[]>(initialTransactions)
  const [taskFilter,  setTaskFilter]  = useState<TaskStatus | 'all'>('all')

  const [showAddTx,      setShowAddTx]      = useState(false)
  const [showEdit,       setShowEdit]       = useState(false)
  const [showAddMember,  setShowAddMember]  = useState(false)
  const [showAddLink,    setShowAddLink]    = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [removingLink,   setRemovingLink]   = useState<string | null>(null)

  const taskCounts = useMemo(() => ({
    todo:        tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review:      tasks.filter(t => t.status === 'review').length,
    done:        tasks.filter(t => t.status === 'done').length,
  }), [tasks])

  const visibleTasks = useMemo(
    () => taskFilter === 'all' ? tasks : tasks.filter(t => t.status === taskFilter),
    [tasks, taskFilter],
  )

  const removeMember = async (userId: string) => {
    setRemovingMember(userId)
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', project.id)
      .eq('user_id', userId)
    setRemovingMember(null)
    if (error) { addToast('Ошибка', 'Не удалось удалить участника', 'err'); return }
    setMembers(prev => prev.filter(m => m.user.id !== userId))
  }

  const removeLink = async (linkId: string) => {
    setRemovingLink(linkId)
    const { error } = await supabase.from('project_links').delete().eq('id', linkId)
    setRemovingLink(null)
    if (error) { addToast('Ошибка', 'Не удалось удалить ссылку', 'err'); return }
    setLinks(prev => prev.filter(l => l.id !== linkId))
  }

  return (
    <>
      {/* Back navigation */}
      <Link href="/projects"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-mute hover:text-white transition-all mb-5">
        <ArrowLeft size={14} /> Проекты
      </Link>

      {/* ── Header card ─────────────────────────────────────────── */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[32px] shrink-0"
              style={{ background: `${project.color}22` }}>
              {project.emoji ?? '📁'}
            </div>
            <div>
              <h2 className="text-[24px] font-bold tracking-tight leading-tight">{project.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Tag tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</Tag>
                <span className="text-[12px] text-mute2">
                  с {new Date(project.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              {project.description && (
                <p className="text-[13px] text-mute mt-2 max-w-[540px] leading-relaxed">{project.description}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil size={14} /> Редактировать
          </Button>
        </div>

        {/* Task completion summary + progress bar */}
        <div className="mt-5 pt-5 border-t border-line">
          <div className="flex items-center justify-between mb-2.5 gap-2 flex-wrap">
            <div className="flex items-center gap-4 text-[12px] text-mute flex-wrap">
              {[
                { label: 'Сделать',    count: taskCounts.todo,        color: '#8B92B4' },
                { label: 'В работе',   count: taskCounts.in_progress, color: '#1472F5' },
                { label: 'Проверка',   count: taskCounts.review,      color: '#F59E0B' },
                { label: 'Готово',     count: taskCounts.done,        color: '#22C55E' },
              ].map(s => (
                <span key={s.label} className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.color }} />
                  {s.label}: {s.count}
                </span>
              ))}
            </div>
            <span className="text-[14px] font-bold tabular-nums" style={{ color: project.color }}>
              {project.progress}%
            </span>
          </div>
          <Progress value={project.progress} color={project.color} height={8} />
        </div>
      </div>

      {/* ── Team + Links ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Team */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-semibold tracking-tight">
              Команда
              <span className="ml-2 text-[11px] text-mute2 font-mono bg-white/[0.04] px-2 h-5 rounded-md inline-flex items-center">
                {members.length}
              </span>
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setShowAddMember(true)}>
              <Plus size={13} /> Добавить
            </Button>
          </div>

          {members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <User2 size={22} className="text-mute2" />
              <p className="text-[12.5px] text-mute">Участников пока нет</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
                  <Avatar initials={getInitials(m.user.full_name)} color={colorFor(m.user.full_name)} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{m.user.full_name}</div>
                    {m.user.position && (
                      <div className="text-[11.5px] text-mute truncate">{m.user.position}</div>
                    )}
                  </div>
                  <Tag tone={ROLE_TONE[m.role]}>{ROLE_LABEL[m.role]}</Tag>
                  <button
                    onClick={() => removeMember(m.user.id)}
                    disabled={removingMember === m.user.id}
                    aria-label={`Удалить ${m.user.full_name}`}
                    className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 text-mute hover:text-err transition-all inline-flex items-center justify-center disabled:opacity-40"
                  >
                    {removingMember === m.user.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Links */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-semibold tracking-tight">Ссылки</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowAddLink(true)}>
              <Plus size={13} /> Добавить
            </Button>
          </div>

          {links.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Link2 size={22} className="text-mute2" />
              <p className="text-[12.5px] text-mute">Ссылок пока нет</p>
            </div>
          ) : (
            <div className="space-y-2">
              {links.map(l => {
                const domain = domainOf(l.url)
                return (
                  <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-line inline-flex items-center justify-center shrink-0 overflow-hidden">
                      {domain ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                          alt=""
                          width={16}
                          height={16}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <Link2 size={13} className="text-mute" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{l.label}</div>
                      <a href={l.url} target="_blank" rel="noopener noreferrer"
                        className="text-[11.5px] text-mute hover:text-accent transition-colors inline-flex items-center gap-1 truncate max-w-full"
                        onClick={e => e.stopPropagation()}
                      >
                        {domain || l.url}
                        <ExternalLink size={10} />
                      </a>
                    </div>
                    <button
                      onClick={() => removeLink(l.id)}
                      disabled={removingLink === l.id}
                      aria-label={`Удалить ссылку ${l.label}`}
                      className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 text-mute hover:text-err transition-all inline-flex items-center justify-center disabled:opacity-40"
                    >
                      {removingLink === l.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Trash2 size={12} />
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Tasks ────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-semibold tracking-tight">Задачи</h3>
            <span className="text-[11px] text-mute2 font-mono bg-white/[0.04] px-2 h-5 rounded-md inline-flex items-center">
              {tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={taskFilter}
              onChange={e => setTaskFilter(e.target.value as TaskStatus | 'all')}
              className="h-8 px-2.5 rounded-lg border border-line bg-white/[0.02] text-[12.5px] text-mute hover:text-white transition-all outline-none"
            >
              <option value="all">Все статусы</option>
              <option value="todo">Сделать</option>
              <option value="in_progress">В работе</option>
              <option value="review">Проверка</option>
              <option value="done">Готово</option>
            </select>
            <Button size="sm" onClick={() => setShowCreateTask(true)}>
              <Plus size={13} /> Задача
            </Button>
          </div>
        </div>

        {visibleTasks.length === 0 ? (
          <div className="text-center py-8 text-mute text-[13px]">
            {tasks.length === 0 ? 'Задач ещё нет — создайте первую' : 'В этом статусе нет задач'}
          </div>
        ) : (
          <div className="space-y-1">
            {visibleTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: PRIORITY_COLOR[t.priority] ?? '#8B92B4' }} />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] truncate">{t.title}</span>
                </div>
                <Tag tone={TASK_STATUS_TONE[t.status]}>{TASK_STATUS_LABEL[t.status]}</Tag>
                {t.due_date && (
                  <span className="text-[11.5px] text-mute2 font-mono shrink-0">{dueLabel(t.due_date)}</span>
                )}
                {t.assignee ? (
                  <Avatar
                    initials={getInitials(t.assignee.full_name)}
                    color={colorFor(t.assignee.full_name)}
                    size={22}
                  />
                ) : (
                  <div className="w-5.5 h-5.5 rounded-full bg-white/[0.06] border border-line inline-flex items-center justify-center shrink-0">
                    <User2 size={10} className="text-mute2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Project Finances ─────────────────────────────────────── */}
      {(() => {
        const txIncome  = txList.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const txExpense = txList.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        const txNet     = txIncome - txExpense
        return (
          <div className="card p-5 mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold tracking-tight">Финансы проекта</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowAddTx(true)}>
                <Plus size={13} /> Транзакция
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Доходы',  value: txIncome,  positive: true,      always: true },
                { label: 'Расходы', value: txExpense, positive: false,     always: true },
                { label: 'Баланс',  value: txNet,     positive: txNet >= 0, always: true },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-white/[0.025] border border-line p-3.5">
                  <div className="text-[11px] text-mute2 uppercase tracking-[0.1em] font-semibold mb-1.5">{s.label}</div>
                  <div className={`text-[17px] font-bold tabular-nums ${s.positive ? 'text-ok' : 'text-err'}`}>
                    {txNet === 0 && s.label === 'Баланс' ? fmtRub(0) : (s.positive ? '+' : '−') + fmtRub(Math.abs(s.value))}
                  </div>
                </div>
              ))}
            </div>

            {txList.length === 0 ? (
              <div className="text-center py-6 text-mute text-[12.5px]">Транзакций пока нет</div>
            ) : (
              <div className="space-y-1">
                {txList.map(t => {
                  const cat = TX_CATEGORIES[t.category] ?? TX_CATEGORIES.other
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.02] transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: t.type === 'income' ? '#22C55E' : '#EF4444' }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] truncate">{t.description}</span>
                      </div>
                      <span className="text-[11px] text-mute shrink-0">
                        {new Date(t.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-[11px] px-2 h-4.5 rounded-full inline-flex items-center"
                        style={{ background: `${cat.color}20`, color: cat.color }}>
                        {cat.label}
                      </span>
                      <span className={`text-[13px] font-bold tabular-nums font-mono shrink-0 ${
                        t.type === 'income' ? 'text-ok' : 'text-err'
                      }`}>
                        {t.type === 'income' ? '+' : '−'}{fmtRub(Number(t.amount))}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── modals ───────────────────────────────────────────────── */}

      {showEdit && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setProject(updated); setShowEdit(false) }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={project.id}
          allUsers={allUsers}
          existing={members}
          onClose={() => setShowAddMember(false)}
          onAdded={m => setMembers(prev => [...prev, m])}
        />
      )}

      {showAddLink && (
        <AddLinkModal
          projectId={project.id}
          onClose={() => setShowAddLink(false)}
          onAdded={l => setLinks(prev => [...prev, l])}
        />
      )}

      {showAddTx && (
        <AddTransactionModal
          projects={[{ id: project.id, name: project.name, color: project.color }]}
          initialProjectId={project.id}
          onClose={() => setShowAddTx(false)}
          onAdded={t => setTxList(prev => [t, ...prev])}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          projects={[{ id: project.id, name: project.name, color: project.color }]}
          users={allUsers}
          initialProjectId={project.id}
          onClose={() => setShowCreateTask(false)}
          onCreated={task => { setTasks(prev => [task, ...prev]); setShowCreateTask(false) }}
        />
      )}
    </>
  )
}

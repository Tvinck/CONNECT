'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/Progress'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { getInitials, colorFor } from '@/lib/utils'
import { useUIStore } from '@/store/ui'
import type { ProjectStatus } from '@/types'

type ProjectRow = {
  id: string
  name: string
  slug: string
  emoji: string | null
  color: string
  status: ProjectStatus
  progress: number
  description: string | null
  tasks: number
  team: number
  members?: { id: string; full_name: string }[]
}

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'mute'> = {
  active: 'ok', dev: 'warn', planning: 'mute',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Активный', dev: 'В разработке', planning: 'Планирование',
}
const COLOR_OPTIONS = ['#1472F5', '#FF4D9D', '#22C55E', '#F59E0B', '#00C2FF', '#6F4FE8']
const EMOJI_OPTIONS = ['🎁', '✨', '🛒', '🚀', '📦', '💡', '🎨', '📊', '🔧', '🌟', '🎯', '💬']

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: ProjectRow) => void }) {
  const supabase = createClient()
  const { addToast } = useUIStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🚀')
  const [color, setColor] = useState('#1472F5')
  const [status, setStatus] = useState<ProjectStatus>('planning')
  const [description, setDescription] = useState('')
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40) || `project-${Date.now()}`

  const create = async () => {
    if (!name.trim()) { setError('Укажите название проекта'); return }
    setSaving(true); setError('')
    const { data, error: dbErr } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        slug: slugify(name),
        emoji,
        color,
        status,
        progress,
        description: description.trim() || null,
      })
      .select('id, name, slug, emoji, color, status, progress, description')
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) {
      onCreated({ ...(data as unknown as ProjectRow), tasks: 0, team: 0 })
      addToast('Проект создан', `«${data.name}» добавлен`, 'ok')
    }
    onClose()
  }

  return (
    <Modal
      title="Новый проект"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Отмена</Button>
          <Button className="flex-1" onClick={create} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : null} Создать
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Название *</label>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="Название проекта"
            className="w-full h-10 px-3.5 rounded-xl bg-bg/40 border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all" />
        </div>

        <div>
          <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Иконка</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_OPTIONS.map(em => (
              <button key={em} onClick={() => setEmoji(em)}
                className={`w-9 h-9 rounded-xl text-lg inline-flex items-center justify-center border transition-all ${
                  emoji === em ? 'border-accent bg-accent/15' : 'border-line hover:border-line2 bg-bg'
                }`}>
                {em}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Цвет</label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-[#151829]' : ''}`}
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Статус</label>
            <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}
              className="w-full h-10 px-3 rounded-xl bg-bg/40 border border-line focus:border-accent/60 outline-none text-[13px] transition-all">
              <option value="planning">Планирование</option>
              <option value="dev">В разработке</option>
              <option value="active">Активный</option>
            </select>
          </div>
          <div>
            <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Готовность: {progress}%</label>
            <input type="range" min={0} max={100} step={5} value={progress} onChange={e => setProgress(Number(e.target.value))}
              className="w-full h-10 accent-accent" />
          </div>
        </div>

        <div>
          <label className="block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2">Описание</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="О проекте…"
            className="w-full px-3.5 py-2.5 rounded-xl bg-bg/40 border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all resize-none" />
        </div>

        {error && <div className="text-[12.5px] text-err bg-err/10 border border-err/20 rounded-xl px-3 py-2">{error}</div>}
      </div>
    </Modal>
  )
}

export function ProjectsClient({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const [projects, setProjects] = useState<ProjectRow[]>(initialProjects)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-mute text-sm">Все проекты команды</p>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Новый проект</Button>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <EmptyState
            emoji="📁"
            title="Проектов пока нет"
            description="Создайте первый проект — он появится здесь вместе с задачами и командой."
            action={<Button onClick={() => setShowCreate(true)}><Plus size={16} /> Новый проект</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map(p => (
            <Link key={p.id} href={p.slug === 'bazzar-serts-2' ? '/b2' : `/projects/${p.slug}`} prefetch={false} className="card p-6 lift block">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl inline-flex items-center justify-center text-2xl"
                  style={{ background: `${p.color}22` }}>
                  {p.emoji ?? '📁'}
                </div>
                <Tag tone={STATUS_TONE[p.status] ?? 'mute'}>{STATUS_LABEL[p.status] ?? p.status}</Tag>
              </div>
              <h3 className="text-[17px] font-bold tracking-tight">{p.name}</h3>
              <p className="text-[12.5px] text-mute mt-1">
                {p.tasks} {p.tasks === 1 ? 'задача' : 'задач'} · {p.team} {p.team === 1 ? 'участник' : 'участника'}
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-mute">Готовность</span>
                  <span className="text-[13px] font-bold" style={{ color: p.color }}>{p.progress}%</span>
                </div>
                <Progress value={p.progress} color={p.color} height={6} />
              </div>
              {p.members && p.members.length > 0 && (
                <div className="flex items-center mt-4 pt-4 border-t border-line">
                  <div className="flex -space-x-2">
                    {p.members.slice(0, 4).map(m => (
                      <Avatar
                        key={m.id}
                        initials={getInitials(m.full_name)}
                        color={colorFor(m.full_name || m.id)}
                        size={26}
                        className="ring-2 ring-card rounded-full"
                      />
                    ))}
                  </div>
                  {p.team > 4 && (
                    <span className="ml-2 self-center text-[11px] text-mute font-semibold">+{p.team - 4}</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </>
  )
}

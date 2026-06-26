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

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Pencil, Plus, Trash2, ExternalLink, Link2, Loader2, User2, Settings,
  Server, Activity, Users, CreditCard, Globe, Search, Copy, Check, Info, Calendar, Key, AlertCircle, Gift, LayoutGrid, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Progress } from '@/components/ui/Progress'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui'
import { getInitials, colorFor, dueLabel, PRIORITY_COLOR } from '@/lib/utils'
import { Links } from './ProjectDetail/Links'
import { Team } from './ProjectDetail/Team'
import type { TaskRow } from '@/components/tasks/TasksBoard'
import { AddTransactionModal, TX_CATEGORIES, type TxRow } from '@/components/finance/FinancesClient'
import type { ProjectStatus, TaskStatus } from '@/types'
import { fmtRub } from '@/lib/utils'

// Pixel subcomponents
import { PixelUsers } from './ProjectDetail/PixelUsers'
import { PixelTransactions } from './ProjectDetail/PixelTransactions'
import { PixelCreations } from './ProjectDetail/PixelCreations'
import { PixelSubscriptions } from './ProjectDetail/PixelSubscriptions'
import { PixelTemplates } from './ProjectDetail/PixelTemplates'

// Bazzar Certs subcomponents
import { AppleCertsPanel } from './ProjectDetail/AppleCertsPanel'
import { BazzarProductsPanel } from './ProjectDetail/BazzarProductsPanel'
import { BazzarUsersPanel } from './ProjectDetail/BazzarUsersPanel'
import { BazzarAnalyticsPanel } from './ProjectDetail/BazzarAnalyticsPanel'
import { BazzarReviewsPanel } from './ProjectDetail/BazzarReviewsPanel'

// ─── local types ──────────────────────────────────────────────────────────────

/** Полные метаданные проекта */
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

/** Описание строки участника команды проекта */
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

/** Описание строки ссылки проекта */
export type ProjectLinkRow = {
  id: string
  label: string
  url: string
}

/** Опция выбора сотрудника для назначения задач */
export type UserOption = { id: string; full_name: string }

/** Входящие свойства компонента ProjectDetail */
interface Props {
  /** Модель текущего проекта */
  project: ProjectFull
  /** Первоначальный список участников проекта */
  initialMembers: ProjectMemberRow[]
  /** Первоначальный список ссылок проекта */
  initialLinks: ProjectLinkRow[]
  /** Первоначальный список задач проекта */
  initialTasks: TaskRow[]
  /** Первоначальный список транзакций проекта */
  initialTransactions: TxRow[]
  /** Список всех активных сотрудников для назначения */
  allUsers: UserOption[]
  /** VPN-серверы (только для проекта Veil VPN) */
  vpnServers?: any[] | null
  /** VPN-подписки клиентов (только для проекта Veil VPN) */
  vpnSubscriptions?: any[] | null
  /** История VPN-платежей клиентов (только для проекта Veil VPN) */
  vpnOrders?: any[] | null
  /** Реферальные связи VPN (только для проекта Veil VPN) */
  vpnReferrals?: any[] | null

  // Pixel AI tables
  pixelUsers?: any[] | null
  pixelTransactions?: any[] | null
  pixelCreations?: any[] | null
  pixelSubscriptions?: any[] | null
  pixelTemplates?: any[] | null
  pixelCategories?: any[] | null
  pixelStars?: any[] | null
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Цветовые тона для различных статусов проекта */
const STATUS_TONE: Record<string, 'ok' | 'warn' | 'mute'> = {
  active: 'ok', dev: 'warn', planning: 'mute',
}

/** Русскоязычные лейблы для статусов проекта */
const STATUS_LABEL: Record<string, string> = {
  active: 'Активный', dev: 'В разработке', planning: 'Планирование',
}

/** Цветовые схемы для ролей участников проекта */
const ROLE_TONE: Record<string, 'accent' | 'mute'> = { lead: 'accent', member: 'mute' }

/** Русскоязычные названия ролей участников проекта */
const ROLE_LABEL: Record<string, string> = { lead: 'Лид', member: 'Участник' }

/** Локализованные лейблы статусов задач */
const TASK_STATUS_LABEL: Record<string, string> = {
  todo: 'Сделать', in_progress: 'В работе', review: 'Проверка', done: 'Готово',
}

/** Цветовые схемы статусов задач */
const TASK_STATUS_TONE: Record<string, 'mute' | 'accent' | 'warn' | 'ok'> = {
  todo: 'mute', in_progress: 'accent', review: 'warn', done: 'ok',
}

/** Доступные цвета для кастомизации проекта */
export const COLOR_OPTIONS = ['#1472F5', '#FF4D9D', '#22C55E', '#F59E0B', '#00C2FF', '#6F4FE8']

/** Предустановленные иконки/эмодзи для проекта */
export const EMOJI_OPTIONS = ['🎁', '✨', '🛒', '🚀', '📦', '💡', '🎨', '📊', '🔧', '🌟', '🎯', '💬']

/**
 * Извлекает хостнейм из предоставленной URL строки.
 * 
 * @param url URL адрес
 * @returns Строка хостнейма (например, 'github.com') или пустая строка в случае ошибки парсинга
 */
function domainOf(url: string) {
  try { return new URL(url).hostname } catch { return '' }
}

/** Стили для полей ввода (HTML input) */
export const FIELD = 'w-full h-10 px-3.5 rounded-xl bg-bg/40 border border-line focus:border-accent/60 outline-none text-[13.5px] placeholder:text-mute2 transition-all'

/** Стили для селектов (HTML select) */
export const SELECT = 'w-full h-10 px-3 rounded-xl bg-bg/40 border border-line focus:border-accent/60 outline-none text-[13px] transition-all'

/** Стили для заголовков полей форм (HTML label) */
export const LABEL = 'block text-[11.5px] uppercase tracking-[0.1em] text-mute2 font-semibold mb-2'

// ─── sub-modals imports ───────────────────────────────────────────────────────────────
import { EditProjectModal } from './EditProjectModal';
import { AddMemberModal } from './AddMemberModal';
import { AddLinkModal } from './AddLinkModal';
import { CreateVpnSubModal } from './CreateVpnSubModal';
import { ManageVpnSubModal } from './ManageVpnSubModal';

// ─── main component ───────────────────────────────────────────────────────────

export function ProjectDetail({ 
  project: initialProject, 
  initialMembers, 
  initialLinks, 
  initialTasks, 
  initialTransactions, 
  allUsers,
  vpnServers: initialVpnServers,
  vpnSubscriptions: initialVpnSubscriptions,
  vpnOrders: initialVpnOrders,
  vpnReferrals: initialVpnReferrals,

  pixelUsers,
  pixelTransactions,
  pixelCreations,
  pixelSubscriptions,
  pixelTemplates,
  pixelCategories,
  pixelStars
}: Props) {
  const supabase = createClient()
  const addToast = useUIStore(s => s.addToast)

  const [project,     setProject]     = useState<ProjectFull>(initialProject)
  const [members,     setMembers]     = useState<ProjectMemberRow[]>(initialMembers)
  const [links,       setLinks]       = useState<ProjectLinkRow[]>(initialLinks)
  const [tasks,       setTasks]       = useState<TaskRow[]>(initialTasks)
  const [txList,      setTxList]      = useState<TxRow[]>(initialTransactions)
  const [taskFilter,  setTaskFilter]  = useState<TaskStatus | 'all'>('all')
  const [viewingTask, setViewingTask] = useState<TaskRow | null>(null)

  // VPN admin panel states
  const isVpn = project.slug === 'veil' || project.slug === 'veil-vpn'
  const isPixel = project.slug === 'pixel' || project.slug === 'bazzar-pixel'
  const isBazzarCerts = project.slug === 'bazzar-certs' || project.slug === 'bazzar-sert' || project.slug === 'bazzarcerts'
  const [activeTab, setActiveTab] = useState<string>('project')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [vpnServers, setVpnServers] = useState<any[]>(initialVpnServers ?? [])
  const [vpnSubs, setVpnSubs] = useState<any[]>(initialVpnSubscriptions ?? [])
  const [vpnOrders, setVpnOrders] = useState<any[]>(initialVpnOrders ?? [])
  const [vpnReferrals, setVpnReferrals] = useState<any[]>(initialVpnReferrals ?? [])
  const [showCreateVpnSub, setShowCreateVpnSub] = useState(false)
  const [managingSub, setManagingSub] = useState<any | null>(null)

  const [showAddTx,      setShowAddTx]      = useState(false)
  const [showEdit,       setShowEdit]       = useState(false)
  const [showAddMember,  setShowAddMember]  = useState(false)
  const [showAddLink,    setShowAddLink]    = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [removingLink,   setRemovingLink]   = useState<string | null>(null)

  // VPN admin fields states
  const [srvName, setSrvName] = useState('')
  const [srvIp, setSrvIp] = useState('')
  const [srvPort, setSrvPort] = useState('443')
  const [srvCountry, setSrvCountry] = useState('DE')
  const [srvPublicKey, setSrvPublicKey] = useState('')
  const [srvShortId, setSrvShortId] = useState('')
  const [srvSni, setSrvSni] = useState('yahoo.com')
  const [srvFlow, setSrvFlow] = useState('xtls-rprx-vision')
  const [addingSrv, setAddingSrv] = useState(false)

  // Sync VPN servers automatically
  useEffect(() => {
    if (activeTab !== 'servers') return
    
    let isMounted = true
    const syncServers = async () => {
      try {
        await fetch('/api/servers/sync', { method: 'POST' })
        const { data } = await supabase.from('vpn_servers').select('*').order('name')
        if (isMounted && data) {
          setVpnServers(data)
        }
      } catch (err) {
        console.error('Failed to sync servers', err)
      }
    }

    syncServers()
    const interval = setInterval(syncServers, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  /**
   * Добавляет новый VPN-сервер во внешнюю базу данных.
   * Генерирует случайные первоначальные метрики пинга и нагрузки.
   */
  const addVpnServer = async () => {
    if (!srvName.trim()) { addToast('Ошибка', 'Укажите название сервера', 'err'); return }
    setAddingSrv(true)
    const mockPing = Math.floor(Math.random() * 80) + 5
    const mockLoad = Math.floor(Math.random() * 60) + 10
    
    const { data, error } = await supabase
      .from('vpn_servers')
      .insert({ 
        name: srvName.trim(), 
        country_code: srvCountry, 
        ip_address: srvIp.trim() || '127.0.0.1', 
        ping_ms: mockPing, 
        load_percentage: mockLoad,
        port: Number(srvPort) || 443,
        reality_public_key: srvPublicKey.trim() || null,
        reality_short_id: srvShortId.trim() || null,
        reality_sni: srvSni.trim() || 'yahoo.com',
        reality_flow: srvFlow.trim() || 'xtls-rprx-vision'
      })
      .select()
      .single()
      
    setAddingSrv(false)
    if (error) { addToast('Ошибка', error.message, 'err'); return }
    if (data) {
      setVpnServers(prev => [...prev, data])
      setSrvName('')
      setSrvIp('')
      setSrvPort('443')
      setSrvPublicKey('')
      setSrvShortId('')
      setSrvSni('yahoo.com')
      setSrvFlow('xtls-rprx-vision')
      addToast('Успешно', 'Сервер добавлен в базу данных', 'ok')
    }
  }

  /**
   * Удаляет VPN-сервер по его идентификатору.
   * 
   * @param id Уникальный ID сервера в базе данных
   */
  const deleteVpnServer = async (id: string) => {
    const { error } = await supabase.from('vpn_servers').delete().eq('id', id)
    if (error) { addToast('Ошибка', 'Не удалось удалить сервер', 'err'); return }
    setVpnServers(prev => prev.filter(s => s.id !== id))
    addToast('Успешно', 'Сервер удален из базы данных', 'ok')
  }

  /**
   * Удаляет подписку и связанного с ней пользователя (каскадное удаление).
   * 
   * @param sub Объект подписки, содержащий id и user_id
   */
  const deleteVpnSub = async (sub: any) => {
    const { error } = await supabase.from('vpn_subscriptions').delete().eq('id', sub.id)
    if (error) { addToast('Ошибка', 'Не удалось удалить подписку', 'err'); return }
    setVpnSubs(prev => prev.filter(s => s.id !== sub.id))
    addToast('Успешно', 'Подписка удалена из базы данных', 'ok')
  }

  /**
   * Продлевает активную или закончившуюся подписку на 30 дней от даты окончания
   * или от текущей даты (если она уже истекла).
   * 
   * @param sub Объект подписки
   */
  const extendVpnSub = async (sub: any) => {
    try {
      const currentExpiry = new Date(sub.expires_at)
      const baseDate = currentExpiry.getTime() > new Date().getTime() ? currentExpiry : new Date()
      const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)

      const { error } = await supabase
        .from('vpn_subscriptions')
        .update({ 
          expires_at: newExpiry.toISOString(),
          status: 'active'
        })
        .eq('id', sub.id)

      if (error) throw error

      setVpnSubs(prev => prev.map(s => s.id === sub.id ? { ...s, expires_at: newExpiry.toISOString(), status: 'active' } : s))
      addToast('Успешно', 'Подписка продлена на 30 дней', 'ok')
    } catch (err) {
      console.error(err)
      addToast('Ошибка', 'Не удалось продлить подписку', 'err')
    }
  }

  /**
   * Копирует VLESS ключ подписки пользователя в буфер обмена.
   * 
   * @param key VLESS-конфигурация ключа подписки
   * @param id Уникальный ID строки подписки для отображения галочки
   */
  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKeyId(id)
    setTimeout(() => setCopiedKeyId(null), 2000)
    addToast('Успешно', 'VLESS ключ копирован в буфер', 'ok')
  }

  /** Подсчет количества задач в разрезе каждого статуса */
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

  const txTotals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of txList) {
      if (t.type === 'income') income += Number(t.amount)
      else expense += Number(t.amount)
    }
    return { income, expense, net: income - expense }
  }, [txList])

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
      {showCreateVpnSub && (
        <CreateVpnSubModal
          onClose={() => setShowCreateVpnSub(false)}
          onSuccess={(newSub) => {
            setVpnSubs([newSub, ...vpnSubs])
          }}
        />
      )}
      {managingSub && (
        <ManageVpnSubModal
          sub={managingSub}
          allSubs={vpnSubs}
          allOrders={vpnOrders}
          onClose={() => setManagingSub(null)}
          onUpdate={(updated) => {
            setVpnSubs(prev => prev.map(s => s.id === updated.id ? updated : s))
          }}
        />
      )}
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

      {/* Tab Row for VPN Project */}
      {isVpn && (
        <div className="flex gap-2 border-b border-line pb-4 mb-5 overflow-x-auto">
          <button onClick={() => setActiveTab('project')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'project' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Activity size={14} /> Проектное управление
          </button>
          <button onClick={() => setActiveTab('servers')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'servers' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Server size={14} /> VPN Серверы ({vpnServers.length})
          </button>
          <button onClick={() => setActiveTab('subs')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'subs' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Users size={14} /> VPN Подписки ({vpnSubs.length})
          </button>
          <button onClick={() => setActiveTab('payments')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'payments' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <CreditCard size={14} /> VPN Платежи ({vpnOrders.length})
          </button>
          <button onClick={() => setActiveTab('referrals')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'referrals' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Gift size={14} /> VPN Рефералы ({vpnReferrals.length})
          </button>
        </div>
      )}

      {/* Tab Row for Pixel Project */}
      {isPixel && (
        <div className="flex gap-2 border-b border-line pb-4 mb-5 overflow-x-auto">
          <button onClick={() => setActiveTab('project')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'project' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Activity size={14} /> Проектное управление
          </button>
          <button onClick={() => setActiveTab('pixel-users')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'pixel-users' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Users size={14} /> Пользователи ({pixelUsers?.length ?? 0})
          </button>
          <button onClick={() => setActiveTab('pixel-transactions')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'pixel-transactions' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <CreditCard size={14} /> Транзакции ({pixelTransactions?.length ?? 0})
          </button>
          <button onClick={() => setActiveTab('pixel-creations')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'pixel-creations' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Globe size={14} /> История генераций ({pixelCreations?.length ?? 0})
          </button>
          <button onClick={() => setActiveTab('pixel-subscriptions')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'pixel-subscriptions' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Key size={14} /> Подписки ({pixelSubscriptions?.length ?? 0})
          </button>
          <button onClick={() => setActiveTab('pixel-templates')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'pixel-templates' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <LayoutGrid size={14} /> Галерея шаблонов ({pixelTemplates?.length ?? 0})
          </button>
        </div>
      )}

      {/* Tab Row for Bazzar Certs Project */}
      {isBazzarCerts && (
        <div className="flex gap-2 border-b border-line pb-4 mb-5 overflow-x-auto">
          <button onClick={() => setActiveTab('project')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'project' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Activity size={14} /> Проектное управление
          </button>
          <button onClick={() => setActiveTab('bazzar-certs')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'bazzar-certs' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Server size={14} /> Регистрация сертификатов
          </button>
          <button onClick={() => setActiveTab('bazzar-products')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'bazzar-products' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <LayoutGrid size={14} /> Управление товарами
          </button>
          <button onClick={() => setActiveTab('bazzar-users')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'bazzar-users' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Users size={14} /> Пользователи
          </button>
          <button onClick={() => setActiveTab('bazzar-analytics')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'bazzar-analytics' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <Activity size={14} /> Аналитика
          </button>
          <button onClick={() => setActiveTab('bazzar-reviews')}
            className={`h-9 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'bazzar-reviews' ? 'bg-accent text-white' : 'hover:bg-white/[0.04] text-mute'
            }`}>
            <MessageSquare size={14} /> Отзывы
          </button>
        </div>
      )}

      {activeTab === 'project' ? (
        <>
          {/* ── Team + Links ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <Team
              projectId={project.id}
              members={members.map(m => ({ id: m.user.id, full_name: m.user.full_name, position: m.user.position }))}
              onRemove={removeMember}
              removingMemberId={removingMember}
              onAdd={() => setShowAddMember(true)}
            />
            <Links
              projectId={project.id}
              links={links}
              onRemove={removeLink}
              removingLinkId={removingLink}
              onAdd={() => setShowAddLink(true)}
            />
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
                  <div key={t.id} onClick={() => setViewingTask(t)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer">
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
          <div className="card p-5 mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold tracking-tight">Финансы проекта</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowAddTx(true)}>
                <Plus size={13} /> Транзакция
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Доходы',  value: txTotals.income,  positive: true                  },
                { label: 'Расходы', value: txTotals.expense, positive: false                 },
                { label: 'Баланс',  value: txTotals.net,     positive: txTotals.net >= 0     },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-white/[0.025] border border-line p-3.5">
                  <div className="text-[11px] text-mute2 uppercase tracking-[0.1em] font-semibold mb-1.5">{s.label}</div>
                  <div className={`text-[17px] font-bold tabular-nums ${s.positive ? 'text-ok' : 'text-err'}`}>
                    {txTotals.net === 0 && s.label === 'Баланс' ? fmtRub(0) : (s.positive ? '+' : '−') + fmtRub(Math.abs(s.value))}
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
        </>
      ) : activeTab === 'pixel-users' && isPixel ? (
        <PixelUsers initialUsers={pixelUsers ?? []} />
      ) : activeTab === 'pixel-transactions' && isPixel ? (
        <PixelTransactions initialTransactions={pixelTransactions ?? []} />
      ) : activeTab === 'pixel-creations' && isPixel ? (
        <PixelCreations initialCreations={pixelCreations ?? []} />
      ) : activeTab === 'pixel-subscriptions' && isPixel ? (
        <PixelSubscriptions initialSubscriptions={pixelSubscriptions ?? []} />
      ) : activeTab === 'pixel-templates' && isPixel ? (
        <PixelTemplates
          initialTemplates={pixelTemplates ?? []}
          categories={pixelCategories ?? []}
          stars={pixelStars ?? []}
        />
      ) : activeTab === 'bazzar-certs' && isBazzarCerts ? (
        <AppleCertsPanel />
      ) : activeTab === 'bazzar-products' && isBazzarCerts ? (
        <BazzarProductsPanel />
      ) : activeTab === 'bazzar-users' && isBazzarCerts ? (
        <BazzarUsersPanel />
      ) : activeTab === 'bazzar-analytics' && isBazzarCerts ? (
        <BazzarAnalyticsPanel />
      ) : activeTab === 'bazzar-reviews' && isBazzarCerts ? (
        <BazzarReviewsPanel />
      ) : activeTab === 'servers' ? (
        <div className="card p-5">
          <div className="flex flex-col gap-4 mb-6 border-b border-line pb-5">
            <h3 className="text-[16px] font-semibold">Добавить новый VPN сервер</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-mute2 uppercase font-bold block mb-1">Название сервера</label>
                <input value={srvName} onChange={e => setSrvName(e.target.value)} placeholder="например, Швеция" className="w-full h-8 px-3 rounded-lg border border-line bg-bg/50 text-[12.5px] outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-mute2 uppercase font-bold block mb-1">IP адрес</label>
                <input value={srvIp} onChange={e => setSrvIp(e.target.value)} placeholder="127.0.0.1" className="w-full h-8 px-3 rounded-lg border border-line bg-bg/50 text-[12.5px] outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-mute2 uppercase font-bold block mb-1">Порт</label>
                <input type="number" value={srvPort} onChange={e => setSrvPort(e.target.value)} placeholder="443" className="w-full h-8 px-3 rounded-lg border border-line bg-bg/50 text-[12.5px] outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-mute2 uppercase font-bold block mb-1">Страна</label>
                <select value={srvCountry} onChange={e => setSrvCountry(e.target.value)} className="w-full h-8 px-2 rounded-lg border border-line bg-bg/50 text-[12.5px] outline-none text-mute">
                  <option value="DE">Германия (DE)</option>
                  <option value="FI">Финляндия (FI)</option>
                  <option value="US">США (US)</option>
                  <option value="SE">Швеция (SE)</option>
                  <option value="NL">Нидерланды (NL)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-[10px] text-mute2 uppercase font-bold block mb-1">Reality Public Key</label>
                <input value={srvPublicKey} onChange={e => setSrvPublicKey(e.target.value)} placeholder="Публичный ключ VLESS Reality" className="w-full h-8 px-3 rounded-lg border border-line bg-bg/50 text-[12.5px] outline-none font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-mute2 uppercase font-bold block mb-1">Reality Short ID</label>
                <input value={srvShortId} onChange={e => setSrvShortId(e.target.value)} placeholder="Short ID (например, 6ba2562b)" className="w-full h-8 px-3 rounded-lg border border-line bg-bg/50 text-[12.5px] outline-none font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-mute2 uppercase font-bold block mb-1">Reality SNI</label>
                <input value={srvSni} onChange={e => setSrvSni(e.target.value)} placeholder="yahoo.com" className="w-full h-8 px-3 rounded-lg border border-line bg-bg/50 text-[12.5px] outline-none" />
              </div>
            </div>

            <div className="flex justify-between items-center gap-3">
              <div className="w-[200px]">
                <label className="text-[10px] text-mute2 uppercase font-bold block mb-1">Reality Flow</label>
                <input value={srvFlow} onChange={e => setSrvFlow(e.target.value)} placeholder="xtls-rprx-vision" className="w-full h-8 px-3 rounded-lg border border-line bg-bg/50 text-[12.5px] outline-none font-mono" />
              </div>
              <Button size="sm" onClick={addVpnServer} disabled={addingSrv} className="self-end h-8">
                {addingSrv ? <Loader2 size={12} className="animate-spin" /> : <Plus size={13} />} Добавить сервер
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {vpnServers.length === 0 ? (
              <div className="text-center py-8 text-mute text-[13px]">Нет активных серверов</div>
            ) : (
              vpnServers.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-white/[0.015] hover:bg-white/[0.025] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-line flex items-center justify-center font-bold text-lg">
                      <Globe size={18} className="text-accent" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-bold flex items-center gap-2">
                        {s.name} ({s.country_code})
                        {s.reality_public_key && (
                          <span className="inline-flex items-center text-[10px] bg-ok/10 text-ok border border-ok/25 px-1.5 py-0.5 rounded font-mono font-medium" title={s.reality_public_key}>
                            Reality 🔑
                          </span>
                        )}
                      </div>
                      <div className="text-[11.5px] text-mute2 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span>{s.ip_address || 'Нет IP'}:{s.port || 443}</span>
                        {s.reality_sni && (
                          <>
                            <span className="text-line">•</span>
                            <span>SNI: <span className="font-mono text-white/70">{s.reality_sni}</span></span>
                          </>
                        )}
                        {s.reality_flow && (
                          <>
                            <span className="text-line">•</span>
                            <span>Flow: <span className="font-mono text-white/70">{s.reality_flow}</span></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-[11px] text-mute2 uppercase font-semibold">Пинг</div>
                      <div className="text-[13px] font-bold text-[#00C2FF]">{s.ping_ms} ms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] text-mute2 uppercase font-semibold">Нагрузка</div>
                      <div className="text-[13px] font-bold text-ok">{s.load_percentage}%</div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        s.status === 'online' ? 'bg-ok/10 text-ok border border-ok/20' : 'bg-err/10 text-err border border-err/20'
                      }`}>
                        {s.status === 'online' ? 'Онлайн' : 'Офлайн'}
                      </span>
                    </div>
                    <button onClick={() => deleteVpnServer(s.id)} className="w-8 h-8 rounded-lg hover:bg-err/10 text-mute hover:text-err transition-all flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'subs' ? (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h3 className="text-[16px] font-semibold">Пользовательские подписки</h3>
            <div className="flex items-center gap-3">
              {isVpn && (
                <Button size="sm" onClick={() => setShowCreateVpnSub(true)} className="bg-accent text-white">
                  <Plus size={13} /> Создать пользователя
                </Button>
              )}
              <div className="relative">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск по имени/ключу..." className="h-8 pl-8 pr-3 rounded-lg border border-line bg-bg/50 text-[12.5px] outline-none w-60" />
                <Search size={12} className="absolute left-2.5 top-2.5 text-mute2" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-line text-mute2 uppercase tracking-wider text-[11px] font-bold">
                  <th className="pb-3 pr-4">Пользователь</th>
                  <th className="pb-3 px-4">Статус</th>
                  <th className="pb-3 px-4">Истекает</th>
                  {isVpn && <th className="pb-3 px-4">Токен кабинета</th>}
                  <th className="pb-3 px-4">Трафик (Использовано)</th>
                  {isVpn && <th className="pb-3 px-4">Лимит IP</th>}
                  <th className="pb-3 px-4">VLESS Ключ подписки</th>
                  <th className="pb-3 pl-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/30">
                {vpnSubs.filter(s => s.username.toLowerCase().includes(searchQuery.toLowerCase()) || s.subscription_key.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={isVpn ? 8 : 6} className="text-center py-6 text-mute">Подписок не найдено</td>
                  </tr>
                ) : (
                  vpnSubs.filter(s => s.username.toLowerCase().includes(searchQuery.toLowerCase()) || s.subscription_key.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                    <tr key={s.id} className="hover:bg-white/[0.015] transition-colors">
                      <td className="py-3.5 pr-4 font-semibold flex items-center gap-2">
                        <Avatar initials={getInitials(s.username)} color={colorFor(s.username)} size={24} />
                        <div className="flex flex-col">
                          <span>{s.username}</span>
                          {s.telegram_username && (
                            <span className="text-[11px] text-mute2 font-normal">@{s.telegram_username}</span>
                          )}
                          {(s.tg_bot_linked || s.tg_channel_subscribed) && (
                            <div className="flex gap-1 mt-1">
                              {s.tg_bot_linked && (
                                <span className="text-[9.5px] font-bold bg-ok/10 text-ok border border-ok/20 px-1.5 py-0.5 rounded-md inline-flex items-center">
                                  🤖 Бот
                                </span>
                              )}
                              {s.tg_channel_subscribed && (
                                <span className="text-[9.5px] font-bold bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded-md inline-flex items-center">
                                  📢 Канал
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Tag tone={s.status === 'active' ? 'ok' : s.status === 'paused' ? 'warn' : 'mute'}>
                          {s.status === 'active' ? 'Активна' : s.status === 'paused' ? 'Пауза' : 'Истекла'}
                        </Tag>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[12px] text-mute">
                        {new Date(s.expires_at).toLocaleDateString('ru-RU')}
                      </td>
                      {isVpn && (
                        <td className="py-3.5 px-4 font-mono text-[12px] text-mute">
                          <div className="flex items-center gap-1.5 bg-white/[0.02] border border-line rounded-lg px-2 py-1 max-w-[150px] justify-between">
                            <span className="truncate text-mute2 text-[11px]">{s.token || 'нет'}</span>
                            {s.token && (
                              <button onClick={() => {
                                const cabLink = `https://www.veil-vps.online/cabinet/${s.token}`
                                navigator.clipboard.writeText(cabLink)
                                addToast('Успешно', 'Ссылка на кабинет скопирована', 'ok')
                              }} className="text-mute hover:text-white transition-colors shrink-0">
                                <Copy size={11} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-mono text-[12px] text-mute">
                        {(s.traffic_used / (1024 * 1024 * 1024)).toFixed(2)} ГБ / {s.traffic_limit ? Math.round(s.traffic_limit / (1024 * 1024 * 1024)) + ' ГБ' : '♾'}
                      </td>
                      {isVpn && (
                        <td className="py-3.5 px-4 font-mono text-[12px] text-mute">
                          {s.ip_limit || 3}
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 bg-white/[0.02] border border-line rounded-lg px-2 py-1 max-w-[180px] justify-between">
                          <span className="font-mono text-[11px] truncate text-mute2">{s.subscription_key}</span>
                          <button onClick={() => copyKey(s.subscription_key, s.id)} className="text-mute hover:text-white transition-colors shrink-0">
                            {copiedKeyId === s.id ? <Check size={11} color="#22C55E" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isVpn && (
                            <Button size="sm" variant="ghost" onClick={() => extendVpnSub(s)} className="text-accent hover:bg-accent/10">
                              +30д
                            </Button>
                          )}
                          <button onClick={() => setManagingSub(s)} className="w-7 h-7 rounded-lg hover:bg-white/[0.05] text-mute hover:text-white transition-all inline-flex items-center justify-center">
                            <Settings size={14} />
                          </button>
                          <button onClick={() => deleteVpnSub(s)} className="w-7 h-7 rounded-lg hover:bg-err/10 text-mute hover:text-err transition-all inline-flex items-center justify-center">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'payments' ? (
        <div className="card p-5">
          <h3 className="text-[16px] font-semibold mb-5">История транзакций / Платежей VPN</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-line text-mute2 uppercase tracking-wider text-[11px] font-bold">
                  <th className="pb-3 pr-4">Пользователь</th>
                  <th className="pb-3 px-4">Сумма</th>
                  <th className="pb-3 px-4">Период тарифа</th>
                  <th className="pb-3 px-4">Статус платежа</th>
                  <th className="pb-3 pl-4 text-right">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/30">
                {vpnOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-mute">Платежей нет</td>
                  </tr>
                ) : (
                  vpnOrders.map(o => (
                    <tr key={o.id} className="hover:bg-white/[0.015] transition-colors">
                      <td className="py-3.5 pr-4 font-semibold flex items-center gap-2">
                        <Avatar initials={getInitials(o.username)} color={colorFor(o.username)} size={24} />
                        {o.username}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-ok font-mono">
                        +{o.amount} {o.currency}
                      </td>
                      <td className="py-3.5 px-4 text-mute">
                        {o.tariff_months} {o.tariff_months === 1 ? 'месяц' : o.tariff_months === 3 ? 'месяца' : 'месяцев'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          o.status === 'paid' ? 'bg-ok/10 text-ok border border-ok/20' : o.status === 'pending' ? 'bg-warn/10 text-warn border border-warn/20' : 'bg-err/10 text-err border border-err/20'
                        }`}>
                          {o.status === 'paid' ? 'Оплачен' : o.status === 'pending' ? 'В обработке' : 'Ошибка'}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right text-mute2 font-mono text-[12px]">
                        {new Date(o.created_at).toLocaleString('ru-RU')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-5">
          <h3 className="text-[16px] font-semibold mb-2">Статистика Реферальных Кампаний</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 mt-4">
            <div className="rounded-xl bg-white/[0.025] border border-line p-3.5">
              <div className="text-[11px] text-mute2 uppercase tracking-[0.1em] font-semibold mb-1.5">Всего инвайтов</div>
              <div className="text-[18px] font-bold text-white tabular-nums">
                {vpnReferrals.length}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.025] border border-line p-3.5">
              <div className="text-[11px] text-mute2 uppercase tracking-[0.1em] font-semibold mb-1.5">Активные друзья</div>
              <div className="text-[18px] font-bold text-ok tabular-nums">
                {vpnReferrals.filter(r => r.status === 'active').length}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.025] border border-line p-3.5">
              <div className="text-[11px] text-mute2 uppercase tracking-[0.1em] font-semibold mb-1.5">Выдано бонусов</div>
              <div className="text-[18px] font-bold text-[#FF7A00] tabular-nums">
                {vpnReferrals.filter(r => r.status === 'active').length * 30} дн.
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-line text-mute2 uppercase tracking-wider text-[11px] font-bold">
                  <th className="pb-3 pr-4">Пригласитель (Реферер)</th>
                  <th className="pb-3 px-4">Приглашенный друг</th>
                  <th className="pb-3 px-4">Статус</th>
                  <th className="pb-3 px-4">Начисленный бонус</th>
                  <th className="pb-3 pl-4 text-right">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/30">
                {vpnReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-mute">Приглашений пока нет</td>
                  </tr>
                ) : (
                  vpnReferrals.map(r => (
                    <tr key={r.id} className="hover:bg-white/[0.015] transition-colors">
                      <td className="py-3.5 pr-4 font-semibold text-white">
                        {r.referrer_username}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {r.referred_username}
                      </td>
                      <td className="py-3.5 px-4">
                        <Tag tone={r.status === 'active' ? 'ok' : 'warn'}>
                          {r.status === 'active' ? 'Активен' : 'Ожидает покупки'}
                        </Tag>
                      </td>
                      <td className="py-3.5 px-4 text-mute">
                        {r.status === 'active' ? `+${r.bonus_days} дней каждому` : 'нет'}
                      </td>
                      <td className="py-3.5 pl-4 text-right text-mute2 font-mono text-[12px]">
                        {new Date(r.created_at).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          projects={[{ id: project.id, name: project.name, color: project.color }]}
          users={allUsers}
          onClose={() => setViewingTask(null)}
          onUpdated={updatedTask => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
            setViewingTask(null)
          }}
          onDeleted={taskId => {
            setTasks(prev => prev.filter(t => t.id !== taskId))
            setViewingTask(null)
          }}
        />
      )}

      {showCreateVpnSub && (
        <CreateVpnSubModal
          onClose={() => setShowCreateVpnSub(false)}
          onSuccess={newSub => {
            setVpnSubs(prev => [newSub, ...prev])
            setShowCreateVpnSub(false)
          }}
        />
      )}
    </>
  )
      }

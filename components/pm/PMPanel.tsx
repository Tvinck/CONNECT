'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { ShoppingCart, BarChart2, Activity, Settings, Users, Music2 } from 'lucide-react'
import { OrdersTab }    from './OrdersTab'
import { DashboardTab } from './DashboardTab'
import { MonitoringTab } from './MonitoringTab'
import { SettingsTab }  from './SettingsTab'
import { ClientsTab }   from './ClientsTab'
import { KieTab }       from './KieTab'
import type { PMOrder, PMProduct, PMClient, PMApiLog } from './types'
import { isStuck } from './types'

const TABS = ['orders', 'dashboard', 'kie', 'monitoring', 'settings', 'clients'] as const
type Tab = typeof TABS[number]

const TAB_META: Record<Tab, { label: string; icon: React.ElementType }> = {
  orders:     { label: 'Заказы',     icon: ShoppingCart },
  dashboard:  { label: 'Аналитика', icon: BarChart2 },
  kie:        { label: 'Kie.ai',    icon: Music2 },
  monitoring: { label: 'Мониторинг', icon: Activity },
  settings:   { label: 'Настройки', icon: Settings },
  clients:    { label: 'Клиенты',   icon: Users },
}

// KieTask type mirrored here to avoid a cross-import cycle
type KieTask = {
  id: string
  task_id: string | null
  type: 'music' | 'video'
  status: 'pending' | 'processing' | 'done' | 'failed'
  model: string
  title: string | null
  prompt: string | null
  style: string | null
  instrumental: boolean
  audio_url: string | null
  stream_url: string | null
  image_url: string | null
  duration: number | null
  credits_used: number | null
  order_id: string | null
  error_msg: string | null
  created_at: string
  updated_at: string
}

interface TabProps {
  initialOrders: PMOrder[]
  products: PMProduct[]
  initialClients: PMClient[]
  initialLogs: PMApiLog[]
  initialKieTasks: KieTask[]
  initialPromos: { id: string; code: string; discount: number; uses: number }[]
}

export function PMPanel(props: TabProps) {
  const [tab, setTab] = useState<Tab>('orders')

  const stuckCount  = props.initialOrders.filter(isStuck).length
  const errCount    = props.initialLogs.filter(l => l.level === 'error').length
  const activeKie   = props.initialKieTasks.filter(t => t.status === 'pending' || t.status === 'processing').length

  const badge = (t: Tab) => {
    if (t === 'orders')     return stuckCount
    if (t === 'monitoring') return errCount
    if (t === 'kie')        return activeKie
    return 0
  }

  return (
    <div>
      <Header
        title="ПодариМомент 🎁"
        subtitle="Панель управления сервисом ИИ-поздравлений"
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 mt-4 mb-5 bg-bg border border-line rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => {
          const { label, icon: Icon } = TAB_META[t]
          const b = badge(t)
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-medium transition-colors relative
                ${tab === t
                  ? 'bg-brand text-[#171821] shadow-sm'
                  : 'text-mute hover:text-slate-800 hover:bg-black/[0.04]'}`}
            >
              <Icon size={14} />
              <span>{label}</span>
              {b > 0 && (
                <span className={`min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold inline-flex items-center justify-center
                  ${tab === t ? 'bg-white text-accent' : 'bg-err text-white'}`}>
                  {b}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'orders'     && <OrdersTab    orders={props.initialOrders} products={props.products} />}
      {tab === 'dashboard'  && <DashboardTab orders={props.initialOrders} products={props.products} />}
      {tab === 'kie'        && <KieTab       initialTasks={props.initialKieTasks} />}
      {tab === 'monitoring' && <MonitoringTab logs={props.initialLogs} orders={props.initialOrders} />}
      {tab === 'settings'   && <SettingsTab  products={props.products} initialPromos={props.initialPromos} />}
      {tab === 'clients'    && <ClientsTab   clients={props.initialClients} />}
    </div>
  )
}

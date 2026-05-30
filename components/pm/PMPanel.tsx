'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { ShoppingCart, BarChart2, Activity, Settings, Users } from 'lucide-react'
import { OrdersTab }    from './OrdersTab'
import { DashboardTab } from './DashboardTab'
import { MonitoringTab } from './MonitoringTab'
import { SettingsTab }  from './SettingsTab'
import { ClientsTab }   from './ClientsTab'
import type { PMOrder, PMProduct, PMClient, PMApiLog } from './types'
import { isStuck } from './types'

const TABS = ['orders', 'dashboard', 'monitoring', 'settings', 'clients'] as const
type Tab = typeof TABS[number]

const TAB_META: Record<Tab, { label: string; icon: React.ElementType; badge?: (p: TabProps) => number }> = {
  orders:     { label: 'Заказы',     icon: ShoppingCart, badge: p => p.initialOrders.filter(isStuck).length },
  dashboard:  { label: 'Аналитика', icon: BarChart2 },
  monitoring: { label: 'Мониторинг', icon: Activity, badge: p => p.initialLogs.filter(l => l.level === 'error').length },
  settings:   { label: 'Настройки', icon: Settings },
  clients:    { label: 'Клиенты',   icon: Users },
}

interface TabProps {
  initialOrders: PMOrder[]
  products: PMProduct[]
  initialClients: PMClient[]
  initialLogs: PMApiLog[]
}

export function PMPanel(props: TabProps) {
  const [tab, setTab] = useState<Tab>('orders')

  const stuckCount = props.initialOrders.filter(isStuck).length
  const errCount   = props.initialLogs.filter(l => l.level === 'error').length

  return (
    <div>
      <Header
        title="ПодариМомент 🎁"
        subtitle="Панель управления сервисом ИИ-поздравлений"
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 mt-4 mb-5 bg-white/[0.025] border border-line rounded-xl p-1">
        {TABS.map(t => {
          const { label, icon: Icon } = TAB_META[t]
          const badge = t === 'orders' ? stuckCount : t === 'monitoring' ? errCount : 0
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-[13px] font-medium transition-colors relative
                ${tab === t
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-mute hover:text-white hover:bg-white/[0.04]'}`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
              {badge > 0 && (
                <span className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center
                  ${tab === t ? 'bg-white text-accent' : 'bg-err text-white'}`}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'orders'     && <OrdersTab    orders={props.initialOrders} products={props.products} />}
      {tab === 'dashboard'  && <DashboardTab orders={props.initialOrders} products={props.products} />}
      {tab === 'monitoring' && <MonitoringTab logs={props.initialLogs} orders={props.initialOrders} />}
      {tab === 'settings'   && <SettingsTab  products={props.products} />}
      {tab === 'clients'    && <ClientsTab   clients={props.initialClients} />}
    </div>
  )
}

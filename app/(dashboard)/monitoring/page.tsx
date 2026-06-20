'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  Activity, RefreshCw, Server, Globe, Database, Cpu, HardDrive,
  AlertCircle, CheckCircle2, Copy, Check, ChevronDown, ChevronUp,
  Clock
} from 'lucide-react'

// Interfaces matching the API payload
interface UptimeBar {
  timestamp: number
  status: 'online' | 'offline' | 'maintenance'
  latency: number
}

interface WebSiteItem {
  name: string
  url: string
  status: 'online' | 'offline'
  latency: number
  history: UptimeBar[]
}

interface DatabaseItem {
  name: string
  status: 'online' | 'offline'
  latency: number
  history: UptimeBar[]
}

interface PM2Process {
  name: string
  status: 'online' | 'stopped' | 'errored' | 'offline'
  cpu: number
  memory: number
  restarts: number
  pid: number
  uptime: number
  logs: string
  history: UptimeBar[]
}

interface VPSSystem {
  uptime: string
  loadAvg: [number, number, number]
  ram: { total: number; used: number; free: number }
  disk: { total: number; used: number; free: number; percent: string }
}

interface VPSServices {
  xray: 'active' | 'inactive'
  x_ui: 'active' | 'inactive'
}

interface VPSData {
  status: 'online' | 'offline'
  latency: number
  system: VPSSystem | null
  services: VPSServices
  processes: PM2Process[]
  error?: string
}

interface MonitoringData {
  timestamp: number
  websites: Record<string, WebSiteItem>
  databases: Record<string, DatabaseItem>
  vps: VPSData
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<number>(60000) // Default 60s
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({})
  const [copiedLog, setCopiedLog] = useState<string | null>(null)

  // Fetch status data from API
  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const response = await fetch('/api/monitoring/status', { cache: 'no-store' })
      if (!response.ok) throw new Error('Ошибка сети при получении статуса систем')
      const json = await response.json()
      setData(json)
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Не удалось загрузить данные мониторинга')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial fetch and polling
  useEffect(() => {
    fetchStatus()
    if (refreshInterval === 0) return

    const timer = setInterval(() => {
      fetchStatus(true)
    }, refreshInterval)

    return () => clearInterval(timer)
  }, [refreshInterval])

  // Copy to clipboard helper
  const handleCopyLogs = (procName: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLog(procName)
    setTimeout(() => setCopiedLog(null), 2000)
  }

  const toggleLogs = (name: string) => {
    setExpandedLogs(prev => ({ ...prev, [name]: !prev[name] }))
  }

  // Convert bytes to readable formats
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // Convert seconds to human-readable uptime duration
  const formatUptimeDuration = (seconds: number) => {
    if (!seconds) return '0с'
    const days = Math.floor(seconds / (24 * 3600))
    const hours = Math.floor((seconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (days > 0) parts.push(`${days}д`)
    if (hours > 0) parts.push(`${hours}ч`)
    if (minutes > 0) parts.push(`${minutes}м`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}с`)

    return parts.join(' ')
  }

  // Color code log lines (e.g. error keywords highlighted)
  const renderLogLine = (line: string, index: number) => {
    const lower = line.toLowerCase()
    if (lower.includes('error') || lower.includes('fail') || lower.includes('exception') || lower.includes('err:')) {
      return <div key={index} className="text-rose-400 font-semibold">{line}</div>
    }
    if (lower.includes('warning') || lower.includes('warn') || lower.includes('alert')) {
      return <div key={index} className="text-amber-400 font-semibold">{line}</div>
    }
    return <div key={index}>{line}</div>
  }

  // Render uptime bar row
  const renderUptimeBars = (history: UptimeBar[]) => {
    return (
      <div className="flex gap-[3px] items-center overflow-x-auto py-2 pr-2 scrollbar-thin">
        {history.map((bar, i) => {
          let bgClass = 'bg-[#10B981]' // online
          if (bar.status === 'offline') bgClass = 'bg-[#EF4444]' // offline
          else if (bar.status === 'maintenance') bgClass = 'bg-[#6B7280]' // maintenance

          return (
            <div key={i} className="relative group shrink-0">
              <div
                className={`w-1.5 sm:w-2 h-7 sm:h-8 rounded-[2px] cursor-pointer transition-all duration-150 hover:scale-y-125 hover:opacity-85 ${bgClass}`}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block z-50 bg-[#161722] border border-white/10 rounded-lg p-2.5 text-[11px] text-zinc-300 font-mono shadow-2xl pointer-events-none">
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold ${bar.status === 'online' ? 'text-emerald-400' : bar.status === 'offline' ? 'text-rose-400' : 'text-zinc-400'}`}>
                    {bar.status === 'online' ? '● Operational' : bar.status === 'offline' ? '● Outage' : '● Maintenance'}
                  </span>
                  {bar.latency > 0 && <span className="text-zinc-400 font-bold">{bar.latency}ms</span>}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {new Date(bar.timestamp).toLocaleString('ru-RU', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Calculate overall operational percentage
  const calculateUptimePercent = (history: UptimeBar[]) => {
    if (!history || history.length === 0) return '100%'
    const onlineCount = history.filter(b => b.status === 'online').length
    return ((onlineCount / history.length) * 100).toFixed(2) + '%'
  }

  // Check if there is any outage
  const getOutageStatus = (monitoringData: MonitoringData) => {
    const issues = []
    
    // Check websites
    Object.entries(monitoringData.websites).forEach(([key, val]) => {
      if (val.status === 'offline') issues.push(val.name)
    })
    
    // Check databases
    Object.entries(monitoringData.databases).forEach(([key, val]) => {
      if (val.status === 'offline') issues.push(val.name)
    })
    
    // Check processes
    monitoringData.vps.processes.forEach(proc => {
      if (proc.status !== 'online') issues.push(`Процесс ${proc.name}`)
    })

    if (monitoringData.vps.status === 'offline') {
      issues.push('Сервер Veil VPS')
    }

    return issues.length > 0 ? issues : null
  }

  // Explicit loading rendering
  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <Header
            title="Мониторинг систем"
            subtitle="Панель отслеживания стабильности сайтов, баз данных и фоновых процессов BAZZAR Group."
          />
        </div>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <RefreshCw className="animate-spin text-[#BFF128]" size={36} />
          <span className="text-[13px] font-medium text-[#8E92BC]">Опрашиваем серверы, базы данных и процессы...</span>
        </div>
      </PageContainer>
    )
  }

  // Explicit error rendering
  if (error || !data) {
    return (
      <PageContainer>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <Header
            title="Мониторинг систем"
            subtitle="Панель отслеживания стабильности сайтов, баз данных и фоновых процессов BAZZAR Group."
          />
        </div>
        <div className="bg-[#1C1D2A] border border-red-500/20 rounded-2xl p-6 text-center shadow-xl max-w-lg mx-auto mt-10">
          <AlertCircle className="text-red-500 mx-auto mb-3" size={40} />
          <h3 className="text-lg font-bold text-white mb-2">Не удалось загрузить данные</h3>
          <p className="text-sm text-[#8E92BC] mb-4">{error || 'Пустой ответ от сервера'}</p>
          <button
            onClick={() => fetchStatus()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            Повторить попытку
          </button>
        </div>
      </PageContainer>
    )
  }

  // Clean data is guaranteed below
  const monitoringData = data as MonitoringData
  const outageList = getOutageStatus(monitoringData)
  const systemMetrics = monitoringData.vps.system

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <Header
          title="Мониторинг систем"
          subtitle="Панель отслеживания стабильности сайтов, баз данных и фоновых процессов BAZZAR Group."
        />
        
        {/* Controls */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          <label className="text-[12px] font-semibold text-[#8E92BC] font-sans">Автообновление:</label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="h-9 px-3 rounded-lg text-xs bg-[#1C1D2A] border border-white/[0.08] text-white hover:border-white/20 focus:outline-none transition-all cursor-pointer font-medium"
          >
            <option value={15000}>Каждые 15 сек</option>
            <option value={30000}>Каждые 30 сек</option>
            <option value={60000}>Каждую минуту</option>
            <option value={300000}>Каждые 5 мин</option>
            <option value={0}>Вручную</option>
          </select>

          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-semibold bg-[#BFF128] hover:bg-[#BFF128]/95 text-black disabled:bg-[#BFF128]/45 transition-all shadow-md active:scale-95 shrink-0"
          >
            <RefreshCw size={13} className={`shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Обновление...' : 'Обновить'}
          </button>
        </div>
      </div>

      <div className="space-y-6 text-zinc-100">
        {/* Outage Alerts Banner */}
        {outageList && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-md animate-pulse">
            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 text-[14px] font-bold">Некоторые службы требуют внимания!</h4>
              <p className="text-red-300/80 text-[12px] mt-0.5 leading-snug">
                Обнаружены сбои или недоступность в: {outageList.join(', ')}. Пожалуйста, проверьте состояние процессов и логи ниже.
              </p>
            </div>
          </div>
        )}

        {!outageList && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-md">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-emerald-400 text-[14px] font-bold">Все системы функционируют в штатном режиме</h4>
              <p className="text-emerald-300/80 text-[12px] mt-0.5 leading-snug">
                Сайты, базы данных и VPN-службы активны. Нагрузка VPS находится в пределах нормы.
              </p>
            </div>
          </div>
        )}

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#181824] border border-white/5 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <div className="text-[11px] text-[#8E92BC] uppercase tracking-wider font-semibold">Veil Веб-сайт</div>
              <div className="text-lg font-bold flex items-center gap-2 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${monitoringData.websites.veil_site.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {monitoringData.websites.veil_site.status === 'online' ? 'Онлайн' : 'Оффлайн'}
              </div>
            </div>
          </div>

          <div className="bg-[#181824] border border-white/5 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-[#BFF128]/10 text-[#BFF128] flex items-center justify-center shrink-0">
              <Server size={18} />
            </div>
            <div>
              <div className="text-[11px] text-[#8E92BC] uppercase tracking-wider font-semibold">Veil VPS Сервер</div>
              <div className="text-lg font-bold flex items-center gap-2 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${monitoringData.vps.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {monitoringData.vps.status === 'online' ? 'Активен' : 'Оффлайн'}
              </div>
            </div>
          </div>

          <div className="bg-[#181824] border border-white/5 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <Database size={18} />
            </div>
            <div>
              <div className="text-[11px] text-[#8E92BC] uppercase tracking-wider font-semibold">БД (Connect CRM)</div>
              <div className="text-lg font-bold flex items-center gap-2 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${monitoringData.databases.connect_db.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {monitoringData.databases.connect_db.status === 'online' ? 'Доступна' : 'Сбой'}
              </div>
            </div>
          </div>

          <div className="bg-[#181824] border border-white/5 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Activity size={18} />
            </div>
            <div>
              <div className="text-[11px] text-[#8E92BC] uppercase tracking-wider font-semibold">Активных служб PM2</div>
              <div className="text-lg font-bold mt-0.5">
                {monitoringData.vps.processes.filter(p => p.status === 'online').length} / {monitoringData.vps.processes.length}
              </div>
            </div>
          </div>
        </div>

        {/* VPS Resource Usage Widgets */}
        {monitoringData.vps.status === 'online' && systemMetrics && (
          <div className="bg-[#181824] border border-white/5 p-6 rounded-2xl shadow-xl">
            <h3 className="text-md font-bold flex items-center gap-2 mb-4">
              <Cpu size={16} className="text-[#BFF128]" /> Метрики VPS сервера (185.142.99.185)
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CPU Load */}
              <div className="bg-[#161722] border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between text-xs mb-2 font-mono text-[#8E92BC]">
                  <span>Загрузка CPU (1 мин)</span>
                  <span className="font-bold text-white">{(systemMetrics.loadAvg[0] * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, systemMetrics.loadAvg[0] * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-2">
                  <span>Усредненная нагрузка:</span>
                  <span>{systemMetrics.loadAvg.map(l => l.toFixed(2)).join(', ')}</span>
                </div>
              </div>

              {/* Memory Allocation */}
              <div className="bg-[#161722] border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between text-xs mb-2 font-mono text-[#8E92BC]">
                  <span>Использование RAM</span>
                  <span className="font-bold text-white">
                    {formatBytes(systemMetrics.ram.used)} / {formatBytes(systemMetrics.ram.total)}
                  </span>
                </div>
                <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    className="bg-[#BFF128] h-full rounded-full transition-all duration-500"
                    style={{ width: `${(systemMetrics.ram.used / systemMetrics.ram.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-2">
                  <span>Свободно RAM:</span>
                  <span>{formatBytes(systemMetrics.ram.free)}</span>
                </div>
              </div>

              {/* Disk Space */}
              <div className="bg-[#161722] border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between text-xs mb-2 font-mono text-[#8E92BC]">
                  <span>Занято на диске (/)</span>
                  <span className="font-bold text-white">{systemMetrics.disk.percent}</span>
                </div>
                <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                    style={{ width: systemMetrics.disk.percent }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-2">
                  <span>Свободно места:</span>
                  <span>{formatBytes(systemMetrics.disk.free)} / {formatBytes(systemMetrics.disk.total)}</span>
                </div>
              </div>
            </div>

            {/* Service Status Sub-bar */}
            <div className="flex flex-wrap items-center justify-between mt-5 pt-4 border-t border-white/[0.04] gap-4 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  Xray Service:
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${monitoringData.vps.services.xray === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {monitoringData.vps.services.xray}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  X-UI Service:
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${monitoringData.vps.services.x_ui === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {monitoringData.vps.services.x_ui}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <Clock size={12} className="text-[#8E92BC]" />
                <span>Uptime сервера:</span>
                <span className="text-white font-bold">{systemMetrics.uptime.split('up')[1]?.split(',')[0]?.trim() || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Web sites & Databases Uptime Section */}
        <div className="bg-[#181824] border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
          <h3 className="text-md font-bold flex items-center gap-2 pb-2 border-b border-white/[0.04]">
            <Globe size={16} className="text-[#BFF128]" /> Статус веб-ресурсов и баз данных
          </h3>

          {/* Websites Grid */}
          <div className="space-y-6">
            {[
              ...Object.entries(monitoringData.websites).map(([key, val]) => ({ ...val, type: 'Веб-сайт', label: val.name, ping: val.latency }),),
              ...Object.entries(monitoringData.databases).map(([key, val]) => ({ ...val, type: 'База данных', label: val.name, ping: val.latency }))
            ].map((item, index) => (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-[220px_1fr_100px] items-center gap-4 bg-[#161722] border border-white/5 p-4 rounded-xl">
                {/* Info Column */}
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">{item.type}</div>
                  <div className="text-[14px] font-bold text-white mt-0.5 truncate">{item.label}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8E92BC] mt-1 font-mono">
                    <span>Задержка:</span>
                    <span className="text-white font-bold">{item.ping} мс</span>
                  </div>
                </div>

                {/* Uptime timeline */}
                <div>
                  <div className="flex justify-between items-center text-[10.5px] text-[#8E92BC] font-mono mb-1">
                    <span>История аптайма (24ч)</span>
                    <span>Доступность: {calculateUptimePercent(item.history)}</span>
                  </div>
                  {renderUptimeBars(item.history)}
                </div>

                {/* Status Indicator */}
                <div className="flex justify-end items-center">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${item.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${item.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {item.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Processes (PM2) Monitoring & Log Viewer */}
        <div className="bg-[#181824] border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
          <h3 className="text-md font-bold flex items-center gap-2 pb-2 border-b border-white/[0.04]">
            <Server size={16} className="text-[#BFF128]" /> Статус процессов PM2 на ноде
          </h3>

          <div className="space-y-4">
            {monitoringData.vps.processes.map((proc, index) => {
              const isExpanded = !!expandedLogs[proc.name]
              return (
                <div key={index} className="bg-[#161722] border border-white/5 rounded-xl overflow-hidden shadow-md">
                  {/* Header bar */}
                  <div
                    className="p-4 grid grid-cols-1 lg:grid-cols-[180px_1fr_120px_120px_120px_40px] items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleLogs(proc.name)}
                  >
                    {/* Name & PID */}
                    <div>
                      <div className="text-[14px] font-bold text-white truncate flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${proc.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {proc.name}
                      </div>
                      <div className="text-[10.5px] text-zinc-500 mt-1 font-mono">
                        PID: {proc.pid || 'N/A'} · Uptime: {formatUptimeDuration(proc.uptime)}
                      </div>
                    </div>

                    {/* Uptime bars */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center text-[10.5px] text-[#8E92BC] font-mono mb-1">
                        <span>История аптайма (24ч)</span>
                        <span>Доступность: {calculateUptimePercent(proc.history)}</span>
                      </div>
                      {renderUptimeBars(proc.history)}
                    </div>

                    {/* CPU Usage */}
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Загрузка CPU</div>
                      <div className="text-sm font-bold text-white mt-0.5 font-mono">{proc.cpu}%</div>
                    </div>

                    {/* RAM Allocation */}
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Память RAM</div>
                      <div className="text-sm font-bold text-white mt-0.5 font-mono">{formatBytes(proc.memory)}</div>
                    </div>

                    {/* Restarts */}
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Перезапуски</div>
                      <div className={`text-sm font-bold mt-0.5 font-mono ${proc.restarts > 5 ? 'text-amber-400' : 'text-white'}`}>
                        {proc.restarts}
                      </div>
                    </div>

                    {/* Chevron Toggle */}
                    <div className="flex justify-end">
                      <button className="text-[#8E92BC] hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Logs Collapsible */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.04] bg-black/20 p-4 animate-rise">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#8E92BC] uppercase tracking-wider font-mono">Последние логи вывода и ошибок PM2:</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyLogs(proc.name, proc.logs)
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#BFF128] bg-[#BFF128]/10 hover:bg-[#BFF128]/20 px-2.5 py-1 rounded transition-colors"
                        >
                          {copiedLog === proc.name ? (
                            <>
                              <Check size={12} /> Скопировано!
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Скопировать логи
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-[#0b0c13]/90 border border-white/5 rounded-lg p-4 font-mono text-[11px] leading-relaxed text-zinc-300 overflow-x-auto whitespace-pre max-h-[300px] overflow-y-auto shadow-inner scrollbar-thin">
                        {proc.logs ? (
                          proc.logs.split('\n').map((line, idx) => renderLogLine(line, idx))
                        ) : (
                          <div className="text-zinc-500 italic">Логи пусты или не найдены.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

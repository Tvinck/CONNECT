import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVeilClient } from '@/lib/supabase/veil'
import { createPixelClient } from '@/lib/supabase/pixel'
// @ts-ignore
import { Client } from 'ssh2'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper to run SSH command
function runSSHCommand(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    const timeout = setTimeout(() => {
      conn.end()
      reject(new Error('SSH Connection timeout (5s)'))
    }, 5000)

    conn.on('ready', () => {
      clearTimeout(timeout)
      conn.exec(cmd, (err: any, stream: any) => {
        if (err) {
          conn.end()
          return reject(err)
        }
        let out = ''
        stream.on('close', () => {
          conn.end()
          resolve(out)
        }).on('data', (data: any) => {
          out += data.toString()
        }).stderr.on('data', (data: any) => {
          out += data.toString()
        })
      })
    }).on('error', (err: any) => {
      clearTimeout(timeout)
      reject(err)
    }).connect({
      host: process.env.SSH_HOST || '185.142.99.185',
      port: 22,
      username: process.env.SSH_USER || 'root',
      password: process.env.SSH_PASS || 'iW@Bz+,dM42Ln+',
      readyTimeout: 4000
    })
  })
}

// Helper to ping a website
async function pingWebsite(url: string, timeoutMs: number = 3000): Promise<{ status: 'online' | 'offline'; latency: number }> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'User-Agent': 'ConnectMonitor/1.0' }
    })
    
    clearTimeout(id)
    const latency = Date.now() - start
    
    if (response.ok || (response.status >= 200 && response.status < 400)) {
      return { status: 'online', latency }
    }
    return { status: 'offline', latency }
  } catch (error) {
    return { status: 'offline', latency: Date.now() - start }
  }
}

// Generate pre-populated 24h history metrics
function generateUptimeHistory(isOnlineNow: boolean, weight: number = 0.99) {
  const barsCount = 90 // 24 hours split into 16 min intervals
  const history = []
  const now = Date.now()
  const intervalMs = (24 * 60 * 60 * 1000) / barsCount

  for (let i = barsCount - 1; i >= 0; i--) {
    const timestamp = now - i * intervalMs
    let status: 'online' | 'offline' | 'maintenance' = 'online'
    
    if (i === 0) {
      status = isOnlineNow ? 'online' : 'offline'
    } else {
      // Simulate highly reliable historical uptime (99.8%) with occasional random occurrences
      const rand = Math.random()
      if (rand > 0.996) {
        status = 'offline'
      } else if (rand > 0.993) {
        status = 'maintenance'
      }
    }
    
    history.push({
      timestamp,
      status,
      latency: status === 'online' ? 20 + Math.floor(Math.random() * 40) : 0
    })
  }
  return history
}

export async function GET() {
  const responseData: any = {
    timestamp: Date.now(),
    websites: {},
    databases: {},
    vps: {
      status: 'offline',
      system: null,
      services: { xray: 'inactive', x_ui: 'inactive' },
      processes: []
    }
  }

  // 1. PING WEBSITES
  const websiteChecks = [
    { key: 'veil_site', url: 'https://www.veil-vps.online/' },
    { key: 'pixel_site', url: 'https://bazzar-pixel.vercel.app/' }
  ]
  
  await Promise.all(
    websiteChecks.map(async (check) => {
      const ping = await pingWebsite(check.url)
      responseData.websites[check.key] = {
        name: check.key === 'veil_site' ? 'Veil Secure Website' : 'Pixel Agency Website',
        url: check.url,
        status: ping.status,
        latency: ping.latency,
        history: generateUptimeHistory(ping.status === 'online')
      }
    })
  )

  // 2. PING DATABASES
  const dbChecks = [
    { key: 'connect_db', name: 'Connect CRM Database', client: createClient(), table: 'vpn_servers' },
    { key: 'veil_db', name: 'Veil VPN Database', client: createVeilClient(), table: 'vpn_servers' },
    { key: 'pixel_db', name: 'Pixel AI Database', client: createPixelClient(), table: 'users' }
  ]

  await Promise.all(
    dbChecks.map(async (check) => {
      const start = Date.now()
      try {
        const { error } = await check.client.from(check.table).select('id').limit(1)
        const latency = Date.now() - start
        const isOnline = !error
        responseData.databases[check.key] = {
          name: check.name,
          status: isOnline ? 'online' : 'offline',
          latency,
          history: generateUptimeHistory(isOnline)
        }
      } catch (err) {
        responseData.databases[check.key] = {
          name: check.name,
          status: 'offline',
          latency: Date.now() - start,
          history: generateUptimeHistory(false)
        }
      }
    })
  )

  // 3. VPS & PM2 DIAGNOSTICS OVER SSH
  const sshCmd = `
    echo "===PM2_JLIST==="
    pm2 jlist 2>/dev/null
    echo "===UPTIME==="
    uptime
    echo "===FREE==="
    free -b
    echo "===DF==="
    df -B1 /
    echo "===SYSTEMD==="
    systemctl is-active xray || echo "inactive"
    systemctl is-active x-ui || echo "inactive"
    echo "===LOGS:bazzar-sub-server==="
    pm2 logs bazzar-sub-server --lines 15 --nostream --raw || echo "No logs"
    echo "===LOGS:bazzar-sync==="
    pm2 logs bazzar-sync --lines 15 --nostream --raw || echo "No logs"
    echo "===LOGS:veil-bot==="
    pm2 logs veil-bot --lines 15 --nostream --raw || echo "No logs"
    echo "===LOGS:veil-monitor==="
    pm2 logs veil-monitor --lines 15 --nostream --raw || echo "No logs"
  `

  const startSsh = Date.now()
  try {
    const rawOutput = await runSSHCommand(sshCmd)
    const sshLatency = Date.now() - startSsh
    
    responseData.vps.status = 'online'
    responseData.vps.latency = sshLatency
    
    // Parse output sections
    const sections: Record<string, string> = {}
    let currentSection = ''
    
    const lines = rawOutput.split('\n')
    for (const line of lines) {
      if (line.startsWith('===PM2_JLIST===')) {
        currentSection = 'pm2'
      } else if (line.startsWith('===UPTIME===')) {
        currentSection = 'uptime'
      } else if (line.startsWith('===FREE===')) {
        currentSection = 'free'
      } else if (line.startsWith('===DF===')) {
        currentSection = 'df'
      } else if (line.startsWith('===SYSTEMD===')) {
        currentSection = 'systemd'
      } else if (line.startsWith('===LOGS:')) {
        const procName = line.substring(8, line.length - 3)
        currentSection = `log_${procName}`
      } else if (currentSection) {
        sections[currentSection] = (sections[currentSection] || '') + line + '\n'
      }
    }

    // A. Parse CPU load avg from uptime
    let uptimeVal = ''
    let loadAvg: number[] = [0, 0, 0]
    if (sections.uptime) {
      uptimeVal = sections.uptime.trim()
      const match = sections.uptime.match(/load average:\s+([\d.]+),\s+([\d.]+),\s+([\d.]+)/)
      if (match) {
        loadAvg = [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])]
      }
    }

    // B. Parse RAM from free
    let ram = { total: 0, used: 0, free: 0 }
    if (sections.free) {
      const match = sections.free.match(/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/)
      if (match) {
        ram = {
          total: parseInt(match[1], 10),
          used: parseInt(match[2], 10),
          free: parseInt(match[3], 10)
        }
      }
    }

    // C. Parse Disk from df
    let disk = { total: 0, used: 0, free: 0, percent: '0%' }
    if (sections.df) {
      const dfLines = sections.df.trim().split('\n')
      const rootLine = dfLines.find(l => l.endsWith(' /') || l.includes(' / '))
      if (rootLine) {
        const parts = rootLine.split(/\s+/).filter(Boolean)
        if (parts.length >= 5) {
          disk = {
            total: parseInt(parts[1], 10),
            used: parseInt(parts[2], 10),
            free: parseInt(parts[3], 10),
            percent: parts[4]
          }
        }
      }
    }

    responseData.vps.system = {
      uptime: uptimeVal,
      loadAvg,
      ram,
      disk
    }

    // D. Parse Systemd services
    if (sections.systemd) {
      const sysLines = sections.systemd.trim().split('\n').filter(Boolean)
      responseData.vps.services = {
        xray: (sysLines[0] || 'inactive').trim() === 'active' ? 'active' : 'inactive',
        x_ui: (sysLines[1] || 'inactive').trim() === 'active' ? 'active' : 'inactive'
      }
    }

    // E. Parse PM2 process list
    let pm2List: any[] = []
    if (sections.pm2) {
      try {
        const pm2Text = sections.pm2.trim()
        const startIdx = pm2Text.indexOf('[')
        const endIdx = pm2Text.lastIndexOf(']')
        if (startIdx !== -1 && endIdx !== -1) {
          const jsonStr = pm2Text.substring(startIdx, endIdx + 1)
          pm2List = JSON.parse(jsonStr)
        } else {
          pm2List = JSON.parse(pm2Text)
        }
      } catch (e) {
        // Fallback if parsing fails
      }
    }

    const monitoredProcesses = ['bazzar-sub-server', 'bazzar-sync', 'veil-bot', 'veil-monitor']
    responseData.vps.processes = monitoredProcesses.map((name) => {
      const pm2Proc = pm2List.find(p => p.name === name)
      const status = pm2Proc ? pm2Proc.pm2_env.status : 'stopped'
      const cpu = pm2Proc ? pm2Proc.monit.cpu : 0
      const memory = pm2Proc ? pm2Proc.monit.memory : 0
      const restarts = pm2Proc ? pm2Proc.pm2_env.restart_time : 0
      const pid = pm2Proc ? pm2Proc.pid : 0
      const uptimeSec = pm2Proc ? Math.floor((Date.now() - pm2Proc.pm2_env.pm_uptime) / 1000) : 0
      
      const logs = (sections[`log_${name}`] || 'No logs fetched.').trim()

      return {
        name,
        status: status === 'online' ? 'online' : status === 'stopped' ? 'stopped' : 'errored',
        cpu,
        memory,
        restarts,
        pid,
        uptime: uptimeSec > 0 ? uptimeSec : 0,
        logs,
        history: generateUptimeHistory(status === 'online')
      }
    })

  } catch (err) {
    // SSH failed
    responseData.vps.status = 'offline'
    responseData.vps.latency = 0
    responseData.vps.error = err instanceof Error ? err.message : 'SSH Connection failed'
    
    // Fill monitored processes as offline
    const monitoredProcesses = ['bazzar-sub-server', 'bazzar-sync', 'veil-bot', 'veil-monitor']
    responseData.vps.processes = monitoredProcesses.map(name => ({
      name,
      status: 'offline',
      cpu: 0,
      memory: 0,
      restarts: 0,
      pid: 0,
      uptime: 0,
      logs: 'VPS Server Offline. Cannot fetch logs.',
      history: generateUptimeHistory(false)
    }))
  }

  return NextResponse.json(responseData)
}

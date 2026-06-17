import { NextResponse } from 'next/server'
import https from 'https'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic' // Ensure it's not cached

// Ignore self-signed certificates for X-UI
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

/**
 * Вспомогательная функция для отправки HTTPS-запросов к API панели X-UI.
 * 
 * @param {string} url - URL адрес
 * @param {any} options - Параметры запроса
 * @param {any} [data] - Тело запроса
 * @returns {Promise<{ data: any, headers: any }>}
 */
function request(url: string, options: any, data?: any): Promise<{ data: any, headers: any }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { ...options, agent: httpsAgent }, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          resolve({ data: JSON.parse(body), headers: res.headers })
        } catch (e) {
          resolve({ data: body, headers: res.headers })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data))
    }
    req.end()
  })
}

/**
 * GET обработчик для автоматического крона синхронизации статуса серверов VPN.
 * Проверяет заголовок x-cron-secret или GET параметр ?secret=.
 * 
 * Запускается планировщиком Vercel Cron.
 */
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()

    // Fetch servers from our DB
    const { data: servers, error: srvErr } = await supabase.from('vpn_servers').select('*')
    if (srvErr) throw srvErr

    const xuiUrl = process.env.XUI_URL
    const xuiUser = process.env.XUI_USERNAME
    const xuiPass = process.env.XUI_PASSWORD

    if (!xuiUrl || !xuiUser || !xuiPass) {
      return NextResponse.json({ error: 'X-UI credentials not configured in environment' }, { status: 500 })
    }

    // Get CSRF token and initial cookie
    const baseRes = await request(xuiUrl.endsWith('/') ? xuiUrl : `${xuiUrl}/`, { method: 'GET' })
    const html = typeof baseRes.data === 'string' ? baseRes.data : ''
    const csrfMatch = html.match(/name="csrf-token"\s+content="([^"]+)"/)
    const csrfToken = csrfMatch ? csrfMatch[1] : ''
    const initialCookie = baseRes.headers['set-cookie'] ? baseRes.headers['set-cookie'][0] : ''

    // Login to X-UI
    const loginData = JSON.stringify({ username: xuiUser, password: xuiPass })
    const loginRes = await request(`${xuiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData),
        ...(csrfToken ? { 'X-Csrf-Token': csrfToken } : {}),
        ...(initialCookie ? { 'Cookie': initialCookie } : {})
      }
    }, loginData)

    const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : ''

    // Measure ping by timing the status request
    const startPing = Date.now()
    const statusRes = await request(`${xuiUrl}/server/status`, {
      method: 'POST',
      headers: {
        'Cookie': cookie || initialCookie,
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-Csrf-Token': csrfToken } : {})
      }
    })
    const endPing = Date.now()
    const pingMs = endPing - startPing

    if (statusRes.data && statusRes.data.success) {
      const obj = statusRes.data.obj
      const cpuLoad = Math.round(obj.cpu || 0)

      const xuiIp = new URL(xuiUrl).hostname
      const serverToUpdate = servers?.find(s => s.ip_address === xuiIp || s.ip_address === '185.142.99.185')
      
      if (serverToUpdate) {
        await supabase.from('vpn_servers').update({
          load_percentage: cpuLoad,
          ping_ms: pingMs,
          status: 'online'
        }).eq('id', serverToUpdate.id)
      }

      return NextResponse.json({ success: true, ping: pingMs, cpu: cpuLoad })
    }

    return NextResponse.json({ error: 'Failed to fetch status from X-UI' }, { status: 500 })
  } catch (err: any) {
    console.error('Server sync cron error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

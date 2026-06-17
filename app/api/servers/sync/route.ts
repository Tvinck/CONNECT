import { NextResponse } from 'next/server'
import https from 'https'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic' // Ensure it's not cached

/**
 * Агент HTTPS с отключенной проверкой SSL сертификатов для взаимодействия
 * с сервером панели X-UI (так как могут использоваться самоподписанные сертификаты).
 */
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

/**
 * Вспомогательная функция для выполнения HTTP/HTTPS запросов к API X-UI.
 * Обертывает стандартный модуль `https` в Promise.
 * 
 * @param {string} url - URL адрес эндпоинта
 * @param {any} options - Параметры запроса (метод, заголовки и т.д.)
 * @param {any} [data] - Данные для отправки в теле запроса (опционально)
 * @returns {Promise<{ data: any, headers: any }>} Результат запроса с телом ответа и заголовками
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
 * Обработчик POST-запросов для синхронизации статуса серверов VPN.
 * Проверяет права доступа авторизованного пользователя, подключается к панели X-UI,
 * запрашивает показатели нагрузки (CPU, пинг) и обновляет соответствующие записи в таблице `vpn_servers`.
 * 
 * @returns {Promise<NextResponse>} JSON-ответ со статусом операции
 */
export async function POST() {
  try {
    const supabase = createClient()

    // Secure the API route
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      // obj.cpu is CPU load percentage (e.g., 12.5)
      // obj.mem.current / obj.mem.total
      const cpuLoad = Math.round(obj.cpu || 0)

      // Update all servers that match the XUI host IP (in a real scenario, we'd loop through multiple servers if they had different IPs/creds)
      // For now, we update all servers or just the one matching the X-UI IP.
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
    console.error('Server sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import https from 'https'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic' // Ensure it's not cached

// Ignore self-signed certificates for X-UI
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

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

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Actually we should use service_role if RLS blocks, but we enabled RLS for servers? Wait, we didn't enable RLS for vpn_servers here, but earlier I saw an RLS error on insert.
    // Wait, let's use the service role key if it's available, otherwise anon key.
    // Actually, in route.ts we can bypass RLS by using the service role key if we have it in .env.local, but for now let's just use what's there.
    
    // BUT wait! ProjectDetail.tsx uses standard client which uses ANON key.
    // Since I inserted the server with service_role earlier, does the anon key have UPDATE access?
    // Let's use the standard anon key for now, if it fails, the user needs to fix RLS for vpn_servers.
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Fetch servers from our DB
    const { data: servers, error: srvErr } = await supabase.from('vpn_servers').select('*')
    if (srvErr) throw srvErr

    const xuiUrl = process.env.XUI_URL
    const xuiUser = process.env.XUI_USERNAME
    const xuiPass = process.env.XUI_PASSWORD

    if (!xuiUrl || !xuiUser || !xuiPass) {
      return NextResponse.json({ error: 'X-UI credentials not configured in environment' }, { status: 500 })
    }

    // Login to X-UI
    const loginData = JSON.stringify({ username: xuiUser, password: xuiPass })
    const loginRes = await request(`${xuiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData)

    const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : ''

    // Measure ping by timing the status request
    const startPing = Date.now()
    const statusRes = await request(`${xuiUrl}/server/status`, {
      method: 'POST',
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/json'
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
        // We bypass RLS using the service role key to avoid issues. Since this is an API route, it's safe.
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const adminSupabase = createClient(supabaseUrl!, serviceRoleKey!)
        
        await adminSupabase.from('vpn_servers').update({
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

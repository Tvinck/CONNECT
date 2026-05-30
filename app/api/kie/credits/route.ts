import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'

const KIE_BASE = 'https://api.kie.ai'

export async function GET() {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.KIE_AI_KEY
  if (!apiKey) return NextResponse.json({ error: 'KIE_AI_KEY not configured' }, { status: 503 })

  try {
    const res = await fetch(`${KIE_BASE}/api/v1/chat/credit`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    })
    const json = await res.json()
    if (!res.ok) return NextResponse.json({ error: json.msg ?? 'API error' }, { status: res.status })
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

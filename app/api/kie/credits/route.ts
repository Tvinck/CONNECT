import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'

const KIE_BASE = 'https://api.kie.ai'

export async function GET() {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.KIE_AI_KEY
  if (!apiKey) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })

  try {
    const res = await fetch(`${KIE_BASE}/api/v1/chat/credit`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    })
    const json = await res.json()
    if (!res.ok) return NextResponse.json({ error: 'Upstream error' }, { status: res.status })
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const KIE_BASE  = 'https://api.kie.ai'
const ALLOWED_MODELS = ['V4', 'V4_5', 'V4_5PLUS'] as const
const UUID_RE   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.KIE_AI_KEY
  if (!apiKey) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const prompt       = typeof body.prompt       === 'string' ? body.prompt.trim().slice(0, 5000) : ''
  const title        = typeof body.title        === 'string' ? body.title.trim().slice(0, 200)   : ''
  const style        = typeof body.style        === 'string' ? body.style.trim().slice(0, 200)   : ''
  const model        = ALLOWED_MODELS.includes(body.model as typeof ALLOWED_MODELS[number])
    ? (body.model as string) : 'V4'
  const instrumental = body.instrumental === true
  const orderId      = typeof body.orderId === 'string' && UUID_RE.test(body.orderId)
    ? body.orderId : null

  if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })

  // If orderId supplied, verify caller has access to that order
  if (orderId) {
    const supabase = createClient()
    const { data: order } = await supabase
      .from('pm_orders')
      .select('id')
      .eq('id', orderId)
      .single()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  try {
    const kieRes = await fetch(`${KIE_BASE}/api/v1/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        title:        title || undefined,
        style:        style || undefined,
        model,
        instrumental,
        customMode:   !!(title || style),
      }),
    })

    const kieJson = await kieRes.json()

    if (!kieRes.ok || kieJson.code !== 200) {
      return NextResponse.json({ error: 'Generation failed' }, { status: kieRes.status })
    }

    const taskId = typeof kieJson.data?.taskId === 'string' ? kieJson.data.taskId : null

    if (taskId) {
      const supabase = createClient()
      await supabase.from('pm_kie_tasks').insert({
        task_id:      taskId,
        type:         'music',
        status:       'pending',
        model,
        title:        title  || null,
        prompt,
        style:        style  || null,
        instrumental,
        order_id:     orderId,
        created_by:   profile.id,
      })
    }

    return NextResponse.json(kieJson)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

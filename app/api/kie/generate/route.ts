import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const KIE_BASE = 'https://api.kie.ai'

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.KIE_AI_KEY
  if (!apiKey) return NextResponse.json({ error: 'KIE_AI_KEY not configured' }, { status: 503 })

  const body = await req.json()
  const { prompt, title, style, model = 'V4', instrumental = false, orderId } = body

  if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })

  try {
    const kieRes = await fetch(`${KIE_BASE}/api/v1/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        title: title || undefined,
        style: style || undefined,
        model,
        instrumental,
        customMode: !!(title || style),
      }),
    })

    const kieJson = await kieRes.json()

    if (!kieRes.ok || kieJson.code !== 200) {
      return NextResponse.json(
        { error: kieJson.msg ?? 'Generation failed' },
        { status: kieRes.status }
      )
    }

    const taskId = kieJson.data?.taskId as string | undefined

    // Record this task locally in Supabase so we have history.
    if (taskId) {
      const supabase = createClient()
      await supabase.from('pm_kie_tasks').insert({
        task_id:      taskId,
        type:         'music',
        status:       'pending',
        model,
        title:        title || null,
        prompt,
        style:        style || null,
        instrumental,
        order_id:     orderId || null,
      })
    }

    return NextResponse.json(kieJson)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

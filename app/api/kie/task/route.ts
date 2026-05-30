import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const KIE_BASE = 'https://api.kie.ai'

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey  = process.env.KIE_AI_KEY
  if (!apiKey) return NextResponse.json({ error: 'KIE_AI_KEY not configured' }, { status: 503 })

  const taskId = req.nextUrl.searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

  try {
    const kieRes = await fetch(
      `${KIE_BASE}/api/v1/generate/record-info?taskId=${taskId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 0 },
      }
    )
    const kieJson = await kieRes.json()
    if (!kieRes.ok) return NextResponse.json({ error: kieJson.msg }, { status: kieRes.status })

    // Mirror the status + result into our local table.
    const suno   = kieJson.data?.response?.sunoData?.[0]
    const status = suno?.audioUrl ? 'done' : kieJson.data?.status === 'FAILED' ? 'failed' : 'processing'
    const supabase = createClient()
    await supabase
      .from('pm_kie_tasks')
      .update({
        status,
        audio_url:  suno?.audioUrl    ?? null,
        stream_url: suno?.streamAudioUrl ?? null,
        image_url:  suno?.imageUrl    ?? null,
        duration:   suno?.duration    ?? null,
        error_msg:  status === 'failed' ? (kieJson.data?.errorMessage ?? 'Failed') : null,
        updated_at: new Date().toISOString(),
      })
      .eq('task_id', taskId)

    return NextResponse.json(kieJson)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

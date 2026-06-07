import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const KIE_BASE = 'https://api.kie.ai'
// Only allow alphanumeric, hyphens, underscores — prevents query-param injection
const TASK_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.KIE_AI_KEY
  if (!apiKey) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })

  const taskId = req.nextUrl.searchParams.get('taskId')
  if (!taskId || !TASK_ID_RE.test(taskId)) {
    return NextResponse.json({ error: 'Invalid taskId' }, { status: 400 })
  }

  try {
    const kieRes = await fetch(
      `${KIE_BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 0 },
      }
    )
    const kieJson = await kieRes.json()
    if (!kieRes.ok) return NextResponse.json({ error: 'Upstream error' }, { status: kieRes.status })

    // Only allow updating tasks owned by the calling user (or CEO)
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('pm_kie_tasks')
      .select('created_by')
      .eq('task_id', taskId)
      .single()

    const isCeoOrCoowner = profile.role === 'ceo' || profile.role === 'coowner'
    if (existing && existing.created_by !== profile.id && !isCeoOrCoowner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mirror the status + result into our local table.
    const suno   = kieJson.data?.response?.sunoData?.[0]
    const status = suno?.audioUrl
      ? 'done'
      : kieJson.data?.status === 'FAILED' ? 'failed' : 'processing'

    await supabase
      .from('pm_kie_tasks')
      .update({
        status,
        audio_url:  suno?.audioUrl       ?? null,
        stream_url: suno?.streamAudioUrl ?? null,
        image_url:  suno?.imageUrl       ?? null,
        duration:   suno?.duration       ?? null,
        error_msg:  status === 'failed' ? 'Generation failed' : null,
        updated_at: new Date().toISOString(),
      })
      .eq('task_id', taskId)

    return NextResponse.json(kieJson)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getShopCorsHeaders } from '@/lib/cors'
import { createAdminClient } from '@/lib/supabase/admin'

// Привязка UDID к заявке на ручную регистрацию. Вызывается со страницы Auth
// на bazzar-serts после установки профиля (когда получен udid). Переводит
// заявку из 'thinking' в 'awaiting_payment'.

export const dynamic = 'force-dynamic'

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: getShopCorsHeaders(request.headers.get('origin')) })
}

export async function POST(request: Request) {
  const headers = getShopCorsHeaders(request.headers.get('origin'))

  let body: { code?: string; udid?: string; model?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Некорректный запрос' }, { status: 400, headers })
  }

  const { code, udid, model } = body
  if (!code || !udid) {
    return NextResponse.json({ success: false, error: 'code и udid обязательны' }, { status: 400, headers })
  }

  // Валидация формата UDID (тот же паттерн, что в shop/ggsel/link)
  const udidPattern = /^[0-9a-fA-F-]{25,40}$/
  if (!udidPattern.test(udid)) {
    return NextResponse.json({ success: false, error: 'Неверный формат UDID' }, { status: 400, headers })
  }

  const supabase = createAdminClient()

  const { data: reg, error: findErr } = await supabase
    .from('manual_registrations')
    .select('id, status')
    .eq('code', code)
    .maybeSingle()

  if (findErr) {
    console.error('[registration:link-udid] DB error:', findErr.message)
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500, headers })
  }
  if (!reg) {
    return NextResponse.json({ success: false, error: 'Заявка не найдена' }, { status: 404, headers })
  }

  // Не меняем статус, если заявка уже оплачена/отклонена — только записываем udid
  const nextStatus = reg.status === 'thinking' ? 'awaiting_payment' : reg.status

  const { error: updErr } = await supabase
    .from('manual_registrations')
    .update({ udid, device_model: model || null, status: nextStatus })
    .eq('code', code)

  if (updErr) {
    console.error('[registration:link-udid] update error:', updErr.message)
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500, headers })
  }

  return NextResponse.json({ success: true, status: nextStatus }, { headers })
}

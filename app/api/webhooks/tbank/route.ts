import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeTbankToken } from '@/lib/tbank'

// Вебхук Т-Банка. При Status=CONFIRMED создаёт apple_certificates (оплаченный
// лид + UDID) по образцу shop/ggsel/link, фиксирует доход и уведомляет
// согласующего. Идемпотентен: повторный вебхук не создаёт дубль (проверка cert_id).
// Т-Банк ожидает в ответ тело "OK".

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const password = process.env.TBANK_PASSWORD

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return new NextResponse('OK')
  }

  if (!password) {
    console.error('[tbank:webhook] TBANK_PASSWORD not set')
    return new NextResponse('OK')
  }

  // Проверка подписи
  const { Token, ...rest } = body as { Token?: string } & Record<string, unknown>
  const expected = computeTbankToken(rest, password)
  if (!Token || Token !== expected) {
    console.error('[tbank:webhook] invalid token')
    return new NextResponse('OK')
  }

  const status = String(body.Status || '')
  const success = body.Success === true

  if (status === 'CONFIRMED' && success) {
    const orderId = String(body.OrderId || '')
    const supabase = createAdminClient()

    // ── App purchase ──────────────────────────────
    if (orderId.startsWith('app_')) {
      const { data: purchase } = await supabase
        .from('user_app_purchases')
        .select('*')
        .eq('order_code', orderId)
        .maybeSingle()

      if (purchase && purchase.status === 'pending') {
        await supabase
          .from('user_app_purchases')
          .update({
            status: 'paid',
            payment_id: body.PaymentId ? String(body.PaymentId) : purchase.payment_id,
          })
          .eq('order_code', orderId)

        // Record revenue
        const { data: app } = await supabase
          .from('bazzar_apps')
          .select('name')
          .eq('id', purchase.app_id)
          .maybeSingle()

        await supabase.from('transactions').insert({
          date: new Date().toISOString().slice(0, 10),
          description: `Покупка приложения: ${app?.name || 'unknown'} (${orderId})`,
          category: 'revenue',
          type: 'income',
          amount: Math.max(Number(purchase.amount) || 0, 0.01),
        })
      }

      return new NextResponse('OK')
    }

    // ── Certificate purchase (existing) ───────────
    const code = orderId.replace(/^mr_/, '')

    const { data: reg } = await supabase
      .from('manual_registrations')
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (reg && !reg.cert_id && reg.udid) {
      // 1. Сертификат в CRM (виден в мобилке «Заказы» и в кабинете клиента)
      const { data: cert, error: certErr } = await supabase
        .from('apple_certificates')
        .insert({
          udid: reg.udid,
          plan_id: `Сертификат Apple (${reg.guarantee_months} мес)`,
          source: reg.platform || 'avito',
          sale_price: reg.price,
        })
        .select()
        .maybeSingle()

      if (certErr) console.error('[tbank:webhook] cert insert failed:', certErr.message)

      // 2. Профиль клиента
      await supabase
        .from('bazzar_users')
        .upsert(
          {
            udid: reg.udid,
            status: 'bought',
            last_purchase: new Date().toISOString(),
            plan: `Сертификат Apple (${reg.guarantee_months} мес)`,
          },
          { onConflict: 'udid' }
        )

      // 3. Доход в финансах
      await supabase.from('transactions').insert({
        date: new Date().toISOString().slice(0, 10),
        description: `Ручная регистрация (${reg.platform}): сертификат ${reg.guarantee_months} мес (код ${code})`,
        category: 'revenue',
        type: 'income',
        amount: Math.max(Number(reg.price) || 0, 0.01),
      })

      // 4. Отмечаем заявку оплаченной
      await supabase
        .from('manual_registrations')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_id: body.PaymentId ? String(body.PaymentId) : reg.payment_id,
          cert_id: cert?.id || null,
        })
        .eq('code', code)

      // 5. Уведомление согласующему
      await supabase.from('notifications').insert({
        user_id: reg.approver_id || 'system',
        type: 'mention',
        title: 'Оплачен серт (ручная регистрация)',
        body: `💰 Оплачено ${reg.price} ₽\nГарантия ${reg.guarantee_months} мес\nUDID: \`${String(reg.udid).slice(0, 8)}...\`\nТребуется согласование.`,
        link: '/apple-certs',
      })
    }
  }

  return new NextResponse('OK')
}

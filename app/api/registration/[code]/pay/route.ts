import { NextResponse } from 'next/server'
import { getShopCorsHeaders } from '@/lib/cors'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeTbankToken, tbankInit } from '@/lib/tbank'
import { avitoPriceFor } from '@/lib/avitoTariffs'

// Инициация оплаты через Т-Банк для заявки на ручную регистрацию.
// Требует env: TBANK_TERMINAL_KEY, TBANK_PASSWORD.

export const dynamic = 'force-dynamic'

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: getShopCorsHeaders(request.headers.get('origin')) })
}

export async function POST(request: Request, { params }: { params: { code: string } }) {
  const headers = getShopCorsHeaders(request.headers.get('origin'))
  const code = params.code

  const terminalKey = process.env.TBANK_TERMINAL_KEY
  const password = process.env.TBANK_PASSWORD
  if (!terminalKey || !password) {
    return NextResponse.json(
      { success: false, error: 'Оплата временно недоступна (терминал не настроен)' },
      { status: 503, headers }
    )
  }

  let body: { returnUrl?: string; email?: string } = {}
  try {
    body = await request.json()
  } catch {
    /* тело необязательно */
  }

  // Онлайн-чек (54-ФЗ) требует контакт покупателя
  const email = (body.email || '').trim()
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Укажите корректный email для чека' }, { status: 400, headers })
  }

  const supabase = createAdminClient()
  const { data: reg, error } = await supabase
    .from('manual_registrations')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500, headers })
  }
  if (!reg) {
    return NextResponse.json({ success: false, error: 'Заявка не найдена' }, { status: 404, headers })
  }
  if (!reg.udid) {
    return NextResponse.json({ success: false, error: 'Сначала зарегистрируйте устройство' }, { status: 400, headers })
  }
  if (reg.status === 'paid') {
    return NextResponse.json({ success: false, error: 'Заказ уже оплачен' }, { status: 400, headers })
  }

  // Серверная валидация суммы: тариф — источник правды, не доверяем клиенту.
  const amount = avitoPriceFor(reg.guarantee_months) ?? reg.price

  const host = request.headers.get('host')
  const base = `https://${host}`
  const returnUrl = body.returnUrl || `${base}`

  const amountKopecks = amount * 100
  const initParams = {
    TerminalKey: terminalKey,
    Amount: amountKopecks, // в копейках
    OrderId: `mr_${code}`,
    Description: `Сертификат Apple, гарантия ${reg.guarantee_months} мес.`,
    NotificationURL: `${base}/api/webhooks/tbank`,
    SuccessURL: returnUrl,
    FailURL: returnUrl,
  }
  // Token считается только по параметрам верхнего уровня; Receipt (вложенный) в него не входит.
  const Token = computeTbankToken(initParams, password)

  // Онлайн-чек 54-ФЗ. Taxation задаётся в env (система налогообложения бизнеса).
  const Receipt = {
    Email: email,
    Taxation: process.env.TBANK_TAXATION || 'usn_income',
    Items: [
      {
        Name: `Сертификат Apple (гарантия ${reg.guarantee_months} мес)`,
        Price: amountKopecks,
        Quantity: 1,
        Amount: amountKopecks,
        Tax: process.env.TBANK_VAT || 'none',
        PaymentMethod: 'full_payment',
        PaymentObject: 'service',
      },
    ],
  }

  const data = await tbankInit({ ...initParams, Receipt, Token })
  if (!data.Success || !data.PaymentURL) {
    console.error('[tbank:init] failed:', data.ErrorCode, data.Message, data.Details)
    return NextResponse.json(
      { success: false, error: data.Message || data.Details || 'Не удалось создать платёж' },
      { status: 502, headers }
    )
  }

  await supabase
    .from('manual_registrations')
    .update({ payment_id: data.PaymentId ? String(data.PaymentId) : null })
    .eq('code', code)

  return NextResponse.json({ success: true, paymentUrl: data.PaymentURL }, { headers })
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// GGSel Order Sync — Cron (каждые 5 минут).
// 1. apilogin → token
// 2. seller-last-sales → [{invoice_id, date, product}]
// 3. purchase/info/{invoice_id} → {name: uniquecode, amount, date_pay}
// 4. Если uniquecode нет в bazzar_orders → insert + transaction + notification

export async function GET(req: Request) {
  const secret =
    req.headers.get('x-cron-secret') ??
    new URL(req.url).searchParams.get('secret') ??
    req.headers.get('authorization')?.replace('Bearer ', '')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sellerId = process.env.GGSEL_SELLER_ID
  const apiKey   = process.env.GGSEL_API_KEY

  if (!sellerId || !apiKey) {
    return NextResponse.json({ error: 'Missing GGSEL_SELLER_ID or GGSEL_API_KEY' }, { status: 500 })
  }

  const supabase = createAdminClient()
  const results = { synced: 0, skipped: 0, errors: [] as string[] }

  try {
    // ── 1. Авторизация ─────────────────────────────────
    const timestamp = Date.now().toString()
    const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex')

    const loginRes = await fetch('https://seller.ggsel.com/api_sellers/api/apilogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        seller_id: parseInt(sellerId, 10),
        timestamp,
        sign,
      }),
    })

    if (!loginRes.ok) {
      console.error('[GGSel Sync] Login failed:', loginRes.status)
      return NextResponse.json({ error: 'GGSel login failed' }, { status: 502 })
    }

    const loginData = await loginRes.json()
    if (!loginData.token) {
      console.error('[GGSel Sync] No token:', JSON.stringify(loginData))
      return NextResponse.json({ error: 'GGSel auth failed' }, { status: 502 })
    }

    const token = loginData.token

    // ── 2. Последние продажи ────────────────────────────
    const salesRes = await fetch(
      `https://seller.ggsel.com/api_sellers/api/seller-last-sales?seller_id=${sellerId}&token=${token}`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!salesRes.ok) {
      console.error('[GGSel Sync] Sales fetch failed:', salesRes.status)
      return NextResponse.json({ error: 'GGSel sales fetch failed' }, { status: 502 })
    }

    const salesData = await salesRes.json()
    const sales: any[] = Array.isArray(salesData)
      ? salesData
      : (salesData.sales || salesData.rows_data || [])

    if (!Array.isArray(sales) || sales.length === 0) {
      return NextResponse.json({ success: true, message: 'No sales', ...results })
    }

    console.log(`[GGSel Sync] Got ${sales.length} sales`)

    // ── 3. Обработка каждой продажи ─────────────────────
    for (const sale of sales) {
      const invoiceId = String(sale.invoice_id || '')
      if (!invoiceId) { results.skipped++; continue }

      try {
        // 3a. Получаем uniquecode через purchase/info
        const infoRes = await fetch(
          `https://seller.ggsel.com/api_sellers/api/purchase/info/${invoiceId}?token=${token}`,
          { headers: { 'Accept': 'application/json' } }
        )
        const infoData = await infoRes.json()

        if (infoData.retval !== 0 || !infoData.content) {
          console.log(`[GGSel Sync] No info for ${invoiceId}:`, infoData.retdesc)
          results.skipped++
          continue
        }

        const content = infoData.content
        const uniquecode = content.name || invoiceId
        const amount = Number(content.amount || sale.product?.price_rub || 0)
        const itemName = sale.product?.name || 'Сертификат Apple'
        const saleDate = content.date_pay || content.purchase_date || sale.date || new Date().toISOString()
        const email = content.email || ''

        // Оплачен ли? invoice_state: 3 = оплачен
        if (content.invoice_state !== 3) {
          results.skipped++
          continue
        }

        // 3b. Проверяем есть ли уже в базе (по uniquecode ИЛИ invoice_id)
        const { data: existing } = await supabase
          .from('bazzar_orders')
          .select('id')
          .or(`uniquecode.eq.${uniquecode},invoice_id.eq.${invoiceId}`)
          .maybeSingle()

        if (existing) {
          results.skipped++
          continue
        }

        // 3c. Создаём заказ
        const { error: orderErr } = await supabase.from('bazzar_orders').insert({
          uniquecode: uniquecode,
          invoice_id: invoiceId,
          item_name: itemName,
          amount: amount,
          email: email,
          status: 'pending_udid',
          source: 'ggsel_sync',
          created_at: saleDate,
        })

        if (orderErr) {
          if (orderErr.code === '23505') { results.skipped++; continue }
          console.error(`[GGSel Sync] Insert error ${invoiceId}:`, orderErr.message)
          results.errors.push(`${invoiceId}: ${orderErr.message}`)
          continue
        }

        // 3d. Создаём транзакцию (с проверкой дубликата)
        if (amount > 0) {
          const { data: existingTx } = await supabase
            .from('transactions')
            .select('id')
            .or(`description.ilike.%${uniquecode}%,description.ilike.%${invoiceId}%`)
            .maybeSingle()

          if (!existingTx) {
            await supabase.from('transactions').insert({
              date: new Date(saleDate).toISOString().slice(0, 10),
              description: `GGSel: ${itemName} (код: ${uniquecode})`,
              category: 'revenue',
              type: 'income',
              amount: Math.max(amount, 0.01),
            })
          }
        }

        // 3e. In-app уведомление
        await supabase.from('notifications').insert({
          user_id: 'ggsel-system',
          type: 'mention',
          title: 'GGSel: Новая оплата',
          body: [
            `💳 **Новая оплата GGSel!**`,
            `Товар: ${itemName}`,
            `Сумма: ${amount} ₽`,
            `Код: \`${uniquecode}\``,
            `Invoice: ${invoiceId}`,
            ``,
            `Клиент должен привязать UDID на сайте.`,
          ].join('\n'),
          link: '/projects/bazzar-certs',
        })

        // 3f. Pachca — отправляем прямо из cron (гарантированная доставка)
        // pachca_bot тоже пришлёт через Realtime, но дубль не критичен —
        // лучше 2 уведомления чем 0
        const pachcaUrl = process.env.PACHCA_WEBHOOK_URL
        if (pachcaUrl) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://connect.tvinck.ru'
          await fetch(pachcaUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: [
                `💳 **Новая оплата GGSel!**`,
                ``,
                `**Товар:** ${itemName}`,
                `**Сумма:** ${amount} ₽`,
                `**Код:** \`${uniquecode}\``,
                `**Invoice:** ${invoiceId}`,
                ``,
                `⏳ Ожидаем привязку UDID.`,
                `[📊 Финансы](${siteUrl}/finances)`,
              ].join('\n'),
            }),
          }).catch(err => console.error('[GGSel Sync] Pachca error:', err.message))
        }

        results.synced++
        console.log(`[GGSel Sync] ✅ ${uniquecode} (inv:${invoiceId}) — ${itemName} ${amount}₽`)

      } catch (saleErr: any) {
        console.error(`[GGSel Sync] Error ${invoiceId}:`, saleErr.message)
        results.errors.push(`${invoiceId}: ${saleErr.message}`)
      }
    }

    console.log(`[GGSel Sync] Done: synced=${results.synced} skipped=${results.skipped} errors=${results.errors.length}`)
    return NextResponse.json({ success: true, ...results })

  } catch (err: any) {
    console.error('[GGSel Sync] Fatal:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

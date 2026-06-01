import { NextResponse }        from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailStuckOrder } from '@/lib/email'

// Called by Vercel CRON or any external scheduler (e.g. every 30 min).
// Protected by a shared secret in CRON_SECRET env var.
// Add to vercel.json:
//   { "crons": [{ "path": "/api/cron/stuck-orders", "schedule": "*/30 * * * *" }] }
//
// Uses the service-role client so it can bypass RLS — this endpoint has no
// user session (no cookies), so the anon client would fail the is_ceo() check.

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const cutoff   = new Date(Date.now() - 15 * 60 * 1000).toISOString()

  const { data: stuck, error } = await supabase
    .from('pm_orders')
    .select('id, client_email, paid_at, gen_started_at, product:pm_products(name)')
    .eq('payment_status', 'paid')
    .in('gen_status', ['pending', 'processing'])
    .or(`gen_started_at.is.null,gen_started_at.lt.${cutoff}`)
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Process all orders in parallel: batch DB updates + batch emails
  const orders = stuck ?? []
  await Promise.all(
    orders.map(order =>
      supabase
        .from('pm_orders')
        .update({ gen_status: 'pending', gen_started_at: null })
        .eq('id', order.id)
    )
  )

  // Send email alerts (best-effort, fire-and-forget)
  await Promise.all(
    orders.map(order => {
      const product = Array.isArray(order.product) ? order.product[0] : order.product
      const { subject, html } = emailStuckOrder({
        orderId: order.id,
        email:   order.client_email,
        product: product?.name ?? 'Неизвестный продукт',
        paidAt:  order.paid_at ?? order.gen_started_at ?? new Date().toISOString(),
      })
      return sendEmail(subject, html)
    })
  )

  return NextResponse.json({
    processed: orders.length,
    orders: orders.map(o => ({ id: o.id, action: 'requeued' })),
  })
}

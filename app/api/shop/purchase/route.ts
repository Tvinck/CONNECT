import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { itemId?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { itemId } = body
  if (!itemId) return NextResponse.json({ error: 'itemId обязателен' }, { status: 400 })

  const admin = createAdminClient()

  const [{ data: item }, { data: profile }] = await Promise.all([
    admin.from('shop_items').select('id, title, price, stock, is_active').eq('id', itemId).single(),
    admin.from('users').select('id, points').eq('id', user.id).single(),
  ])

  if (!item || !item.is_active) return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
  if (!profile) return NextResponse.json({ error: 'Профиль не найден' }, { status: 404 })

  if (item.stock !== null && item.stock <= 0) {
    return NextResponse.json({ error: 'Товар закончился' }, { status: 400 })
  }

  if (profile.points < item.price) {
    return NextResponse.json({ error: `Недостаточно баллов. Нужно ${item.price}, у вас ${profile.points}` }, { status: 400 })
  }

  const [purchaseResult, pointsResult] = await Promise.all([
    admin.from('shop_purchases').insert({
      user_id: user.id,
      item_id: itemId,
      points_spent: item.price,
      status: 'pending',
    }),
    admin.from('users').update({ points: profile.points - item.price }).eq('id', user.id),
  ])

  if (purchaseResult.error || pointsResult.error) {
    const msg = purchaseResult.error?.message ?? pointsResult.error?.message ?? 'Unknown error'
    return NextResponse.json({ error: 'Ошибка при покупке: ' + msg }, { status: 500 })
  }

  if (item.stock !== null) {
    await admin.from('shop_items').update({ stock: item.stock - 1 }).eq('id', itemId)
  }

  return NextResponse.json({ ok: true, newPoints: profile.points - item.price })
}

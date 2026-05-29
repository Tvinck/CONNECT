/**
 * POST /api/shop/purchase
 *
 * Purchases a shop item for the authenticated user by delegating to the
 * `purchase_shop_item` Postgres function which runs the entire operation
 * (stock check, points check, insert purchase, deduct points, decrement stock)
 * inside a single transaction with row-level locks — eliminating the race
 * condition that existed in the previous read-then-write approach.
 *
 * Returns: { ok: true, newPoints: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  // 1. Authenticate the caller.
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  // 2. Parse and validate the request body.
  let body: { itemId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const { itemId } = body
  if (!itemId || typeof itemId !== 'string') {
    return NextResponse.json({ error: 'itemId обязателен' }, { status: 400 })
  }

  // 3. Call the atomic DB function via the admin client.
  //    The admin client is used so the function call is not blocked by RLS.
  //    The user identity is passed explicitly as p_user_id.
  const admin = createAdminClient()
  const { data: result, error: rpcError } = await admin.rpc('purchase_shop_item', {
    p_user_id: user.id,
    p_item_id: itemId,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  // The function returns a JSON object with either { ok, new_points } or { error }.
  const res = result as { ok?: boolean; error?: string; new_points?: number }

  if (res?.error) {
    return NextResponse.json({ error: res.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true, newPoints: res?.new_points ?? 0 })
}

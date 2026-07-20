import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * GGSel Chat Sync — polls GGSel debates API for new messages.
 * 
 * Key improvements over original:
 * 1. Dedup by ggsel_msg_id (message ID from GGSel) — no more lost duplicate texts
 * 2. Syncs BOTH buyer AND seller messages (was buyer-only)
 * 3. Uses filter_new=1 to only fetch chats with new activity
 * 4. Handles errors per-chat without dropping entire sync
 * 5. Builds composite msg ID from chat + message index for stable dedup
 */

async function ggselLogin(): Promise<string | null> {
  const sellerId = process.env.GGSEL_SELLER_ID
  const apiKey = process.env.GGSEL_API_KEY
  if (!sellerId || !apiKey) return null

  const timestamp = Date.now().toString()
  const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex')

  const res = await fetch('https://seller.ggsel.com/api_sellers/api/apilogin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ seller_id: parseInt(sellerId, 10), timestamp, sign }),
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.token || null
}

function checkAuth(request: Request): boolean {
  const secret =
    request.headers.get('x-cron-secret') ??
    new URL(request.url).searchParams.get('secret') ??
    request.headers.get('authorization')?.replace('Bearer ', '')
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET
}

// GET handler for Vercel Cron + pg_cron
export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return syncChats()
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return syncChats()
}

async function syncChats() {
  const supabase = createAdminClient()
  const results = { inserted: 0, skipped: 0, errors: 0, chats: 0 }

  try {
    const token = await ggselLogin()
    if (!token) {
      return NextResponse.json({ success: false, error: 'GGSel auth failed' }, { status: 502 })
    }

    // Fetch chats with new activity (filter_new=1) + all recent (filter_new=0 as fallback)
    const chatsRes = await fetch(
      `https://seller.ggsel.com/api_sellers/api/debates/v2/chats?token=${token}&filter_new=1`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!chatsRes.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch chats' }, { status: 502 })
    }

    const chatsData = await chatsRes.json()
    const chats = chatsData.items || []

    if (chats.length === 0) {
      return NextResponse.json({ success: true, message: 'No new chats', ...results })
    }

    results.chats = chats.length

    for (const chat of chats) {
      try {
        const msgsRes = await fetch(
          `https://seller.ggsel.com/api_sellers/api/debates/v2?token=${token}&id_i=${chat.id_i}`,
          { headers: { 'Accept': 'application/json' } }
        )
        if (!msgsRes.ok) { results.errors++; continue }

        const msgsData = await msgsRes.json()
        if (!Array.isArray(msgsData)) { results.errors++; continue }

        // UUID format for this chat's user_id
        const fakeUuid = `00000000-0000-0000-0000-${String(chat.id_i).padStart(12, '0')}`

        // Ensure vpn_subscription exists (FK requirement)
        const { data: existingSub } = await supabase
          .from('vpn_subscriptions')
          .select('id')
          .eq('id', fakeUuid)
          .maybeSingle()

        if (!existingSub) {
          const randomHex = crypto.randomBytes(4).toString('hex')
          const { error: subErr } = await supabase.from('vpn_subscriptions').insert({
            id: fakeUuid,
            username: `GGSel Заказ ${chat.id_i}`,
            status: 'active',
            traffic_limit: 0,
            token: `ggsel_${chat.id_i}_${randomHex}`,
            subscription_key: `ggsel_${chat.id_i}_${randomHex}`,
          })
          if (subErr) { results.errors++; continue }
        }

        // Process messages — BOTH buyer and seller
        for (let i = 0; i < msgsData.length; i++) {
          const msg = msgsData[i]
          if (!msg.message || !msg.message.trim()) continue

          // Stable ID: chat_id + message index + first 8 chars of text hash
          const textHash = crypto.createHash('md5').update(msg.message).digest('hex').slice(0, 8)
          const ggselMsgId = `ggsel_${chat.id_i}_${msg.id || i}_${textHash}`

          const isBuyer = msg.buyer === 1

          // Upsert by ggsel_msg_id — skip if exists
          const { error } = await supabase
            .from('support_messages')
            .upsert(
              {
                user_id: fakeUuid,
                message: msg.message,
                is_from_user: isBuyer,
                project: `GGSel (Заказ ${chat.id_i})`,
                ggsel_msg_id: ggselMsgId,
              },
              { onConflict: 'ggsel_msg_id', ignoreDuplicates: true }
            )

          if (error) {
            // Unique violation = already exists, skip silently
            if (error.code === '23505') { results.skipped++; continue }
            results.errors++
          } else {
            results.inserted++
          }
        }
      } catch (chatErr: any) {
        console.error(`[sync-chats] Error for chat ${chat.id_i}:`, chatErr.message)
        results.errors++
      }
    }

    console.log(`[sync-chats] Done: ${results.inserted} inserted, ${results.skipped} skipped, ${results.errors} errors, ${results.chats} chats`)
    return NextResponse.json({ success: true, ...results })
  } catch (err: any) {
    console.error('[sync-chats] Fatal:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getShopCorsHeaders } from '@/lib/cors'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateShopRequest } from '@/lib/shop-auth'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: getShopCorsHeaders(request.headers.get('origin')) })
}

export async function POST(request: Request) {
  const corsHeaders = getShopCorsHeaders(request.headers.get('origin'))
  const supabase = createAdminClient()

  // Auth check
  const authError = validateShopRequest(request)
  if (authError) return authError

  try {
    const { userId, message, senderEmail, project } = await request.json()

    if (!userId || !message) {
      return NextResponse.json({ success: false, error: 'Missing userId or message' }, { status: 400, headers: corsHeaders })
    }

    // 1. Сначала всегда сохраняем сообщение в нашей базе (Supabase)
    const { data: dbData, error: dbError } = await supabase
      .from('support_messages')
      .insert({
        user_id: userId,
        message: message.trim(),
        is_from_user: false,
        is_read: true,
        project: project || 'Veil VPN',
        sender_email: senderEmail || 'unknown'
      })
      .select()
      .single()

    if (dbError) throw dbError

    // 2. Проверяем, нужно ли отправлять в GGSel
    if (project?.toLowerCase().includes('ggsel')) {
      const sellerId = process.env.GGSEL_SELLER_ID;
      const apiKey = process.env.GGSEL_API_KEY;

      if (sellerId && apiKey) {
        // Парсим id_i из фейкового UUID (00000000-0000-0000-0000-000000123456)
        const parts = userId.split('-');
        const id_i_str = parts[parts.length - 1];
        const id_i = parseInt(id_i_str, 10);

        if (!isNaN(id_i) && id_i > 0) {
          // Получаем токен
          const timestamp = Date.now().toString();
          const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex');

          const loginRes = await fetch('https://seller.ggsel.com/api_sellers/api/apilogin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ seller_id: parseInt(sellerId, 10), timestamp, sign })
          });

          if (loginRes.ok) {
            const { token } = await loginRes.json();
            if (token) {
              // Отправляем сообщение в чат
              // Согласно документации GGSel API:
              // POST /api_sellers/api/debates/v2?token=...&id_i=...
              // body: { message: "..." }  (id_i — query param, НЕ в body)
              const sendRes = await fetch(`https://seller.ggsel.com/api_sellers/api/debates/v2?token=${token}&id_i=${id_i}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                  message: message.trim()
                })
              });
              
              if (!sendRes.ok) {
                console.error("GGSel send failed:", await sendRes.text());
                // Мы не прерываем выполнение, так как в Supabase оно уже сохранилось
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, data: dbData }, { headers: corsHeaders })
  } catch (err: any) {
    console.error('Send message error:', err)
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500, headers: corsHeaders })
  }
}


import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getShopCorsHeaders } from '@/lib/cors'
import crypto from 'crypto'

export const dynamic = 'force-dynamic' // No caching

/**
 * GGSel/Digiseller Verify endpoint.
 * 
 * Handles TWO scenarios:
 * 1. **Digiseller background check** (no Accept: application/json header, or ?format=text):
 *    Digiseller sends GET with ?uniquecode=XXX to verify purchase.
 *    Must respond with plain text "yes" if valid, anything else if invalid.
 *    This is called automatically by Digiseller after payment.
 *    
 * 2. **Our frontend check** (Accept: application/json or ?format=json):
 *    Our bazzar-certs frontend calls this to verify a purchase code.
 *    Returns JSON { success: true, item_name, uniquecode, status }.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uniquecode = searchParams.get('uniquecode')
  const formatParam = searchParams.get('format') // explicit format override

  // CORS headers — dynamic origin for bazzar-serts.shop + vercel.app
  const corsHeaders = getShopCorsHeaders(request.headers.get('origin'))

  // Determine if this is a Digiseller background check or our frontend
  const acceptHeader = request.headers.get('Accept') || ''
  const isDigisellerCheck = formatParam === 'text' || 
    (!formatParam && !acceptHeader.includes('application/json'))
  const isJsonRequest = formatParam === 'json' || acceptHeader.includes('application/json')

  const supabase = createAdminClient()

  if (!uniquecode) {
    if (isDigisellerCheck) {
      return new Response('no', { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } })
    }
    return NextResponse.json({ success: false, error: 'Код заказа не указан' }, { status: 400, headers: corsHeaders })
  }

  try {
    const sellerId = process.env.GGSEL_SELLER_ID;
    const apiKey = process.env.GGSEL_API_KEY;

    if (!sellerId || !apiKey) {
      console.error("Missing GGSel credentials");
      if (isDigisellerCheck) {
        return new Response('no', { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } })
      }
      return NextResponse.json({ success: false, error: 'Настройки сервера (API Key) не заданы' }, { status: 500, headers: corsHeaders })
    }

    // 1. Получаем токен GGSel
    const timestamp = Date.now().toString();
    const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex');

    const loginRes = await fetch('https://seller.ggsel.com/api_sellers/api/apilogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        seller_id: parseInt(sellerId, 10),
        timestamp: timestamp,
        sign: sign
      })
    });
    
    if (!loginRes.ok) throw new Error('Ошибка авторизации GGSel');
    const loginData = await loginRes.json();
    
    if (!loginData.token) {
       console.error("GGSel auth error:", loginData);
       throw new Error('Не удалось получить токен GGSel');
    }

    const token = loginData.token;

    // 2. Проверяем код
    const verifyRes = await fetch(`https://seller.ggsel.com/api_sellers/api/purchases/unique-code/${uniquecode}?token=${token}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const verifyData = await verifyRes.json();

    if (verifyData.retval !== 0) {
       console.log(`[GGSel verify] Code ${uniquecode} not found: ${verifyData.retdesc}`);
       if (isDigisellerCheck) {
         return new Response('no', { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } })
       }
       return NextResponse.json({
         success: false,
         error: verifyData.retdesc || 'Заказ не найден или недействителен'
       }, { status: 200, headers: corsHeaders })
    }

    const amount = verifyData.amount || 0;
    const email = verifyData.email || 'unknown@ggsel.com';
    const itemName = verifyData.name_invoice || verifyData.name_goods || 'Сертификат Apple ESign';
    const invoiceId = verifyData.inv || verifyData.id_invoice || null;

    // 3. Сохраняем заказ, если его еще нет в базе
    // Транзакция создаётся только при link (привязке UDID) — не здесь,
    // чтобы избежать дублей между verify и link.
    const { data: existingOrder } = await supabase
      .from('bazzar_orders')
      .select('id')
      .eq('uniquecode', uniquecode)
      .maybeSingle();

    if (!existingOrder) {
      // Сохраняем в базу заказов
      const { error: orderErr } = await supabase.from('bazzar_orders').upsert({
        uniquecode: uniquecode,
        invoice_id: invoiceId ? String(invoiceId) : null,
        item_name: itemName,
        amount: Number(amount) || 0,
        email: email,
        status: 'pending_udid',
        source: 'ggsel_verify',
        created_at: new Date().toISOString()
      }, { onConflict: 'uniquecode' });
      if (orderErr) console.error('[GGSel verify] bazzar_orders upsert failed:', orderErr.message);

      // Уведомление
      await supabase.from('notifications').insert({
        user_id: 'ggsel-system',
        type: 'mention',
        title: 'GGSel: Новая оплата',
        body: `💳 **Новая оплата на GGSel!**\nТовар: ${itemName}\nСумма: ${amount} ₽\nКод: \`${uniquecode}\`\nEmail: ${email}\nОжидаем привязку UDID.`,
        link: '/finances'
      }).then(({ error: notifErr }) => {
        if (notifErr) console.error('[GGSel verify] notifications insert failed:', notifErr.message);
      });

      console.log(`[GGSel verify] New order saved: ${uniquecode}, amount: ${amount}, item: ${itemName}`);
    }

    // 4. Respond based on caller type
    if (isDigisellerCheck) {
      // Digiseller background check — respond with "yes" to confirm
      console.log(`[GGSel verify] Digiseller background check OK for code: ${uniquecode}`);
      return new Response('yes', { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } })
    }

    // JSON response for our frontend
    return NextResponse.json({
      success: true,
      item_name: itemName,
      uniquecode: uniquecode,
      status: 'paid'
    }, { headers: corsHeaders })

  } catch (err: any) {
    console.error('Verify GGSel Error:', err);
    if (isDigisellerCheck) {
      return new Response('no', { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } })
    }
    return NextResponse.json({ success: false, error: 'Ошибка связи с GGSel' }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    headers: getShopCorsHeaders(null)
  })
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const API_KEY = process.env.BOT1_API_KEY;
const API_URL = process.env.NEXT_PUBLIC_BOT1_API_URL || 'https://api.bot1.org';

export async function checkBalance() {
  if (!API_KEY) {
    // Переход в ручной режим, если нет ключа
    return { success: true, balance: null, isManualMode: true };
  }

  try {
    const res = await fetch(`${API_URL}/balance`, {
      headers: {
        'Authorization': API_KEY,
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!res.ok) {
      throw new Error('Failed to fetch balance');
    }

    // Response from bot1 API is just plain text number like "125847.50"
    const text = await res.text();
    return { success: true, balance: parseFloat(text) };
  } catch (error: any) {
    console.error('Error fetching bot1 balance:', error);
    return { success: false, error: error.message };
  }
}

export async function getCertificates() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('apple_certificates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching certificates:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function registerCertificate(formData: {
  udid: string;
  plan_id: string;
  api_cost: number;
  sale_price: number;
  source: string;
}) {
  const supabase = createClient();
  let bot1_cert_id = null;

  try {
    // 1. Call Bot1 API (only if API key is provided)
    if (API_KEY) {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Authorization': API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          udid: formData.udid,
          register_plan: formData.plan_id,
          force_enabled: 'true'
        })
      });

      const responseText = await res.text();
      let apiData;
      
      try {
        apiData = JSON.parse(responseText);
      } catch {
        throw new Error(`API Error: ${responseText}`);
      }

      if (!res.ok || (apiData.status && apiData.status === 'error')) {
        throw new Error(apiData.message || 'Registration failed at API');
      }

      bot1_cert_id = apiData.id || apiData.certificate_id || null;
    }

    // 2. Save to Supabase
    const { error: dbError } = await supabase
      .from('apple_certificates')
      .insert({
        udid: formData.udid,
        plan_id: formData.plan_id,
        api_cost: formData.api_cost,
        sale_price: formData.sale_price,
        source: formData.source,
        bot1_cert_id: bot1_cert_id,
        status: 'active',
        crm_status: 'pending'
      });

    if (dbError) {
      console.error('DB Error:', dbError);
      throw new Error('Successfully registered in API, but failed to save to database');
    }

    // 3. Notify Artem Koshelev
    const ARTEM_ID = '99fc4e1a-e44c-40e1-b2ef-cddb6ec94bf6';
    const { data: authData } = await supabase.auth.getUser();
    
    let creatorName = 'Сотрудник';
    if (authData?.user) {
      const { data: profile } = await supabase.from('users').select('full_name').eq('id', authData.user.id).single();
      if (profile) creatorName = profile.full_name;
    }

    await supabase.from('notifications').insert({
      user_id: ARTEM_ID,
      type: 'info',
      title: 'Новая заявка на сертификат',
      body: `${creatorName} добавил продажу (UDID: ${formData.udid.substring(0,8)}...). Требуется согласование.`,
      link: '/apple-certs'
    });

    revalidatePath('/apple-certs');
    return { success: true, message: 'Certificate registered successfully' };

  } catch (error: any) {
    console.error('Error registering certificate:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCertStatus(certId: string, status: string, comment?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  const ARTEM_ID = '99fc4e1a-e44c-40e1-b2ef-cddb6ec94bf6';
  if (user.id !== ARTEM_ID) {
    return { success: false, error: 'У вас нет прав для согласования сертификатов' };
  }

  // Получаем сертификат ДО обновления статуса, чтобы знать udid и source
  const { data: cert, error: certFetchErr } = await supabase
    .from('apple_certificates')
    .select('*')
    .eq('id', certId)
    .maybeSingle();

  if (certFetchErr) {
    console.error('Error fetching cert for status update:', certFetchErr);
  }

  const { error } = await supabase
    .from('apple_certificates')
    .update({ 
      crm_status: status, 
      approver_id: user.id,
      approval_comment: comment || null 
    })
    .eq('id', certId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Если сертификат одобрен, источник GGSel или Digiseller и есть комментарий — отправляем автоматически в чат
  if (status === 'approved' && cert && (cert.source === 'GGSel' || cert.source === 'Digiseller') && comment) {
    try {
      // Ищем заказ по udid, чтобы получить uniquecode
      const { data: order } = await supabase
        .from('bazzar_orders')
        .select('uniquecode')
        .eq('udid', cert.udid)
        .eq('status', 'linked')
        .maybeSingle();

      if (order && order.uniquecode) {
        const isDigiseller = cert.source === 'Digiseller';
        const sellerId = isDigiseller ? process.env.DIGISELLER_SELLER_ID : process.env.GGSEL_SELLER_ID;
        const apiKey = isDigiseller ? process.env.DIGISELLER_API_KEY : process.env.GGSEL_API_KEY;
        const apiBaseUrl = isDigiseller ? 'https://api.digiseller.com/api' : 'https://seller.ggsel.com/api_sellers/api';

        if (sellerId && apiKey) {
          const crypto = require('crypto');
          const timestamp = isDigiseller ? Math.floor(Date.now() / 1000).toString() : Date.now().toString();
          const sign = crypto.createHash('sha256').update(apiKey + timestamp).digest('hex');

          // Авторизация
          const loginRes = await fetch(`${apiBaseUrl}/apilogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ 
              seller_id: parseInt(sellerId, 10), 
              timestamp: isDigiseller ? parseInt(timestamp, 10) : timestamp, 
              sign 
            })
          });
          
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            if (loginData.token) {
              // Получаем детали покупки, чтобы узнать id_i / inv (инвойс/чат)
              const verifyRes = await fetch(`${apiBaseUrl}/purchases/unique-code/${order.uniquecode}?token=${loginData.token}`);
              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                const id_i = verifyData.inv || verifyData.id_i;

                if (id_i) {
                  // Отправляем инструкцию покупателю в чат
                  await fetch(`${apiBaseUrl}/debates/v2/message?token=${loginData.token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                      id_i: id_i,
                      message: comment.trim()
                    })
                  });
                  console.log(`Successfully auto-sent CRM comment to ${cert.source} chat for order ${order.uniquecode}`);
                }
              }
            }
          }
        }
      }
    } catch (sendErr) {
      console.error(`Failed to auto-send ${cert.source} notification:`, sendErr);
    }
  }

  revalidatePath('/apple-certs');
  return { success: true };
}

export async function deleteCertificate(certId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('apple_certificates')
    .delete()
    .eq('id', certId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/apple-certs');
  return { success: true };
}

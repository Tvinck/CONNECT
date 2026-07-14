import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const webhookUrl = process.env.PACHCA_WEBHOOK_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://connect.tvinck.ru';

async function sendPachcaNotification(text: string) {
  if (!webhookUrl) {
    console.error('Ошибка: Не найден PACHCA_WEBHOOK_URL');
    return;
  }
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    if (!response.ok) {
      console.error('Ошибка отправки в Пачку:', await response.text());
    }
  } catch (err: any) {
    console.error('Ошибка сети при отправке в Пачку:', err.message);
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const table = body.table;
    const record = body.record; // Новая запись из БД

    if (!record || !table) {
      return NextResponse.json({ error: 'No record or table provided' }, { status: 400 });
    }

    if (table === 'support_messages') {
      const msg = record;
      let clientName = msg.user_id;
      const { data: subData } = await supabase
        .from('vpn_subscriptions')
        .select('username, telegram_username')
        .eq('id', msg.user_id)
        .maybeSingle();

      if (subData) {
        clientName = subData.telegram_username ? `@${subData.telegram_username}` : (subData.username || msg.user_id);
      }

      if (msg.is_from_user) {
        const text = `📩 **Новое сообщение от:** ${clientName}\n\n**Текст:** ${msg.message}\n**Проект:** ${msg.project || 'Veil VPN'}\n\n[💬 Открыть чат в Connect](${SITE_URL}/support)`;
        await sendPachcaNotification(text);
      } else {
        const operatorName = msg.sender_email ? msg.sender_email.split('@')[0] : 'Сотрудник';
        const text = `✅ **Сотрудник @${operatorName} ответил** клиенту ${clientName}:\n\n**Текст:** ${msg.message}`;
        await sendPachcaNotification(text);
      }
    }

    if (table === 'apple_certificates') {
      const cert = record;
      const planName = cert.plan_id === 'vip' ? 'VIP Сертификат' : (cert.plan_id === 'base' ? 'Базовый Сертификат' : cert.plan_id);
      const text = `🍏 **Новая заявка на Apple Сертификат!**\n\n**Тариф:** ${planName}\n**Сумма:** ${cert.sale_price} ₽\n**Источник:** ${cert.source}\n**UDID:** \`${cert.udid}\`\n\n[💳 Открыть финансы](${SITE_URL}/finances)`;
      await sendPachcaNotification(text);
    }

    if (table === 'vpn_subscriptions') {
      const sub = record;
      const clientName = sub.telegram_username ? `@${sub.telegram_username}` : (sub.username || sub.id);
      const text = `🛡 **Новая подписка Veil VPN!**\n\n**Клиент:** ${clientName}\n**Лимит:** ${sub.data_limit_gb} ГБ\n\n[👤 Открыть CRM](${SITE_URL}/crm)`;
      await sendPachcaNotification(text);
    }

    if (table === 'notifications') {
      const notif = record;
      const titleLower = notif.title ? notif.title.toLowerCase() : '';
      if (notif.type === 'mention' || titleLower.includes('упоминан') || titleLower.includes('упомянул')) {
        const { data: userData } = await supabase.from('users').select('full_name, email').eq('id', notif.user_id).maybeSingle();
        const targetName = userData ? (userData.full_name || userData.email) : 'Сотрудника';
        const text = `🔔 **Упоминание в CONNECT**\n\n**Кого:** ${targetName}\n**Событие:** ${notif.title}\n**Текст:** ${notif.body || ''}\n\n[🔗 Посмотреть](${SITE_URL}${notif.link || '/dashboard'})`;
        await sendPachcaNotification(text);
      }
    }

    if (table === 'bazzar_orders') {
      const order = record;
      const statusLabel = order.status === 'linked' ? '✅ Привязан' : '⏳ Ожидает UDID';
      const text = `💳 **Новый заказ Bazzar Serts**\n\n**Товар:** ${order.item_name || '—'}\n**Сумма:** ${order.amount || 0} ₽\n**Код:** \`${order.uniquecode}\`\n**Email:** ${order.email || '—'}\n**Статус:** ${statusLabel}\n\n[📊 Открыть финансы](${SITE_URL}/finances)`;
      await sendPachcaNotification(text);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

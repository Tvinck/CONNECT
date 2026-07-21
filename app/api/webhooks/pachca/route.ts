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

// Format short UDID for display
function shortUdid(udid: string | null) {
  if (!udid) return null;
  return udid.length > 12 ? udid.slice(0, 8) + '…' + udid.slice(-4) : udid;
}

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const table = body.table;
    const record = body.record;

    if (!record || !table) {
      return NextResponse.json({ error: 'No record or table provided' }, { status: 400 });
    }

    // ── Support messages ─────────────────────────────────────
    if (table === 'support_messages') {
      const msg = record;

      // Look up guest info from chat_guests
      const { data: guest } = await supabase
        .from('chat_guests')
        .select('guest_number, udid, device_info, display_name')
        .eq('id', msg.user_id)
        .maybeSingle();

      // Build client name with guest number
      let clientName = `Гость #${guest?.guest_number || '?'}`;
      let contextLines = '';

      if (guest?.udid) {
        // Lookup certificate info for this UDID
        const { data: cert } = await supabase
          .from('apple_certificates')
          .select('plan_id, status, expires_at, created_at')
          .eq('udid', guest.udid)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const planLabel = cert?.plan_id === 'vip' ? 'VIP' : cert?.plan_id === 'base' ? 'Базовый' : cert?.plan_id;
        const certStatus = cert ? `${planLabel} (${cert.status})` : 'Нет';
        const expiresAt = cert?.expires_at ? new Date(cert.expires_at).toLocaleDateString('ru-RU') : '';

        contextLines = [
          `📱 UDID: \`${shortUdid(guest.udid)}\``,
          cert ? `🔑 Сертификат: ${certStatus}${expiresAt ? ' до ' + expiresAt : ''}` : '🔑 Сертификат: Не куплен',
        ].join('\n');
      }

      if (guest?.device_info) {
        contextLines += `\n🖥 Устройство: ${guest.device_info}`;
      }

      if (msg.is_from_user) {
        const text = [
          `📩 **Новое сообщение**`,
          `👤 **${clientName}**`,
          contextLines,
          '',
          `**Текст:** ${msg.message}`,
          '',
          `[💬 Открыть чат](${SITE_URL}/support)`,
        ].filter(Boolean).join('\n');
        await sendPachcaNotification(text);
      } else {
        const operatorName = msg.sender_email ? msg.sender_email.split('@')[0] : 'Сотрудник';
        const text = `✅ **@${operatorName} ответил** ${clientName}:\n\n**Текст:** ${msg.message}`;
        await sendPachcaNotification(text);
      }
    }

    // ── Apple certificates ───────────────────────────────────
    if (table === 'apple_certificates') {
      const cert = record;
      const planName = cert.plan_id === 'vip' ? 'VIP Сертификат' : (cert.plan_id === 'base' ? 'Базовый Сертификат' : cert.plan_id);
      const text = `🍏 **Новая заявка на Apple Сертификат!**\n\n**Тариф:** ${planName}\n**Сумма:** ${cert.sale_price} ₽\n**Источник:** ${cert.source}\n**UDID:** \`${cert.udid}\`\n\n[💳 Открыть финансы](${SITE_URL}/finances)`;
      await sendPachcaNotification(text);
    }

    // ── VPN subscriptions (real VPN, not chat guests) ────────
    if (table === 'vpn_subscriptions') {
      const sub = record;
      // Skip chat guest entries (they have subscription_key starting with 'bazzar_certs_')
      if (sub.subscription_key && sub.subscription_key.startsWith('bazzar_certs_')) {
        // This is a legacy chat guest, not a VPN subscription — skip
      } else {
        const clientName = sub.telegram_username ? `@${sub.telegram_username}` : (sub.username || sub.id);
        const text = `🛡 **Новая подписка Veil VPN!**\n\n**Клиент:** ${clientName}\n**Лимит:** ${sub.data_limit_gb} ГБ\n\n[👤 Открыть CRM](${SITE_URL}/crm)`;
        await sendPachcaNotification(text);
      }
    }

    // ── Notifications ────────────────────────────────────────
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

    // ── Bazzar orders ────────────────────────────────────────
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

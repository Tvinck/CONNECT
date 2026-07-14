const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const webpush = require('web-push');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookUrl = process.env.PACHCA_WEBHOOK_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://connect.tvinck.ru';

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Не найдены переменные для подключения к Supabase (убедитесь, что задан SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}
if (!webhookUrl) {
  console.error('Ошибка: Не найден PACHCA_WEBHOOK_URL.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendPachcaNotification(text) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    });
    if (!response.ok) {
      console.error('Ошибка отправки в Пачку:', await response.text());
    }
  } catch (err) {
    console.error('Ошибка сети при отправке в Пачку:', err.message);
  }
}

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@tvinck.ru',
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  console.log('Web Push VAPID keys not configured.');
}

async function sendWebPushNotification(title, body, url = '/') {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  try {
    const { data } = await supabase
      .from('factory_generations')
      .select('video_url')
      .eq('prompt', 'web_push_subscriptions')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data || !data.video_url) return;

    const subscriptions = JSON.parse(data.video_url);
    if (!Array.isArray(subscriptions)) return;

    const payload = JSON.stringify({ title, body, url });

    const promises = subscriptions.map(sub => 
      webpush.sendNotification(sub, payload).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log('Subscription expired or invalid.');
        } else {
          console.error('Web Push Error:', err);
        }
      })
    );

    await Promise.all(promises);
  } catch (err) {
    console.error('Error sending Web Push:', err.message);
  }
}

console.log('🤖 Бот для уведомлений (Пачка + Web Push) запущен...');

// 1. Слушаем изменения в таблице support_messages
supabase
  .channel('pachca_support_notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, async (payload) => {
    const msg = payload.new;
    
    // Получаем информацию о клиенте
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
      await sendWebPushNotification('Новое сообщение в поддержку', `От: ${clientName}\n${msg.message}`, `${SITE_URL}/support`);
    } else {
      const operatorName = msg.sender_email ? msg.sender_email.split('@')[0] : 'Сотрудник';
      const text = `✅ **Сотрудник @${operatorName} ответил** клиенту ${clientName}:\n\n**Текст:** ${msg.message}`;
      await sendPachcaNotification(text);
    }
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Поддержка): ${status}`);
  });

// 2. Слушаем новые покупки Apple Certificates
supabase
  .channel('pachca_certs_notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'apple_certificates' }, async (payload) => {
    const cert = payload.new;
    const planName = cert.plan_id === 'vip' ? 'VIP Сертификат' : (cert.plan_id === 'base' ? 'Базовый Сертификат' : cert.plan_id);
    const text = `🍏 **Новая заявка на Apple Сертификат!**\n\n**Тариф:** ${planName}\n**Сумма:** ${cert.sale_price} ₽\n**Источник:** ${cert.source}\n**UDID:** \`${cert.udid}\`\n\n[💳 Открыть финансы](${SITE_URL}/finances)`;
    await sendPachcaNotification(text);
    await sendWebPushNotification('Новая заявка на сертификат!', `Тариф: ${planName}\nСумма: ${cert.sale_price} ₽`, `${SITE_URL}/crm`);
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Bazzar Certs): ${status}`);
  });

// 3. Слушаем новые подписки VPN
supabase
  .channel('pachca_vpn_notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vpn_subscriptions' }, async (payload) => {
    const sub = payload.new;
    const clientName = sub.telegram_username ? `@${sub.telegram_username}` : (sub.username || sub.id);
    const text = `🛡 **Новая подписка Veil VPN!**\n\n**Клиент:** ${clientName}\n**Лимит:** ${sub.data_limit_gb} ГБ\n\n[👤 Открыть CRM](${SITE_URL}/crm)`;
    await sendPachcaNotification(text);
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Veil VPN): ${status}`);
  });

// 4. Слушаем упоминания (notifications.type = 'mention')
supabase
  .channel('pachca_mentions')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
    const notif = payload.new;
    if (notif.type === 'mention' || notif.title.toLowerCase().includes('упомянул')) {
      // Ищем имя того, кого упомянули
      const { data: userData } = await supabase.from('users').select('full_name, email').eq('id', notif.user_id).maybeSingle();
      const targetName = userData ? (userData.full_name || userData.email) : 'Сотрудника';
      
      const text = `🔔 **Упоминание в CONNECT**\n\n**Кого:** ${targetName}\n**Событие:** ${notif.title}\n**Текст:** ${notif.body || ''}\n\n[🔗 Посмотреть](${SITE_URL}${notif.link || '/dashboard'})`;
      await sendPachcaNotification(text);
    }
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Упоминания): ${status}`);
  });

// 5. Итоги дня по задачам (каждый день в 00:00 по Москве)
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Запуск ежедневной сводки по задачам...');
  
  // Получаем задачи, созданные за последние 24 часа
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('title, status, users!tasks_assignee_id_fkey(full_name)')
    .gte('created_at', yesterday.toISOString());
    
  if (error) {
    console.error('Ошибка получения задач для сводки:', error);
    return;
  }
  
  if (!tasks || tasks.length === 0) {
    await sendPachcaNotification(`📊 **Итоги дня: Задачи**\n\nЗа прошедшие сутки новых задач не поступало. Отличная работа! 🎉`);
    return;
  }
  
  let summaryText = `📊 **Итоги дня: Новые задачи за сутки**\n\nВсего новых задач: **${tasks.length}**\n\n`;
  
  tasks.forEach((task, idx) => {
    const assignee = task.users?.full_name || 'Не назначена';
    summaryText += `${idx + 1}. **${task.title}** (Статус: ${task.status}, Исполнитель: ${assignee})\n`;
  });
  
  summaryText += `\n[📋 Открыть доску задач](${SITE_URL}/tasks)`;
  
  await sendPachcaNotification(summaryText);
}, {
  timezone: "Europe/Moscow"
});

console.log('⏰ Планировщик ежедневной сводки (Cron) запущен (каждый день в 00:00 МСК)');

// 6. GGSel Чаты: Поллинг непрочитанных сообщений (каждую минуту)
cron.schedule('* * * * *', async () => {
  try {
    const res = await fetch(`${SITE_URL}/api/shop/ggsel/sync-chats`, { method: 'POST' });
    if (!res.ok) {
      console.error('Ошибка Cron GGSel Chats API:', await res.text());
      return;
    }
    const data = await res.json();
    if (data.success && data.inserted > 0) {
      console.log(`Скачано новых сообщений из GGSel: ${data.inserted}`);
    }
  } catch(e) {
    console.error('Ошибка вызова GGSel Sync API:', e.message);
  }
});

console.log('⏰ Планировщик GGSel Чатов (Cron) запущен (каждую минуту)');

// 7. Слушаем новые тикеты Bazzar Serts
supabase
  .channel('pachca_bazzar_tickets')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bazzar_tickets' }, async (payload) => {
    const ticket = payload.new;
    const ticketType = ticket.type === 'claim' ? '⚠️ Претензия' : '💡 Предложение';
    let subTypeStr = '';
    if (ticket.sub_type === 'site') subTypeStr = ' (По сайту)';
    if (ticket.sub_type === 'apps') subTypeStr = ' (По приложениям)';
    if (ticket.sub_type === 'collab') subTypeStr = ' (Сотрудничество)';

    const text = `📬 **Новое обращение Bazzar Serts**\n\n**Тип:** ${ticketType}${subTypeStr}\n**UDID:** \`${ticket.udid}\`\n\n**Сообщение:**\n${ticket.message}\n${ticket.image_url ? `\n[🖼 Смотреть скриншот](${ticket.image_url})\n` : ''}\n[🔍 Открыть в Connect](${SITE_URL}/projects/bazzar-certs)`;
    await sendPachcaNotification(text);
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Bazzar Tickets): ${status}`);
  });

// 8. Слушаем новые заказы Bazzar Serts (GGSel/Digiseller)
supabase
  .channel('pachca_bazzar_orders')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bazzar_orders' }, async (payload) => {
    try {
      const order = payload.new;
      const statusLabel = order.status === 'linked' ? '✅ Привязан' : '⏳ Ожидает UDID';
      const source = order.source === 'ggsel_sync' ? ' (автосинк)' : '';
      const text = `💳 **Новый заказ Bazzar Serts${source}**\n\n**Товар:** ${order.item_name || '—'}\n**Сумма:** ${order.amount || 0} ₽\n**Код:** \`${order.uniquecode}\`\n**Email:** ${order.email || '—'}\n**Статус:** ${statusLabel}\n\n[📊 Открыть финансы](${SITE_URL}/finances)`;
      await sendPachcaNotification(text);
      await sendWebPushNotification(
        'Новый заказ Bazzar Serts!',
        `${order.item_name || 'Сертификат'} — ${order.amount || 0} ₽`,
        `${SITE_URL}/projects/bazzar-certs`
      );
    } catch (err) {
      console.error('[Pachca Bot] Error processing bazzar_orders INSERT:', err.message);
    }
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Bazzar Orders): ${status}`);
  });

// 9. Слушаем привязку UDID (UPDATE bazzar_orders status -> linked)
supabase
  .channel('pachca_bazzar_orders_linked')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bazzar_orders' }, async (payload) => {
    try {
      const order = payload.new;
      const oldOrder = payload.old || {};

      // Уведомляем только при смене статуса на linked
      // old может быть пустым если replica identity не FULL — проверяем наличие udid в new
      const wasNotLinked = !oldOrder.status || oldOrder.status !== 'linked';
      if (order.status === 'linked' && wasNotLinked && order.udid) {
        const text = `✅ **UDID привязан к заказу!**\n\n**Товар:** ${order.item_name || '—'}\n**UDID:** \`${(order.udid || '').slice(0, 12)}...\`\n**Код:** \`${order.uniquecode}\`\n\n⚡ Можно подписывать сертификат!\n\n[🔧 Открыть CRM](${SITE_URL}/projects/bazzar-certs)`;
        await sendPachcaNotification(text);
        await sendWebPushNotification(
          'UDID привязан!',
          `${order.item_name || 'Сертификат'} — UDID привязан, можно подписывать`,
          `${SITE_URL}/projects/bazzar-certs`
        );
      }
    } catch (err) {
      console.error('[Pachca Bot] Error processing bazzar_orders UPDATE:', err.message);
    }
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Bazzar Orders Linked): ${status}`);
  });



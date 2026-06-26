const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const webhookUrl = process.env.PACHCA_WEBHOOK_URL;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Не найдены переменные для подключения к Supabase.');
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

console.log('🤖 Бот для уведомлений (Пачка) запущен...');

// Слушаем изменения в таблице support_messages
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
      const text = `📩 **Новое сообщение от клиента** ${clientName}:\n\n${msg.message}\n\n_Проект: ${msg.project || 'Veil VPN'}_`;
      await sendPachcaNotification(text);
    } else {
      const operatorName = msg.sender_email ? msg.sender_email.split('@')[0] : 'Сотрудник';
      const text = `✅ **Сотрудник @${operatorName} ответил** клиенту ${clientName}:\n\n${msg.message}`;
      await sendPachcaNotification(text);
    }
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Поддержка): ${status}`);
  });

// Слушаем новые покупки Apple Certificates
supabase
  .channel('pachca_certs_notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'apple_certificates' }, async (payload) => {
    const cert = payload.new;
    const planName = cert.plan_id === 'vip' ? 'VIP Сертификат' : (cert.plan_id === 'base' ? 'Базовый Сертификат' : cert.plan_id);
    const text = `🍏 **Новая заявка на Apple Сертификат!**\n\n**Тариф:** ${planName}\n**Сумма:** ${cert.sale_price} ₽\n**Источник:** ${cert.source}\n**UDID:** \`${cert.udid}\`\n\nПроверьте раздел "Финансы" или "Apple Certs" в CRM.`;
    await sendPachcaNotification(text);
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Bazzar Certs): ${status}`);
  });

// Слушаем новые подписки VPN
supabase
  .channel('pachca_vpn_notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vpn_subscriptions' }, async (payload) => {
    const sub = payload.new;
    const clientName = sub.telegram_username ? `@${sub.telegram_username}` : (sub.username || sub.id);
    const text = `🛡 **Новая подписка Veil VPN!**\n\n**Клиент:** ${clientName}\n**Лимит:** ${sub.data_limit_gb} ГБ\n\nПроверьте раздел "Пользователи" в CRM.`;
    await sendPachcaNotification(text);
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Veil VPN): ${status}`);
  });

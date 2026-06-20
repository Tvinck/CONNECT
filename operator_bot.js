const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const token = '8910548080:AAHF8JLeT6BEfvLInsbqnH0WxSzYSDul2X8'; // Токен из задания
const bot = new Telegraf(token);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Не найдены переменные для подключения к Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Здесь оператор должен указать ID группы или свой ID после того, как узнает его через /start
const OPERATOR_CHAT_ID = process.env.TELEGRAM_OPERATOR_CHAT_ID;

console.log('🤖 Бот для операторов запущен...');

bot.start((ctx) => {
  const chatId = ctx.chat.id;
  ctx.reply(`Привет! Я бот для уведомлений операторов Connect.\n\nВаш Chat ID: \`${chatId}\`\n\nДобавьте эту строку в файл .env.local сервера:\nTELEGRAM_OPERATOR_CHAT_ID=${chatId}\n\nЗатем перезапустите бота.`, { parse_mode: 'Markdown' });
});

bot.launch();

// Слушаем изменения в таблице support_messages
supabase
  .channel('operator_notifications')
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

    if (!OPERATOR_CHAT_ID) {
      console.log('🔔 Новое сообщение, но TELEGRAM_OPERATOR_CHAT_ID не настроен. (ID: ' + clientName + ')');
      return;
    }

    try {
      if (msg.is_from_user) {
        // Сообщение от клиента
        const text = `📩 *Новое сообщение от клиента* ${clientName}:\n\n${msg.message}\n\n_Проект: ${msg.project || 'Veil VPN'}_`;
        await bot.telegram.sendMessage(OPERATOR_CHAT_ID, text, { parse_mode: 'Markdown' });
      } else {
        // Ответ от оператора
        // msg.sender_email содержит email сотрудника
        const operatorName = msg.sender_email ? msg.sender_email.split('@')[0] : 'Сотрудник';
        const text = `✅ *Сотрудник @${operatorName} ответил* клиенту ${clientName}:\n\n${msg.message}`;
        await bot.telegram.sendMessage(OPERATOR_CHAT_ID, text, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('Ошибка отправки уведомления в Telegram:', err.message);
    }
  })
  .subscribe((status) => {
    console.log(`🔌 Статус Realtime-подключения (Operator Bot): ${status}`);
  });

// Включение graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

/**
 * Скрипт для создания таблиц quick_replies и procedures через Supabase REST API.
 * Запускать: node scripts/migrate_support_tables.mjs
 * 
 * Если не сработает — вставьте SQL вручную через Supabase Dashboard > SQL Editor.
 */

const SUPABASE_URL = 'https://fhwrdhebhgywhvoeqpxj.supabase.co';
// Anon key — для создания таблиц нужны права. Если RLS блокирует, используйте service_role через Dashboard.
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mjk0MjcsImV4cCI6MjA5NTUwNTQyN30.1odxq5Ull4GDI_zoThLfwjbYE6IaDI0_yDGv-_lzDHM';

const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// === Проверяем существующие таблицы ===
console.log('Checking tables...');

const { data: qr, error: qrErr } = await sb.from('quick_replies').select('count').limit(1);
const { data: pr, error: prErr } = await sb.from('procedures').select('count').limit(1);

const qrExists = !qrErr;
const prExists = !prErr;

console.log('quick_replies:', qrExists ? '✅ EXISTS' : '❌ MISSING — ' + qrErr?.message);
console.log('procedures:', prExists ? '✅ EXISTS' : '❌ MISSING — ' + prErr?.message);

if (!qrExists || !prExists) {
  console.log('\n=== НУЖНО ЗАПУСТИТЬ В SUPABASE SQL EDITOR ===');
  console.log('Откройте: https://supabase.com/dashboard/project/fhwrdhebhgywhvoeqpxj/sql/new\n');

  if (!qrExists) console.log(`
-- Таблица шаблонных ответов
CREATE TABLE IF NOT EXISTS quick_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL DEFAULT 'all',
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

INSERT INTO quick_replies (platform, title, body, sort_order) VALUES
('ggsel', '✅ Заказ активирован', 'Добрый день! Ваш заказ успешно активирован. Если у вас возникнут вопросы — мы на связи!', 1),
('ggsel', '⏳ Принято в работу', 'Принято в работу! Проверяем статус вашего заказа, ответим в течение 15 минут.', 2),
('ggsel', '🔄 Оформление возврата', 'Для оформления возврата средств нам понадобится ваш номер заказа и причина. Пожалуйста, уточните детали.', 3),
('ggsel', '❓ Уточняем информацию', 'Уточните, пожалуйста, какой именно сертификат или услуга вас интересует? Это поможет решить вопрос быстрее.', 4),
('ggsel', '👋 Приветствие', 'Добрый день! Чем могу помочь?', 0),
('all', '🙏 Спасибо за обращение', 'Спасибо за обращение! Если появятся ещё вопросы — пишите, всегда рады помочь.', 10);
`);

  if (!prExists) console.log(`
-- Таблица процедур
CREATE TABLE IF NOT EXISTS procedures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL DEFAULT 'all',
  title text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

INSERT INTO procedures (platform, title, steps, sort_order) VALUES
('ggsel', 'Активация заказа', '[
  {"text": "Проверить статус заказа в панели GGSel"},
  {"text": "Убедиться, что оплата подтверждена (invoice_state = 3)"},
  {"text": "Отправить клиенту данные для активации"},
  {"text": "Попросить клиента подтвердить получение"},
  {"text": "Отметить заказ как выполненный"}
]'::jsonb, 1),
('ggsel', 'Возврат средств', '[
  {"text": "Уточнить причину возврата у клиента"},
  {"text": "Проверить дату покупки (возврат до 40 дней)"},
  {"text": "Проверить статус уникального кода"},
  {"text": "Инициировать возврат через панель GGSel"},
  {"text": "Уведомить клиента о сроках возврата (3-5 дней)"}
]'::jsonb, 2),
('ggsel', 'Проблема с кодом', '[
  {"text": "Попросить клиента описать проблему подробнее"},
  {"text": "Проверить, был ли код уже использован"},
  {"text": "Уточнить устройство и регион клиента"},
  {"text": "Предложить повторную отправку или замену"},
  {"text": "При необходимости эскалировать в техподдержку"}
]'::jsonb, 3);
`);

  process.exit(0);
}

// === Таблицы существуют — показываем содержимое ===
const { data: replies } = await sb.from('quick_replies').select('*').order('sort_order');
const { data: procs } = await sb.from('procedures').select('*').order('sort_order');

console.log('\n📋 quick_replies:');
replies?.forEach(r => console.log(`  [${r.platform}] ${r.title}`));

console.log('\n📋 procedures:');
procs?.forEach(p => console.log(`  [${p.platform}] ${p.title} (${p.steps?.length} шагов)`));

console.log('\n✅ Всё готово! Таблицы существуют и заполнены.');

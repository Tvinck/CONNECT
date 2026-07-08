-- Таблица шаблонных ответов
CREATE TABLE IF NOT EXISTS quick_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL DEFAULT 'all',  -- 'ggsel' | 'veil' | 'bazzar' | 'all'
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Вставляем стартовые шаблоны для GGSel
INSERT INTO quick_replies (platform, title, body, sort_order) VALUES
('ggsel', '✅ Заказ активирован', 'Добрый день! Ваш заказ успешно активирован. Если у вас возникнут вопросы — мы на связи!', 1),
('ggsel', '⏳ Принято в работу', 'Принято в работу! Проверяем статус вашего заказа, ответим в течение 15 минут.', 2),
('ggsel', '🔄 Оформление возврата', 'Для оформления возврата средств нам понадобится ваш номер заказа и причина. Пожалуйста, уточните детали.', 3),
('ggsel', '❓ Уточняем информацию', 'Уточните, пожалуйста, какой именно сертификат или услуга вас интересует? Это поможет решить вопрос быстрее.', 4),
('ggsel', '👋 Приветствие', 'Добрый день! Чем могу помочь?', 0),
('all', '🙏 Спасибо за обращение', 'Спасибо за обращение! Если появятся ещё вопросы — пишите, всегда рады помочь.', 10);

-- Таблица процедур
CREATE TABLE IF NOT EXISTS procedures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL DEFAULT 'all',
  title text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',  -- [{text: string, note?: string}]
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Стартовые процедуры для GGSel
INSERT INTO procedures (platform, title, steps, sort_order) VALUES
('ggsel', 'Активация заказа', '[
  {"text": "Проверить статус заказа в панели GGSel"},
  {"text": "Убедиться, что оплата подтверждена (invoice_state = 3)"},
  {"text": "Отправить клиенту данные для активации"},
  {"text": "Попросить клиента подтвердить получение"},
  {"text": "Отметить заказ как выполненный"}
]', 1),
('ggsel', 'Возврат средств', '[
  {"text": "Уточнить причину возврата у клиента"},
  {"text": "Проверить дату покупки (возврат до 40 дней)"},
  {"text": "Проверить статус уникального кода"},
  {"text": "Инициировать возврат через панель GGSel"},
  {"text": "Уведомить клиента о сроках возврата (3-5 дней)"}
]', 2),
('ggsel', 'Проблема с кодом', '[
  {"text": "Попросить клиента описать проблему подробнее"},
  {"text": "Проверить, был ли код уже использован"},
  {"text": "Уточнить устройство и регион клиента"},
  {"text": "Предложить повторную отправку или замену"},
  {"text": "При необходимости эскалировать в техподдержку"}
]', 3);

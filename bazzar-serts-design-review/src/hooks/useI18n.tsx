import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/* ═══════════════════════════════════════════════════════════
   i18n — Мультиязычность RU / EN
   Хранит язык в localStorage, даёт функции t() и l() для перевода
   t(key, vars?) — словарные строки с интерполяцией {name}
   l(ltext)      — выбор ru/en из двуязычного объекта (данные каталога)
   plural(n, forms) — русские множественные формы (1 день / 2 дня / 5 дней)
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'ru' | 'en'

/** Двуязычная строка (для данных: товары, категории, отзывы, FAQ) */
export interface LText {
  ru: string
  en: string
}

/** Русская плюрализация: plural(5, ['день', 'дня', 'дней']) → 'дней' */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100
  const d = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (d > 1 && d < 5) return forms[1]
  if (d === 1) return forms[0]
  return forms[2]
}

const translations: Record<string, Record<Lang, string>> = {
  // Header
  'nav.home': { ru: 'Главная', en: 'Home' },
  'nav.catalog': { ru: 'Каталог', en: 'Catalog' },
  'nav.apps': { ru: 'Приложения', en: 'Apps' },
  'nav.cabinet': { ru: 'Кабинет', en: 'Account' },
  'nav.howItWorks': { ru: 'Как это работает', en: 'How it works' },
  'nav.guarantees': { ru: 'Гарантии', en: 'Guarantees' },
  'nav.mainAria': { ru: 'Основная навигация', en: 'Main navigation' },
  'header.search': { ru: 'Поиск...', en: 'Search...' },
  'header.langTitle': { ru: 'Switch to English', en: 'Переключить на русский' },

  // Hero
  'hero.badge': { ru: '✦ 10,000+ довольных пользователей', en: '✦ 10,000+ happy users' },
  'hero.title1': { ru: 'Свобода', en: 'Freedom to' },
  'hero.title2': { ru: 'установки', en: 'install' },
  'hero.title3': { ru: 'приложений на iOS', en: 'apps on iOS' },
  'hero.subtitle': { ru: 'Сертификаты разработчика Apple с мгновенной доставкой. Устанавливай приложения без ограничений.', en: 'Apple Developer Certificates with instant delivery. Install apps without restrictions.' },
  'hero.subtitleFull': { ru: 'Сертификаты разработчика и альтернативные приложения. Мгновенная доставка, гарантия замены, поддержка 24/7.', en: 'Developer certificates and alternative apps. Instant delivery, replacement guarantee, 24/7 support.' },
  'hero.search': { ru: 'Найти приложение, сертификат...', en: 'Search apps, certificates...' },
  'hero.searchHome': { ru: 'Найти сертификат или приложение...', en: 'Find a certificate or app...' },
  'hero.cta': { ru: 'Найти', en: 'Search' },

  // Popular tags
  'tag.vip': { ru: 'VIP Сертификат', en: 'VIP Certificate' },
  'tag.tiktok': { ru: 'TikTok', en: 'TikTok' },
  'tag.scarlet': { ru: 'Scarlet', en: 'Scarlet' },
  'tag.free': { ru: 'Бесплатно', en: 'Free' },
  'tag.vksova': { ru: 'VK Сова', en: 'VK Sova' },

  // Trust bar
  'trust.delivery': { ru: 'Мгновенная доставка', en: 'Instant delivery' },
  'trust.guarantee': { ru: 'Гарантия замены', en: 'Replacement guarantee' },
  'trust.support': { ru: 'Поддержка 24/7', en: '24/7 Support' },
  'trust.payment': { ru: 'Безопасная оплата', en: 'Secure payment' },

  // Categories
  'cat.title': { ru: 'Категории', en: 'Categories' },
  'cat.all': { ru: 'Все', en: 'All' },
  'cat.certs': { ru: 'Сертификаты', en: 'Certificates' },
  'cat.apps': { ru: 'Приложения', en: 'Apps' },
  'cat.utils': { ru: 'Утилиты', en: 'Utilities' },
  'cat.free': { ru: 'Бесплатное', en: 'Free' },

  // Product
  'product.buy': { ru: 'Купить', en: 'Buy Now' },
  'product.free': { ru: 'Бесплатно', en: 'Free' },
  'product.delivery': { ru: 'Мгновенная доставка', en: 'Instant delivery' },
  'product.similar': { ru: 'Похожие товары', en: 'Similar products' },
  'product.recent': { ru: 'Вы недавно смотрели', en: 'Recently viewed' },
  'product.reviews': { ru: 'Отзывы', en: 'Reviews' },
  'product.sales': { ru: 'продаж', en: 'sales' },
  'product.inStock': { ru: 'В наличии', en: 'In stock' },
  'product.notFound': { ru: 'Товар не найден', en: 'Product not found' },
  'product.notFoundDesc': { ru: 'Возможно, он был удалён или ссылка устарела', en: 'It may have been removed or the link is outdated' },
  'product.tab.desc': { ru: 'Описание', en: 'Description' },
  'product.tab.specs': { ru: 'Характеристики', en: 'Specifications' },
  'product.tab.delivery': { ru: 'Доставка', en: 'Delivery' },
  'product.tab.reviews': { ru: 'Отзывы', en: 'Reviews' },
  'product.spec.category': { ru: 'Категория', en: 'Category' },
  'product.spec.delivery': { ru: 'Доставка', en: 'Delivery' },
  'product.spec.rating': { ru: 'Рейтинг', en: 'Rating' },
  'product.spec.sold': { ru: 'Продаж', en: 'Sold' },
  'product.spec.compat': { ru: 'Совместимость', en: 'Compatibility' },
  'product.spec.warranty': { ru: 'Гарантия', en: 'Warranty' },
  'product.warrantyValue': { ru: 'Замена при отзыве', en: 'Replacement if revoked' },
  'product.catName.certs': { ru: 'Сертификат', en: 'Certificate' },
  'product.catName.apps': { ru: 'Приложение', en: 'App' },
  'product.catName.utils': { ru: 'Утилита', en: 'Utility' },
  'product.delivery.email': { ru: 'Данные отправляются на email автоматически после оплаты', en: 'Details are emailed automatically right after payment' },
  'product.delivery.replace': { ru: 'Бесплатная замена в течение всего срока действия', en: 'Free replacement for the entire validity period' },
  'product.delivery.support': { ru: 'Telegram, email — отвечаем в течение 15 минут', en: 'Telegram, email — we reply within 15 minutes' },
  'product.choosePlan': { ru: 'Выберите тариф', en: 'Choose a plan' },
  'product.plan.basic': { ru: 'Базовый', en: 'Basic' },
  'product.plan.standard': { ru: 'Стандартный', en: 'Standard' },
  'product.plan.vip': { ru: 'VIP', en: 'VIP' },
  'product.plan.basicDesc': { ru: 'Попробовать', en: 'Try it out' },
  'product.plan.standardDesc': { ru: 'Оптимальный', en: 'Best value' },
  'product.plan.vipDesc': { ru: 'Максимум', en: 'The works' },
  'product.days.40': { ru: '40 дней', en: '40 days' },
  'product.days.180': { ru: '180 дней', en: '180 days' },
  'product.days.365': { ru: '365 дней', en: '365 days' },
  'product.telegramOptional': { ru: 'необязательно', en: 'optional' },
  'product.promo': { ru: 'Промокод', en: 'Promo code' },
  'product.installFree': { ru: 'Установить бесплатно', en: 'Install for free' },
  'product.buyFor': { ru: 'Купить за {price} ₽', en: 'Buy for {price} ₽' },
  'product.guarantee.replace': { ru: 'Гарантия замены при отзыве', en: 'Replacement guarantee if revoked' },
  'product.support.tg': { ru: 'Поддержка 24/7 в Telegram', en: '24/7 support on Telegram' },

  // Catalog
  'catalog.title': { ru: 'Каталог', en: 'Catalog' },
  'catalog.search': { ru: 'Поиск...', en: 'Search...' },
  'catalog.found': { ru: 'Найдено', en: 'Found' },
  'catalog.foundCount': { ru: 'Найдено: {count}', en: 'Found: {count}' },
  'catalog.nothing': { ru: 'Ничего не найдено', en: 'Nothing found' },
  'catalog.nothingDesc': { ru: 'Попробуйте изменить фильтры или поисковый запрос', en: 'Try adjusting the filters or your search query' },
  'catalog.sort.popular': { ru: 'Популярные', en: 'Popular' },
  'catalog.sort.priceUp': { ru: 'По цене ↑', en: 'Price ↑' },
  'catalog.sort.priceDown': { ru: 'По цене ↓', en: 'Price ↓' },
  'catalog.sort.rating': { ru: 'По рейтингу', en: 'By rating' },

  // Badges
  'badge.hot': { ru: 'Хит', en: 'Hot' },
  'badge.new': { ru: 'Новинка', en: 'New' },
  'badge.sale': { ru: 'Скидка', en: 'Sale' },
  'badge.popular': { ru: 'Популярное', en: 'Popular' },
  'badge.free': { ru: 'Бесплатно', en: 'Free' },

  // Home sections
  'home.popular': { ru: 'Популярное', en: 'Popular' },
  'home.wholeCatalog': { ru: 'Весь каталог', en: 'Browse all' },
  'home.why': { ru: 'Почему мы', en: 'Why us' },
  'home.why.instant': { ru: 'Мгновенно', en: 'Instant' },
  'home.why.instantDesc': { ru: 'Доставка за 30 секунд после оплаты', en: 'Delivered within 30 seconds of payment' },
  'home.why.warranty': { ru: 'Гарантия', en: 'Guarantee' },
  'home.why.warrantyDesc': { ru: 'Бесплатная замена при отзыве сертификата', en: 'Free replacement if the certificate is revoked' },
  'home.why.support': { ru: 'Поддержка', en: 'Support' },
  'home.why.supportDesc': { ru: 'Реальные люди отвечают 24/7', en: 'Real people answering 24/7' },
  'home.why.rating': { ru: '4.8 из 5', en: '4.8 out of 5' },
  'home.why.ratingDesc': { ru: 'По 5,000+ отзывам пользователей', en: 'Based on 5,000+ user reviews' },
  'home.reviews': { ru: 'Отзывы', en: 'Reviews' },
  'home.faq': { ru: 'Частые вопросы', en: 'FAQ' },
  'home.compat.badge': { ru: 'Совместимость', en: 'Compatibility' },
  'home.compat.title1': { ru: 'Работает на', en: 'Works on' },
  'home.compat.title2': { ru: 'всех устройствах', en: 'every device' },
  'home.compat.subtitle': { ru: 'Наши сертификаты поддерживают все актуальные версии iOS и iPadOS', en: 'Our certificates support all current iOS and iPadOS versions' },
  'home.compat.ipad': { ru: 'Air / Pro / Mini / базовый', en: 'Air / Pro / Mini / base' },
  'home.compat.ipod': { ru: '7-е поколение', en: '7th generation' },

  // CTA
  'cta.title': { ru: 'Готов', en: 'Ready to' },
  'cta.accent': { ru: 'попробовать', en: 'try it' },
  'cta.subtitle': { ru: 'Присоединяйся к 10,000+ пользователям.', en: 'Join 10,000+ users.' },
  'cta.button': { ru: 'Перейти в каталог', en: 'Browse catalog' },

  // Footer
  'footer.desc': { ru: 'Свобода установки приложений на iOS. Сертификаты разработчика с мгновенной доставкой.', en: 'Freedom to install apps on iOS. Developer certificates with instant delivery.' },
  'footer.catalog': { ru: 'Каталог', en: 'Catalog' },
  'footer.info': { ru: 'Информация', en: 'Information' },
  'footer.contacts': { ru: 'Контакты', en: 'Contacts' },
  'footer.rights': { ru: 'Все права защищены', en: 'All rights reserved' },
  'footer.buyers': { ru: 'Покупателям', en: 'For customers' },
  'footer.support': { ru: 'Поддержка', en: 'Support' },
  'footer.link.orderCheck': { ru: 'Проверка заказа', en: 'Track order' },
  'footer.link.howItWorks': { ru: 'Как это работает', en: 'How it works' },
  'footer.link.guide': { ru: 'Инструкция', en: 'Install guide' },
  'footer.link.guarantees': { ru: 'Гарантии и возвраты', en: 'Guarantees & refunds' },
  'footer.link.privacy': { ru: 'Конфиденциальность', en: 'Privacy policy' },
  'footer.link.about': { ru: 'О сервисе', en: 'About us' },
  'footer.link.contacts': { ru: 'Контакты', en: 'Contacts' },
  'footer.notOffer': { ru: 'Не является публичной офертой', en: 'Not a public offer' },

  // Cabinet
  'cabinet.title': { ru: 'Личный кабинет', en: 'My Account' },
  'cabinet.login': { ru: 'Войти', en: 'Sign In' },
  'cabinet.tab.profile': { ru: 'Мой профиль', en: 'My Profile' },
  'cabinet.tab.orders': { ru: 'Мои покупки', en: 'My Purchases' },
  'cabinet.tab.certs': { ru: 'Мои сертификаты', en: 'My Certificates' },
  'cabinet.tab.apps': { ru: 'Мои приложения', en: 'My Apps' },
  'cabinet.tab.devices': { ru: 'Мои устройства', en: 'My Devices' },
  'cabinet.tab.subs': { ru: 'Мои подписки', en: 'My Subscriptions' },
  'cabinet.tab.feedback': { ru: 'Обратная связь', en: 'Feedback' },
  'cabinet.logout': { ru: 'Выйти', en: 'Sign out' },
  'cabinet.login.title': { ru: 'Вход в личный кабинет', en: 'Sign in to your account' },
  'cabinet.login.subtitle': { ru: 'Для входа необходимо получить UDID вашего устройства', en: 'To sign in, you need to get your device UDID' },
  'cabinet.login.why': { ru: 'Зачем?', en: 'Why?' },
  'cabinet.login.whyText': { ru: 'UDID — уникальный номер вашего iPhone. Он нужен для регистрации сертификата разработчика Apple.', en: 'A UDID is your iPhone’s unique identifier. It’s required to register an Apple developer certificate.' },
  'cabinet.login.safe': { ru: 'Безопасно?', en: 'Is it safe?' },
  'cabinet.login.safeText': { ru: 'Да. Мы получаем только базовую техническую информацию об устройстве. Никаких личных данных.', en: 'Yes. We only receive basic technical device information. No personal data.' },
  'cabinet.login.getUdid': { ru: 'Получить UDID', en: 'Get UDID' },
  'cabinet.login.hint': { ru: 'Нажмите кнопку и следуйте инструкциям на экране вашего iPhone', en: 'Tap the button and follow the on-screen instructions on your iPhone' },
  'cabinet.user': { ru: 'Пользователь Bazzar', en: 'Bazzar User' },
  'cabinet.copy': { ru: 'Копировать', en: 'Copy' },
  'cabinet.copied': { ru: 'Скопировано', en: 'Copied' },
  'cabinet.stat.purchases': { ru: 'Покупок', en: 'Purchases' },
  'cabinet.stat.certs': { ru: 'Сертификатов', en: 'Certificates' },
  'cabinet.stat.apps': { ru: 'Приложений', en: 'Apps' },
  'cabinet.stat.status': { ru: 'Статус', en: 'Status' },
  'cabinet.stat.statusNew': { ru: 'Новичок', en: 'Newcomer' },
  'cabinet.stat.regDate': { ru: 'Дата регистрации', en: 'Registered' },
  'cabinet.stat.today': { ru: 'Сегодня', en: 'Today' },
  'cabinet.order.delivered': { ru: 'Доставлен', en: 'Delivered' },
  'cabinet.order.num': { ru: 'Заказ #{id}', en: 'Order #{id}' },
  'cabinet.order.vip': { ru: 'VIP Сертификат (365 дней)', en: 'VIP Certificate (365 days)' },
  'cabinet.order.vipSub': { ru: 'Enterprise · Apple Developer', en: 'Enterprise · Apple Developer' },
  'cabinet.order.esignSub': { ru: 'Подписчик приложений · iOS', en: 'App signer · iOS' },
  'cabinet.cert.active': { ru: 'Активен', en: 'Active' },
  'cabinet.cert.daysLeft': { ru: 'Осталось {left} из {total} дней', en: '{left} of {total} days left' },
  'cabinet.cert.plan': { ru: 'Тариф', en: 'Plan' },
  'cabinet.cert.planValue': { ru: 'VIP (365 дн)', en: 'VIP (365 days)' },
  'cabinet.cert.activated': { ru: 'Активирован', en: 'Activated' },
  'cabinet.cert.expires': { ru: 'Истекает', en: 'Expires' },
  'cabinet.cert.replacements': { ru: 'Замены', en: 'Replacements' },
  'cabinet.cert.replValue': { ru: '0 из ∞', en: '0 of ∞' },
  'cabinet.cert.guide': { ru: 'Инструкция', en: 'Guide' },
  'cabinet.cert.guideTitle': { ru: 'Инструкция по активации сертификата', en: 'Certificate activation guide' },
  'cabinet.cert.step1': { ru: 'Откройте Safari на вашем iPhone и перейдите по ссылке, которую мы отправили в Telegram', en: 'Open Safari on your iPhone and follow the link we sent you on Telegram' },
  'cabinet.cert.step2': { ru: 'Нажмите «Разрешить» при запросе на скачивание профиля', en: 'Tap “Allow” when asked to download the profile' },
  'cabinet.cert.step3': { ru: 'Перейдите в Настройки → Загруженный профиль → Установить', en: 'Go to Settings → Profile Downloaded → Install' },
  'cabinet.cert.step4': { ru: 'Введите код-пароль устройства и подтвердите установку', en: 'Enter your device passcode and confirm the installation' },
  'cabinet.cert.step5': { ru: 'Перейдите в Настройки → Основные → VPN и управление устройством', en: 'Go to Settings → General → VPN & Device Management' },
  'cabinet.cert.step6': { ru: 'Нажмите на сертификат Enterprise и выберите «Доверять»', en: 'Tap the Enterprise certificate and choose “Trust”' },
  'cabinet.cert.step7': { ru: 'Готово! Теперь можете устанавливать приложения через ESign / GBox', en: 'Done! You can now install apps via ESign / GBox' },
  'cabinet.cert.guideWarn': { ru: 'Если при установке появится ошибка — напишите нам в поддержку, поможем за 5 минут!', en: 'If you get an error during installation — contact support and we’ll fix it in 5 minutes!' },
  'cabinet.cert.dashDesc': { ru: 'Статус сертификатов, UDID устройств, сроки действия', en: 'Certificate status, device UDIDs, expiration dates' },
  'cabinet.apps.signer': { ru: 'Подписчик · v5.0.1 · 28 MB', en: 'Signer · v5.0.1 · 28 MB' },
  'cabinet.apps.installed': { ru: 'Установлен', en: 'Installed' },
  'cabinet.apps.installedOn': { ru: 'Установлен: {date}', en: 'Installed: {date}' },
  'cabinet.apps.updates': { ru: 'Обновлений: {count}', en: 'Updates: {count}' },
  'cabinet.apps.all': { ru: 'Все приложения', en: 'All apps' },
  'cabinet.devices.title': { ru: 'Мои устройства', en: 'My Devices' },
  'cabinet.devices.linked': { ru: 'привязано', en: 'linked' },
  'cabinet.devices.add': { ru: 'Добавить устройство', en: 'Add device' },
  'cabinet.devices.name': { ru: 'Название', en: 'Name' },
  'cabinet.devices.namePh': { ru: 'Мой iPhone', en: 'My iPhone' },
  'cabinet.devices.udid': { ru: 'UDID устройства *', en: 'Device UDID *' },
  'cabinet.devices.addBtn': { ru: 'Добавить', en: 'Add' },
  'cabinet.devices.cancel': { ru: 'Отмена', en: 'Cancel' },
  'cabinet.devices.unknownUdid': { ru: 'Не знаете свой UDID?', en: 'Don’t know your UDID?' },
  'cabinet.devices.learnHow': { ru: 'Узнайте как получить', en: 'Learn how to get it' },
  'cabinet.devices.active': { ru: 'Активно', en: 'Active' },
  'cabinet.devices.pending': { ru: 'Ожидает', en: 'Pending' },
  'cabinet.devices.addedOn': { ru: 'Добавлено: {date}', en: 'Added: {date}' },
  'cabinet.devices.certsCount': { ru: 'Сертификатов: {count}', en: 'Certificates: {count}' },
  'cabinet.devices.empty': { ru: 'Нет привязанных устройств', en: 'No linked devices' },
  'cabinet.devices.emptyDesc': { ru: 'Добавьте своё первое устройство, чтобы оформить сертификат', en: 'Add your first device to get a certificate' },
  'cabinet.devices.removeTitle': { ru: 'Удалить устройство', en: 'Remove device' },
  'cabinet.devices.defaultName': { ru: 'Устройство {num}', en: 'Device {num}' },
  'cabinet.devices.autoModel': { ru: 'Определится автоматически', en: 'Detected automatically' },
  'cabinet.subs.title': { ru: 'Мои подписки', en: 'My Subscriptions' },
  'cabinet.subs.active': { ru: '{count} активная подписка', en: '{count} active subscription' },
  'cabinet.subs.catalog': { ru: 'Каталог подписок', en: 'Subscription catalog' },
  'cabinet.subs.rc': { ru: 'Клуб Романтики MOD', en: 'Romance Club MOD' },
  'cabinet.subs.rcSub': { ru: 'Romance Club • Premium версия', en: 'Romance Club • Premium version' },
  'cabinet.subs.activeTag': { ru: 'Активна', en: 'Active' },
  'cabinet.subs.status': { ru: 'Статус подписки', en: 'Subscription status' },
  'cabinet.subs.plan': { ru: 'Тариф', en: 'Plan' },
  'cabinet.subs.activeUntil': { ru: 'Активна до', en: 'Active until' },
  'cabinet.subs.autoRenew': { ru: 'Автопродление', en: 'Auto-renewal' },
  'cabinet.subs.autoRenewOn': { ru: 'Включено', en: 'On' },
  'cabinet.subs.modVersion': { ru: 'Версия мода', en: 'Mod version' },
  'cabinet.subs.perks': { ru: 'Что даёт подписка', en: 'What you get' },
  'cabinet.subs.perk1': { ru: 'Безлимитные алмазы', en: 'Unlimited diamonds' },
  'cabinet.subs.perk2': { ru: 'Бесконечные чашки чая', en: 'Endless cups of tea' },
  'cabinet.subs.perk3': { ru: 'Все премиум-выборы', en: 'All premium choices' },
  'cabinet.subs.perk4': { ru: 'Вся одежда бесплатно', en: 'All outfits free' },
  'cabinet.subs.perk5': { ru: 'Максимальные отношения', en: 'Max relationships' },
  'cabinet.subs.perk6': { ru: 'Все сезоны открыты', en: 'All seasons unlocked' },
  'cabinet.subs.progress': { ru: 'Прогресс историй', en: 'Story progress' },
  'cabinet.subs.season': { ru: 'Сезон {n}', en: 'Season {n}' },
  'cabinet.subs.completed': { ru: 'Пройдено', en: 'Completed' },
  'cabinet.subs.story1': { ru: 'Дракула: История любви', en: 'Dracula: A Love Story' },
  'cabinet.subs.story2': { ru: 'Легенда ивы', en: 'Legend of the Willow' },
  'cabinet.subs.story3': { ru: 'Королева за 30 дней', en: 'Queen in 30 Days' },
  'cabinet.subs.story4': { ru: 'Соседи', en: 'Neighbors' },
  'cabinet.subs.device': { ru: 'Привязанное устройство', en: 'Linked device' },
  'cabinet.subs.change': { ru: 'Сменить', en: 'Change' },
  'cabinet.subs.install': { ru: 'Гайд по установке', en: 'Installation guide' },
  'cabinet.subs.installStep1': { ru: 'Убедитесь, что сертификат установлен и активен', en: 'Make sure the certificate is installed and active' },
  'cabinet.subs.installStep2': { ru: 'Скачайте IPA-файл из личного кабинета', en: 'Download the IPA file from your account' },
  'cabinet.subs.installStep3': { ru: 'Откройте файл через ESign или Scarlet', en: 'Open the file with ESign or Scarlet' },
  'cabinet.subs.installStep4': { ru: 'Подпишите приложение вашим сертификатом', en: 'Sign the app with your certificate' },
  'cabinet.subs.installStep5': { ru: 'Запустите и наслаждайтесь полной версией!', en: 'Launch and enjoy the full version!' },
  'cabinet.subs.transfer': { ru: 'Перенос прогресса', en: 'Progress transfer' },
  'cabinet.subs.transferText': { ru: 'При переходе на новое устройство ваш прогресс можно перенести. Для этого:', en: 'When switching to a new device, your progress can be transferred. Here’s how:' },
  'cabinet.subs.transfer1': { ru: 'Создайте бэкап в настройках приложения (Настройки → Сохранить прогресс)', en: 'Create a backup in the app settings (Settings → Save progress)' },
  'cabinet.subs.transfer2': { ru: 'Привяжите аккаунт к Facebook или Apple ID', en: 'Link your account to Facebook or Apple ID' },
  'cabinet.subs.transfer3': { ru: 'На новом устройстве установите мод и войдите в тот же аккаунт', en: 'On the new device, install the mod and sign in to the same account' },
  'cabinet.subs.transfer4': { ru: 'Прогресс восстановится автоматически', en: 'Your progress will be restored automatically' },
  'cabinet.subs.transferHelp': { ru: 'При проблемах с переносом — напишите нам в', en: 'Having trouble with the transfer? Reach out via' },
  'cabinet.subs.transferHelpLink': { ru: 'обратную связь', en: 'feedback' },
  'cabinet.subs.download': { ru: 'Скачать IPA', en: 'Download IPA' },
  'cabinet.subs.guide': { ru: 'Инструкция', en: 'Guide' },
  'cabinet.subs.openGgsel': { ru: 'Открыть на GGSel', en: 'Open on GGSel' },
  'cabinet.feedback.title': { ru: 'Обратная связь', en: 'Feedback' },
  'cabinet.feedback.type': { ru: 'Тип обращения', en: 'Request type' },
  'cabinet.feedback.suggestion': { ru: 'Предложение', en: 'Suggestion' },
  'cabinet.feedback.problem': { ru: 'Проблема', en: 'Problem' },
  'cabinet.feedback.question': { ru: 'Вопрос', en: 'Question' },
  'cabinet.feedback.message': { ru: 'Сообщение', en: 'Message' },
  'cabinet.feedback.placeholder': { ru: 'Опишите вашу проблему или предложение...', en: 'Describe your issue or suggestion...' },
  'cabinet.feedback.send': { ru: 'Отправить', en: 'Send' },
  'cabinet.feedback.sent': { ru: '✓ Сообщение отправлено! Мы ответим в ближайшее время.', en: '✓ Message sent! We’ll get back to you shortly.' },
  'cabinet.toast.udidCopied': { ru: 'UDID скопирован!', en: 'UDID copied!' },
  'cabinet.toast.udidCopiedFull': { ru: 'UDID скопирован в буфер обмена', en: 'UDID copied to clipboard' },
  'cabinet.toast.deviceAdded': { ru: 'Устройство добавлено!', en: 'Device added!' },
  'cabinet.toast.deviceRemoved': { ru: 'Устройство удалено', en: 'Device removed' },
  'cabinet.toast.msgSent': { ru: 'Сообщение отправлено!', en: 'Message sent!' },
  'cabinet.toast.pickDevice': { ru: 'Выберите другое устройство', en: 'Choose another device' },

  // OrderCheck
  'order.title': { ru: 'Проверка заказа', en: 'Track your order' },
  'order.subtitle': { ru: 'Введите номер заказа с GGsel или Digiseller для проверки статуса', en: 'Enter your GGsel or Digiseller order number to check its status' },
  'order.label': { ru: 'Номер заказа', en: 'Order number' },
  'order.placeholder': { ru: 'Например: 12345', en: 'E.g. 12345' },
  'order.check': { ru: 'Проверить', en: 'Check' },
  'order.platforms': { ru: 'Поддерживаемые площадки:', en: 'Supported platforms:' },
  'order.checking': { ru: 'Проверяем заказ...', en: 'Checking your order...' },
  'order.notFound': { ru: 'Заказ не найден', en: 'Order not found' },
  'order.notFoundDesc': { ru: 'Проверьте номер заказа и попробуйте ещё раз. Если проблема сохраняется — обратитесь в поддержку.', en: 'Double-check the order number and try again. If the problem persists, contact support.' },
  'order.status.pending': { ru: 'Ожидает оплаты', en: 'Awaiting payment' },
  'order.status.paid': { ru: 'Оплачен, обрабатывается', en: 'Paid, processing' },
  'order.status.delivered': { ru: 'Доставлен', en: 'Delivered' },
  'order.status.error': { ru: 'Ошибка', en: 'Error' },
  'order.field.id': { ru: 'Номер заказа', en: 'Order number' },
  'order.field.product': { ru: 'Товар', en: 'Product' },
  'order.field.date': { ru: 'Дата', en: 'Date' },
  'order.field.email': { ru: 'Email', en: 'Email' },
  'order.code': { ru: 'Код активации', en: 'Activation code' },
  'order.done': { ru: 'Готово', en: 'Done' },
  'order.step.created': { ru: 'Создан', en: 'Created' },
  'order.step.paid': { ru: 'Оплачен', en: 'Paid' },
  'order.step.delivered': { ru: 'Доставлен', en: 'Delivered' },
  'order.demo': { ru: 'Тестовые номера:', en: 'Demo order numbers:' },
  'order.toCatalog': { ru: 'В каталог', en: 'To catalog' },
  'order.toast.copied': { ru: 'Код скопирован', en: 'Code copied' },
  'order.demo.vip': { ru: 'VIP Сертификат (365 дней)', en: 'VIP Certificate (365 days)' },
  'order.demo.standard': { ru: 'Стандартный Сертификат (180 дней)', en: 'Standard Certificate (180 days)' },
  'order.demo.basic': { ru: 'Базовый Сертификат (40 дней)', en: 'Basic Certificate (40 days)' },

  // HowItWorks
  'how.badge': { ru: 'Просто и быстро', en: 'Quick and easy' },
  'how.title': { ru: 'Как это работает', en: 'How it works' },
  'how.subtitle': { ru: 'Три простых шага — и вы сможете устанавливать любые приложения на iPhone', en: 'Three simple steps — and you can install any app on your iPhone' },
  'how.s1.title': { ru: 'Получите UDID', en: 'Get your UDID' },
  'how.s1.desc': { ru: 'Нажмите кнопку «Получить UDID» — откроется страница, которая автоматически определит уникальный номер вашего iPhone или iPad. Это занимает 10 секунд.', en: 'Tap “Get UDID” — a page will open that automatically detects the unique identifier of your iPhone or iPad. It takes 10 seconds.' },
  'how.s1.d1': { ru: 'Работает на любом iPhone (iOS 15+)', en: 'Works on any iPhone (iOS 15+)' },
  'how.s1.d2': { ru: 'Никаких личных данных не собирается', en: 'No personal data is collected' },
  'how.s1.d3': { ru: 'UDID — это просто серийный номер устройства', en: 'A UDID is just your device’s serial number' },
  'how.s2.title': { ru: 'Купите сертификат', en: 'Buy a certificate' },
  'how.s2.desc': { ru: 'Выберите подходящий тариф в каталоге. После оплаты мы регистрируем ваш UDID в сертификате Apple Developer и отправляем данные на email.', en: 'Pick a plan in the catalog. After payment, we register your UDID with an Apple Developer certificate and email you the details.' },
  'how.s2.d1': { ru: 'Мгновенная доставка на email', en: 'Instant email delivery' },
  'how.s2.d2': { ru: 'Оплата через GGSel или Digiseller', en: 'Pay via GGSel or Digiseller' },
  'how.s2.d3': { ru: 'Гарантия замены при отзыве сертификата', en: 'Replacement guarantee if revoked' },
  'how.s3.title': { ru: 'Установите приложения', en: 'Install apps' },
  'how.s3.desc': { ru: 'Скачайте любимые приложения через ESign, GBox или Scarlet. Сертификат даёт возможность устанавливать любые IPA-файлы без джейлбрейка.', en: 'Download your favorite apps via ESign, GBox, or Scarlet. The certificate lets you install any IPA file — no jailbreak needed.' },
  'how.s3.d1': { ru: 'Работает без джейлбрейка', en: 'No jailbreak required' },
  'how.s3.d2': { ru: 'Поддержка ESign, GBox, Scarlet, Feather', en: 'Supports ESign, GBox, Scarlet, Feather' },
  'how.s3.d3': { ru: 'Устанавливайте любые IPA-файлы', en: 'Install any IPA files' },
  'how.cta': { ru: 'Выбрать сертификат', en: 'Choose a certificate' },

  // InstallGuide
  'guide.title': { ru: 'Инструкция по установке', en: 'Installation guide' },
  'guide.subtitle': { ru: 'Пошаговая инструкция от получения UDID до установки приложений', en: 'A step-by-step guide from getting your UDID to installing apps' },
  'guide.s1.title': { ru: 'Шаг 1: Получение UDID', en: 'Step 1: Get your UDID' },
  'guide.s1.1': { ru: 'Откройте Safari на вашем iPhone', en: 'Open Safari on your iPhone' },
  'guide.s1.2': { ru: 'Перейдите на наш сайт и нажмите «Получить UDID»', en: 'Go to our website and tap “Get UDID”' },
  'guide.s1.3': { ru: 'Нажмите «Разрешить» на запрос установки профиля', en: 'Tap “Allow” when prompted to install the profile' },
  'guide.s1.4': { ru: 'Перейдите в Настройки → Загруженный профиль', en: 'Go to Settings → Profile Downloaded' },
  'guide.s1.5': { ru: 'Нажмите «Установить» и введите код-пароль устройства', en: 'Tap “Install” and enter your device passcode' },
  'guide.s1.6': { ru: 'UDID будет автоматически определён и отправлен', en: 'Your UDID will be detected and sent automatically' },
  'guide.s2.title': { ru: 'Шаг 2: Покупка сертификата', en: 'Step 2: Buy a certificate' },
  'guide.s2.1': { ru: 'Выберите тариф в каталоге (Базовый / Стандартный / VIP)', en: 'Choose a plan in the catalog (Basic / Standard / VIP)' },
  'guide.s2.2': { ru: 'Нажмите «Купить» и укажите email для доставки', en: 'Tap “Buy” and enter your delivery email' },
  'guide.s2.3': { ru: 'Оплатите заказ через GGSel или Digiseller', en: 'Pay for the order via GGSel or Digiseller' },
  'guide.s2.4': { ru: 'Данные сертификата придут на email в течение 5 минут', en: 'Certificate details will arrive by email within 5 minutes' },
  'guide.s2.5': { ru: 'Проверьте статус в разделе «Проверка заказа»', en: 'Check the status on the “Track order” page' },
  'guide.s3.title': { ru: 'Шаг 3: Установка приложения-подписчика', en: 'Step 3: Install a signing app' },
  'guide.s3.1': { ru: 'Скачайте IPA-файл нужного подписчика (ESign, GBox, Scarlet, Feather)', en: 'Download the IPA of your chosen signer (ESign, GBox, Scarlet, Feather)' },
  'guide.s3.2': { ru: 'Откройте ссылку из email на вашем iPhone в Safari', en: 'Open the link from the email in Safari on your iPhone' },
  'guide.s3.3': { ru: 'Нажмите «Установить» — приложение появится на рабочем столе', en: 'Tap “Install” — the app will appear on your Home Screen' },
  'guide.s3.4': { ru: 'Если появится «Ненадёжный разработчик» — перейдите в Настройки → Основные → VPN и управление устройством', en: 'If you see “Untrusted Developer” — go to Settings → General → VPN & Device Management' },
  'guide.s3.5': { ru: 'Нажмите на сертификат и выберите «Доверять»', en: 'Tap the certificate and choose “Trust”' },
  'guide.s4.title': { ru: 'Шаг 4: Установка IPA через подписчик', en: 'Step 4: Install IPAs via the signer' },
  'guide.s4.1': { ru: 'Откройте установленный подписчик (ESign / GBox)', en: 'Open the installed signer (ESign / GBox)' },
  'guide.s4.2': { ru: 'Импортируйте нужный IPA-файл (скачайте или перенесите через AirDrop)', en: 'Import the IPA file you need (download it or send it via AirDrop)' },
  'guide.s4.3': { ru: 'Нажмите «Подписать и установить»', en: 'Tap “Sign & Install”' },
  'guide.s4.4': { ru: 'Дождитесь завершения установки', en: 'Wait for the installation to finish' },
  'guide.s4.5': { ru: 'Готово! Приложение появится на рабочем столе', en: 'Done! The app will appear on your Home Screen' },
  'guide.tips': { ru: 'Полезные советы', en: 'Handy tips' },
  'guide.tip1': { ru: 'Все действия выполняются через Safari — другие браузеры не подходят', en: 'Everything must be done in Safari — other browsers won’t work' },
  'guide.tip2': { ru: 'Если сертификат отозван Apple — мы заменим его бесплатно', en: 'If Apple revokes the certificate — we’ll replace it for free' },
  'guide.tip3': { ru: 'Поддерживаются все iPhone и iPad с iOS 15 и выше', en: 'All iPhones and iPads running iOS 15 or later are supported' },
  'guide.cta': { ru: 'Купить сертификат', en: 'Buy a certificate' },

  // Guarantees
  'guarantees.title': { ru: 'Гарантии и возвраты', en: 'Guarantees & refunds' },
  'guarantees.subtitle': { ru: 'Мы гарантируем качество каждого сертификата и поддержку на всём сроке действия', en: 'We stand behind every certificate and support you for its entire lifetime' },
  'guarantees.g1.title': { ru: 'Бесплатная замена', en: 'Free replacement' },
  'guarantees.g1.desc': { ru: 'Если Apple отзовёт сертификат — мы заменим его бесплатно в течение всего оплаченного периода. Без дополнительных условий.', en: 'If Apple revokes your certificate, we’ll replace it free of charge for the entire paid period. No strings attached.' },
  'guarantees.g2.title': { ru: 'Быстрая обработка', en: 'Fast turnaround' },
  'guarantees.g2.desc': { ru: 'Замена сертификата производится в течение 15-60 минут после обращения. В 90% случаев — моментально.', en: 'Replacements are processed within 15–60 minutes of your request. In 90% of cases — instantly.' },
  'guarantees.g3.title': { ru: 'Полная поддержка', en: 'Full support' },
  'guarantees.g3.desc': { ru: 'Помогаем с установкой, настройкой и решением любых проблем. Поддержка 24/7 в Telegram.', en: 'We help with installation, setup, and any issues along the way. 24/7 support on Telegram.' },
  'guarantees.g4.title': { ru: 'Живые люди', en: 'Real humans' },
  'guarantees.g4.desc': { ru: 'Отвечаем реальные специалисты, а не боты. Время ответа — до 15 минут в рабочее время.', en: 'Real specialists answer you, not bots. Response time — under 15 minutes during business hours.' },
  'guarantees.terms': { ru: 'Условия замены и возврата', en: 'Replacement & refund terms' },
  'guarantees.case1': { ru: 'Сертификат отозван Apple до окончания срока', en: 'Certificate revoked by Apple before expiry' },
  'guarantees.case2': { ru: 'Сертификат не работает после установки', en: 'Certificate doesn’t work after installation' },
  'guarantees.case3': { ru: 'Данные не доставлены в течение 24 часов после оплаты', en: 'Details not delivered within 24 hours of payment' },
  'guarantees.case4': { ru: 'Технические проблемы по нашей вине', en: 'Technical issues caused by us' },
  'guarantees.case5': { ru: 'Прошло более 30 дней с момента покупки (для возврата средств)', en: 'More than 30 days since purchase (for refunds)' },
  'guarantees.case6': { ru: 'Пользователь сам удалил сертификат', en: 'Certificate deleted by the user' },
  'guarantees.case7': { ru: 'Устройство не поддерживается (ниже iOS 15)', en: 'Unsupported device (below iOS 15)' },
  'guarantees.ctaText': { ru: 'Остались вопросы? Напишите нам в Telegram — ответим за 15 минут.', en: 'Still have questions? Message us on Telegram — we reply within 15 minutes.' },

  // Privacy
  'privacy.title': { ru: 'Политика конфиденциальности', en: 'Privacy Policy' },
  'privacy.subtitle': { ru: 'Мы серьёзно относимся к защите ваших данных', en: 'We take the protection of your data seriously' },
  'privacy.s1.title': { ru: '1. Какие данные мы собираем', en: '1. What data we collect' },
  'privacy.s1.1': { ru: 'UDID устройства — уникальный идентификатор вашего iPhone/iPad, необходимый для регистрации сертификата разработчика Apple.', en: 'Device UDID — the unique identifier of your iPhone/iPad, required to register an Apple developer certificate.' },
  'privacy.s1.2': { ru: 'Email — для доставки данных сертификата и связи по заказу.', en: 'Email — to deliver certificate details and communicate about your order.' },
  'privacy.s1.3': { ru: 'Номер заказа — для отслеживания статуса покупки.', en: 'Order number — to track your purchase status.' },
  'privacy.s2.title': { ru: '2. Как мы используем данные', en: '2. How we use your data' },
  'privacy.s2.1': { ru: 'UDID используется исключительно для регистрации вашего устройства в Apple Developer Program.', en: 'Your UDID is used solely to register your device in the Apple Developer Program.' },
  'privacy.s2.2': { ru: 'Email используется для отправки данных сертификата и уведомлений о статусе заказа.', en: 'Your email is used to send certificate details and order status updates.' },
  'privacy.s2.3': { ru: 'Мы не используем ваши данные для рекламы и не продаём их третьим лицам.', en: 'We never use your data for advertising or sell it to third parties.' },
  'privacy.s3.title': { ru: '3. Хранение и защита', en: '3. Storage & security' },
  'privacy.s3.1': { ru: 'Данные хранятся на защищённых серверах с шифрованием.', en: 'Data is stored on secure, encrypted servers.' },
  'privacy.s3.2': { ru: 'Доступ к персональным данным ограничен и доступен только авторизованным сотрудникам.', en: 'Access to personal data is restricted to authorized staff only.' },
  'privacy.s3.3': { ru: 'Мы используем SSL-шифрование для всех соединений.', en: 'All connections are protected with SSL encryption.' },
  'privacy.s3.4': { ru: 'Данные хранятся не дольше, чем это необходимо для оказания услуг.', en: 'Data is kept no longer than necessary to provide our services.' },
  'privacy.s4.title': { ru: '4. Передача данных', en: '4. Data sharing' },
  'privacy.s4.1': { ru: 'UDID передаётся в Apple для регистрации сертификата — это обязательное требование Apple Developer Program.', en: 'Your UDID is shared with Apple to register the certificate — a mandatory requirement of the Apple Developer Program.' },
  'privacy.s4.2': { ru: 'Платёжные данные обрабатываются платёжными системами (GGSel, Digiseller) и не хранятся на наших серверах.', en: 'Payment data is processed by payment providers (GGSel, Digiseller) and is never stored on our servers.' },
  'privacy.s4.3': { ru: 'Мы не передаём ваши данные третьим лицам, кроме случаев, предусмотренных законодательством.', en: 'We do not share your data with third parties except where required by law.' },
  'privacy.s5.title': { ru: '5. Ваши права', en: '5. Your rights' },
  'privacy.s5.1': { ru: 'Вы можете запросить удаление всех ваших данных, обратившись в поддержку.', en: 'You may request deletion of all your data by contacting support.' },
  'privacy.s5.2': { ru: 'Вы можете запросить информацию о хранимых данных.', en: 'You may request information about the data we hold.' },
  'privacy.s5.3': { ru: 'Вы можете отказаться от получения уведомлений по email.', en: 'You may opt out of email notifications.' },
  'privacy.s6.title': { ru: '6. Изменения политики', en: '6. Policy updates' },
  'privacy.s6.1': { ru: 'Мы оставляем за собой право обновлять данную политику.', en: 'We reserve the right to update this policy.' },
  'privacy.s6.2': { ru: 'Об изменениях мы уведомим пользователей через сайт.', en: 'Users will be notified of changes via the website.' },
  'privacy.s6.3': { ru: 'Последнее обновление: июль 2026.', en: 'Last updated: July 2026.' },
  'privacy.home': { ru: 'На главную', en: 'Back home' },

  // CertDashboard
  'dash.subtitle': { ru: 'Статус ваших сертификатов и устройств', en: 'Status of your certificates and devices' },
  'dash.stat.active': { ru: 'Активные', en: 'Active' },
  'dash.stat.expiring': { ru: 'Истекающие', en: 'Expiring' },
  'dash.stat.devices': { ru: 'Устройства', en: 'Devices' },
  'dash.stat.allOk': { ru: 'Все серты работают', en: 'All certs working' },
  'dash.status.active': { ru: 'Активен', en: 'Active' },
  'dash.status.expiring': { ru: 'Истекает', en: 'Expiring' },
  'dash.status.revoked': { ru: 'Отозван', en: 'Revoked' },
  'dash.device': { ru: 'Устройство', en: 'Device' },
  'dash.validity': { ru: 'Срок действия', en: 'Validity' },
  'dash.profiles': { ru: 'Профили / Приложения', en: 'Profiles / Apps' },
  'dash.daysLeft': { ru: 'осталось', en: 'left' },
  'dash.appsInstalled': { ru: 'приложений установлено', en: 'apps installed' },
  'dash.renew': { ru: 'Продлить', en: 'Renew' },
  'dash.copyId': { ru: 'Скопировать ID', en: 'Copy ID' },
  'dash.ctaTitle': { ru: 'Нужен ещё один сертификат?', en: 'Need another certificate?' },
  'dash.ctaText': { ru: 'Добавьте новое устройство или обновите план', en: 'Add a new device or upgrade your plan' },
  'dash.cta': { ru: 'Каталог сертификатов', en: 'Certificate catalog' },
  'dash.toast.copied': { ru: '{label} скопирован', en: '{label} copied' },
  'dash.certId': { ru: 'ID сертификата', en: 'Certificate ID' },
  'dash.cert.vip': { ru: 'VIP Сертификат', en: 'VIP Certificate' },
  'dash.cert.standard': { ru: 'Стандартный Сертификат', en: 'Standard Certificate' },

  // NotFound
  'notfound.title': { ru: 'Страница не найдена', en: 'Page not found' },
  'notfound.desc': { ru: 'Возможно, она была удалена, перемещена или вы ошиблись в адресе', en: 'It may have been deleted, moved, or the address might be wrong' },
  'notfound.home': { ru: 'На главную', en: 'Back home' },
  'notfound.catalog': { ru: 'В каталог', en: 'To catalog' },

  // Chat
  'chat.title': { ru: 'Поддержка', en: 'Support' },
  'chat.placeholder': { ru: 'Введите сообщение...', en: 'Type a message...' },
  'chat.inputPlaceholder': { ru: 'Написать...', en: 'Write...' },
  'chat.greeting': { ru: 'Привет! 👋 Чем могу помочь?', en: 'Hi! 👋 How can I help?' },
  'chat.online': { ru: 'Онлайн', en: 'Online' },
  'chat.openAria': { ru: 'Открыть чат поддержки', en: 'Open support chat' },
  'chat.attachTitle': { ru: 'Прикрепить фото / скриншот', en: 'Attach a photo / screenshot' },
  'chat.imageAlt': { ru: 'Вложение', en: 'Attachment' },
  'chat.mock1': { ru: 'Привет! Чем можем помочь?', en: 'Hi there! How can we help?' },
  'chat.mock2': { ru: 'Мы онлайн и готовы ответить на любые вопросы о сертификатах и приложениях.', en: 'We’re online and ready to answer any questions about certificates and apps.' },
  'chat.replyScreenshot': { ru: 'Спасибо за скриншот! Сейчас посмотрим.', en: 'Thanks for the screenshot! Taking a look now.' },
  'chat.replyMessage': { ru: 'Спасибо за сообщение! Оператор скоро подключится.', en: 'Thanks for your message! An agent will join shortly.' },
  'chat.replyFallback': { ru: 'Спасибо! Оператор скоро ответит.', en: 'Thanks! An agent will reply shortly.' },
  'chat.q1': { ru: 'Как купить?', en: 'How to buy?' },
  'chat.q2': { ru: 'Проблема с сертификатом', en: 'Certificate issue' },
  'chat.q3': { ru: 'Цены', en: 'Pricing' },
  'chat.q4': { ru: 'Возврат', en: 'Refunds' },
  'chat.a1': { ru: 'Выберите товар в каталоге, укажите Telegram (необязательно), нажмите «Купить» — доставка мгновенная!', en: 'Pick a product in the catalog, add your Telegram (optional), hit “Buy” — delivery is instant!' },
  'chat.a2': { ru: 'Опишите проблему — сертификат отозван, не устанавливается? Мы заменим бесплатно!', en: 'Describe the issue — revoked certificate, installation trouble? We’ll replace it for free!' },
  'chat.a3': { ru: 'Базовый — от 390₽, Стандартный — 890₽, VIP — 1490₽. Приложения от 0₽. Скидки по промокодам!', en: 'Basic — from ₽390, Standard — ₽890, VIP — ₽1,490. Apps from ₽0. Discounts with promo codes!' },
  'chat.a4': { ru: 'Если сертификат отозван — бесплатная замена. Возврат в течение 24ч если не использовали.', en: 'Revoked certificate? Free replacement. Refund within 24h if unused.' },

  // Cookie banner
  'cookie.title': { ru: 'Мы используем cookies', en: 'We use cookies' },
  'cookie.text': { ru: 'Для улучшения работы сайта и персонализации. Продолжая использовать сайт, вы соглашаетесь с', en: 'To improve the site and personalize your experience. By continuing to use the site, you agree to our' },
  'cookie.link': { ru: 'политикой конфиденциальности', en: 'privacy policy' },
  'cookie.accept': { ru: 'Принять', en: 'Accept' },

  // Legal modal
  'legal.terms.title': { ru: 'Пользовательское соглашение', en: 'Terms of Service' },
  'legal.terms.p1': { ru: 'Настоящее Пользовательское соглашение регламентирует отношения между сервисом BAZZAR CERTS и пользователем.', en: 'These Terms of Service govern the relationship between the BAZZAR CERTS service and the user.' },
  'legal.terms.p2': { ru: 'Сервис предоставляет услуги по выдаче сертификатов разработчика Apple и доступу к подписанию приложений для личного использования и тестирования. Покупая сертификат, вы соглашаетесь с правилами использования.', en: 'The service provides Apple developer certificates and app-signing access for personal use and testing. By purchasing a certificate, you agree to the rules of use.' },
  'legal.terms.h1': { ru: '1. Обязанности пользователя', en: '1. User responsibilities' },
  'legal.terms.p3': { ru: 'Запрещено использовать сертификат для распространения вредоносного ПО, нарушения авторских прав, мошенничества или обхода встроенных механизмов безопасности iOS.', en: 'You may not use the certificate to distribute malware, infringe copyright, commit fraud, or bypass iOS built-in security mechanisms.' },
  'legal.terms.h2': { ru: '2. Аннулирование и возврат', en: '2. Revocation & refunds' },
  'legal.terms.p4': { ru: 'В случае нарушения правил Apple (отзыв сертификата за неправомерные действия) или наших внутренних правил, сертификат может быть аннулирован без возврата средств. Возврат средств осуществляется только в случае невозможности первоначального предоставления услуги по нашей вине.', en: 'If Apple’s rules are violated (certificate revoked for misuse) or our internal rules are breached, the certificate may be cancelled without a refund. Refunds are issued only if we fail to deliver the service initially due to our fault.' },
  'legal.terms.h3': { ru: '3. Гарантия', en: '3. Guarantee' },
  'legal.terms.p5': { ru: 'Гарантия на бесплатную замену сертификата (в случае его досрочного отзыва со стороны Apple без вины пользователя) действует в течение срока, указанного при покупке товара.', en: 'The free replacement guarantee (in case of early revocation by Apple through no fault of the user) is valid for the period specified at purchase.' },
  'legal.privacy.title': { ru: 'Политика конфиденциальности', en: 'Privacy Policy' },
  'legal.privacy.p1': { ru: 'Мы заботимся о вашей безопасности и конфиденциальности. BAZZAR CERTS собирает минимально необходимый объем данных для предоставления услуг.', en: 'We care about your security and privacy. BAZZAR CERTS collects the minimum data needed to provide our services.' },
  'legal.privacy.h1': { ru: '1. Сбор данных', en: '1. Data collection' },
  'legal.privacy.p2': { ru: 'Для оформления сертификата мы запрашиваем только: UDID вашего устройства, модель устройства и контактные данные (адрес электронной почты или Telegram) для отправки уведомлений о готовности заказа и чеков.', en: 'To issue a certificate we only ask for: your device UDID, device model, and contact details (email or Telegram) to send order-ready notifications and receipts.' },
  'legal.privacy.h2': { ru: '2. Использование и передача', en: '2. Use & sharing' },
  'legal.privacy.p3': { ru: 'Мы не продаем и не передаем ваши данные сторонним рекламным сетям. Ваш UDID используется исключительно для регистрации вашего устройства на портале разработчиков Apple, что является технически необходимым условием для работы сертификата.', en: 'We do not sell or share your data with ad networks. Your UDID is used solely to register your device on the Apple Developer portal, which is technically required for the certificate to work.' },
  'legal.privacy.h3': { ru: '3. Безопасность', en: '3. Security' },
  'legal.privacy.p4': { ru: 'Мы используем современные протоколы шифрования для защиты ваших данных при их передаче и хранении. Вы имеете право в любой момент после истечения срока действия вашего сертификата запросить удаление ваших данных из нашей системы.', en: 'We use modern encryption protocols to protect your data in transit and at rest. After your certificate expires, you may request deletion of your data from our system at any time.' },
  'legal.disclaimer.title': { ru: 'Отказ от ответственности', en: 'Disclaimer' },
  'legal.disclaimer.p1': { ru: 'Пожалуйста, внимательно ознакомьтесь со статусом наших услуг.', en: 'Please read the status of our services carefully.' },
  'legal.disclaimer.h1': { ru: '1. Статус сервиса', en: '1. Service status' },
  'legal.disclaimer.p2': { ru: 'BAZZAR CERTS не является официальным партнером, представителем или дочерней компанией Apple Inc. Логотипы и торговые марки Apple используются на сайте исключительно в информационных целях.', en: 'BAZZAR CERTS is not an official partner, representative, or subsidiary of Apple Inc. Apple logos and trademarks are used on this site for informational purposes only.' },
  'legal.disclaimer.h2': { ru: '2. Ответственность за контент', en: '2. Content responsibility' },
  'legal.disclaimer.p3': { ru: 'Мы предоставляем инфраструктуру для разработчиков и энтузиастов. Вы несете полную личную ответственность за любые приложения, которые подписываете и устанавливаете с помощью нашего сертификата. Мы не проверяем исходный код сторонних .ipa файлов на наличие вредоносного кода.', en: 'We provide infrastructure for developers and enthusiasts. You bear full personal responsibility for any apps you sign and install with our certificate. We do not audit third-party .ipa files for malicious code.' },
  'legal.disclaimer.h3': { ru: '3. Риски использования', en: '3. Usage risks' },
  'legal.disclaimer.p4': { ru: 'Услуга предоставляется «как есть» (as is). Мы не несем ответственности за возможные блокировки вашего аккаунта Apple ID, досрочные отзывы сертификатов со стороны Apple или любые программные сбои вашего устройства, вызванные установкой нелицензионного ПО.', en: 'The service is provided “as is”. We are not liable for possible Apple ID bans, early certificate revocations by Apple, or any software issues on your device caused by installing unlicensed software.' },
  'legal.close': { ru: 'Закрыть', en: 'Close' },
  'legal.ok': { ru: 'Понятно', en: 'Got it' },

  // Splash
  'splash.tagline': { ru: 'Свобода установки приложений', en: 'Freedom to install apps' },

  // Auth page
  'auth.title': { ru: 'Авторизация...', en: 'Signing you in...' },
  'auth.subtitle': { ru: 'Проверяем профиль устройства', en: 'Checking the device profile' },

  // Success page
  'success.loading.title': { ru: 'Обработка заказа...', en: 'Processing your order...' },
  'success.loading.subtitle': { ru: 'Связываемся с GGsel / Digiseller', en: 'Contacting GGsel / Digiseller' },
  'success.error.title': { ru: 'Ошибка активации', en: 'Activation error' },
  'success.error.back': { ru: 'Вернуться на главную', en: 'Back to home' },
  'success.error.noCode': { ru: 'Код заказа не найден', en: 'Order code not found' },
  'success.error.link': { ru: 'Ошибка привязки заказа. Попробуйте обновить страницу.', en: 'Failed to link the order. Please refresh the page.' },
  'success.error.verify': { ru: 'Ошибка проверки заказа. Пожалуйста, обновите страницу.', en: 'Order verification failed. Please refresh the page.' },
  'success.error.network': { ru: 'Сетевая ошибка при проверке заказа', en: 'Network error while verifying the order' },
  'success.thanks': { ru: 'Спасибо за покупку!', en: 'Thanks for your purchase!' },
  'success.paid': { ru: 'Ваш заказ успешно оплачен. Остался всего один шаг.', en: 'Your order is paid. Just one step left.' },
  'success.product': { ru: 'Товар', en: 'Product' },
  'success.orderNum': { ru: 'Номер заказа (Код)', en: 'Order number (code)' },
  'success.defaultItem': { ru: 'Сертификат Apple', en: 'Apple Certificate' },
  'success.bind.title': { ru: 'Привязка устройства', en: 'Link your device' },
  'success.bind.text': { ru: 'Для оформления сертификата разработчика нам необходим UDID вашего устройства. Нажмите кнопку ниже и установите профиль конфигурации Apple.', en: 'To issue your developer certificate we need your device UDID. Tap the button below and install the Apple configuration profile.' },
  'success.sdp.title': { ru: 'Защита украденного устройства', en: 'Stolen Device Protection' },
  'success.sdp.text1': { ru: 'Если на вашем iPhone включена «Защита украденного устройства» и вы находитесь вдали от знакомых мест (дома или работы), Apple может попросить', en: 'If Stolen Device Protection is enabled on your iPhone and you’re away from familiar locations (home or work), Apple may ask you to' },
  'success.sdp.text2': { ru: 'подождать 1 час', en: 'wait 1 hour' },
  'success.sdp.text3': { ru: 'перед установкой профиля. Это нормально. Просто дождитесь окончания таймера и повторите попытку установки профиля.', en: 'before installing the profile. That’s normal. Just wait for the timer to end and try installing the profile again.' },
  'success.steps.title': { ru: 'Краткая инструкция:', en: 'Quick guide:' },
  'success.step1a': { ru: 'Нажмите кнопку', en: 'Tap the' },
  'success.step1b': { ru: '«Получить UDID»', en: '“Get UDID”' },
  'success.step1c': { ru: 'ниже.', en: 'button below.' },
  'success.step2a': { ru: 'В появившемся окне браузера нажмите', en: 'In the browser prompt, tap' },
  'success.step2b': { ru: '«Разрешить»', en: '“Allow”' },
  'success.step3a': { ru: 'Откройте', en: 'Open' },
  'success.step3b': { ru: '«Настройки»', en: '“Settings”' },
  'success.step3c': { ru: 'вашего iPhone.', en: 'on your iPhone.' },
  'success.step4a': { ru: 'Сверху (под вашим Apple ID) появится пункт', en: 'At the top (under your Apple ID) you’ll see' },
  'success.step4b': { ru: '«Профиль загружен»', en: '“Profile Downloaded”' },
  'success.step4c': { ru: '— нажмите на него и выберите', en: '— tap it and choose' },
  'success.step4d': { ru: '«Установить»', en: '“Install”' },
  'success.step4e': { ru: '(потребуется код-пароль от экрана).', en: '(your screen passcode will be required).' },
  'success.step5': { ru: 'После установки вас автоматически вернет на наш сайт для завершения!', en: 'After installation you’ll be returned to our site automatically to finish!' },
  'success.getUdid': { ru: 'Получить UDID', en: 'Get UDID' },
  'success.faq1.title': { ru: 'Это безопасно? Зачем нужен UDID?', en: 'Is it safe? Why do you need my UDID?' },
  'success.faq1.text1': { ru: 'UDID — это уникальный идентификатор вашего устройства (как VIN у автомобиля). Он нужен', en: 'A UDID is your device’s unique identifier (like a car’s VIN). It’s needed' },
  'success.faq1.text2': { ru: 'исключительно', en: 'solely' },
  'success.faq1.text3': { ru: 'для того, чтобы добавить ваш iPhone в аккаунт разработчика Apple. Профиль конфигурации собирает только этот номер и ничего больше. Это стандартная и полностью безопасная процедура Apple.', en: 'to add your iPhone to an Apple developer account. The configuration profile collects only this number — nothing else. It’s a standard, completely safe Apple procedure.' },
  'success.faq2.title': { ru: 'Возникли проблемы?', en: 'Ran into trouble?' },
  'success.faq2.text1': { ru: 'Если у вас что-то не получается, сайт выдает ошибку или вы случайно закрыли нужную вкладку — не переживайте.', en: 'If something isn’t working, the site shows an error, or you accidentally closed the wrong tab — don’t worry.' },
  'success.faq2.text2': { ru: 'Напишите в нашу', en: 'Message our' },
  'success.faq2.link': { ru: 'Службу поддержки', en: 'Support Team' },
  'success.faq2.text3': { ru: 'прикрепите код вашего заказа, и мы с радостью поможем вам завершить настройку!', en: 'attach your order code, and we’ll gladly help you finish the setup!' },

  // Meta
  'meta.tagline': { ru: 'Свобода установки приложений на iOS', en: 'Freedom to install apps on iOS' },

  // General
  'general.all': { ru: 'Все', en: 'All' },
  'general.more': { ru: 'Ещё', en: 'More' },
  'general.back': { ru: 'Назад', en: 'Back' },
  'general.toTop': { ru: 'Наверх', en: 'Back to top' },
}

interface I18nCtx {
  lang: Lang
  setLang: (l: Lang) => void
  /** Перевод по ключу словаря с интерполяцией {placeholder} */
  t: (key: string, vars?: Record<string, string | number>) => string
  /** Выбор строки из двуязычного объекта { ru, en } (данные каталога) */
  l: (text: LText) => string
  /** Локаль для дат/чисел ('ru-RU' / 'en-US') */
  locale: string
}

const I18nContext = createContext<I18nCtx>({
  lang: 'ru',
  setLang: () => {},
  t: (key) => key,
  l: (text) => text.ru,
  locale: 'ru-RU',
})

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`))
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('bazzar_lang') as Lang) || 'ru'
    } catch { return 'ru' }
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('bazzar_lang', l) } catch { /* ignore */ }
  }

  // Атрибут lang у <html> — для доступности и SEO
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const str = translations[key]?.[lang] || key
    return interpolate(str, vars)
  }

  const l = (text: LText): string => text[lang]

  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'

  return (
    <I18nContext.Provider value={{ lang, setLang, t, l, locale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

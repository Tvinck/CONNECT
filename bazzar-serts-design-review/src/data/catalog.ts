import type { LText } from '../hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   Каталог — типы, товары, категории, отзывы, FAQ
   Текстовые поля двуязычные (LText { ru, en }),
   выбор языка в компонентах через l() из useI18n()
   ═══════════════════════════════════════════════════════════ */

export interface Product {
  id: string
  title: LText
  subtitle: LText
  category: 'certs' | 'apps' | 'utils'
  icon: string  // lucide icon name
  color: string // accent color for icon
  price: number
  oldPrice?: number
  rating: number
  sold: number
  badge?: 'hot' | 'new' | 'sale' | 'popular' | 'free'
  delivery: LText
  description: LText
}

export interface Category {
  id: string
  title: LText
  subtitle: LText
  count: number
  icon: string  // lucide icon name
  color: string // accent color
}

export interface Review {
  id: number
  name: LText
  avatar: LText
  rating: number
  text: LText
  date: LText
}

export interface FaqItem {
  id: number
  question: LText
  answer: LText
}

/* ── Товары ────────────────────────────────────────────────── */
export const products: Product[] = [
  {
    id: 'vip-cert',
    title: { ru: 'VIP Сертификат', en: 'VIP Certificate' },
    subtitle: { ru: '365 дней · Enterprise', en: '365 days · Enterprise' },
    category: 'certs',
    icon: 'Crown',
    color: '#fcab14',
    price: 1490,
    oldPrice: 1990,
    rating: 4.9,
    sold: 1284,
    badge: 'hot',
    delivery: { ru: 'Мгновенно', en: 'Instant' },
    description: {
      ru: 'Премиальный сертификат разработчика Apple Enterprise. Установка любых приложений без ограничений на целый год. Приоритетная поддержка 24/7.',
      en: 'Premium Apple Enterprise developer certificate. Install any apps without limits for a full year. Priority 24/7 support.',
    },
  },
  {
    id: 'standard-cert',
    title: { ru: 'Стандартный Сертификат', en: 'Standard Certificate' },
    subtitle: { ru: '180 дней · Developer', en: '180 days · Developer' },
    category: 'certs',
    icon: 'ShieldCheck',
    color: '#9533ff',
    price: 890,
    rating: 4.7,
    sold: 2340,
    delivery: { ru: 'Мгновенно', en: 'Instant' },
    description: {
      ru: 'Надёжный сертификат разработчика на полгода. Полный доступ к установке приложений с гарантией замены.',
      en: 'A reliable six-month developer certificate. Full app-installation access with a replacement guarantee.',
    },
  },
  {
    id: 'basic-cert',
    title: { ru: 'Базовый Сертификат', en: 'Basic Certificate' },
    subtitle: { ru: '40 дней · Developer', en: '40 days · Developer' },
    category: 'certs',
    icon: 'Shield',
    color: '#25a2e0',
    price: 390,
    rating: 4.5,
    sold: 4500,
    badge: 'new',
    delivery: { ru: 'Мгновенно', en: 'Instant' },
    description: {
      ru: 'Попробуйте — доступный сертификат на 40 дней для новых пользователей. Отличный способ познакомиться с сервисом.',
      en: 'Give it a try — an affordable 40-day certificate for new users. A great way to get to know the service.',
    },
  },
  {
    id: 'tiktok-mod',
    title: { ru: 'TikTok без рекламы', en: 'TikTok Ad-Free' },
    subtitle: { ru: 'Модифицированная версия · Без VPN', en: 'Modded version · No VPN' },
    category: 'apps',
    icon: 'Video',
    color: '#ff2d55',
    price: 149,
    rating: 4.8,
    sold: 3210,
    badge: 'hot',
    delivery: { ru: 'Мгновенно', en: 'Instant' },
    description: {
      ru: 'TikTok без рекламы, с загрузкой видео без водяного знака. Работает без VPN, все функции на месте.',
      en: 'TikTok with no ads and watermark-free video downloads. Works without a VPN, all features included.',
    },
  },
  {
    id: 'spotify-mod',
    title: { ru: 'Spotify Premium', en: 'Spotify Premium' },
    subtitle: { ru: 'Без рекламы · Оффлайн режим', en: 'Ad-free · Offline mode' },
    category: 'apps',
    icon: 'Music',
    color: '#1db954',
    price: 199,
    rating: 4.6,
    sold: 1890,
    badge: 'popular',
    delivery: { ru: 'Мгновенно', en: 'Instant' },
    description: {
      ru: 'Spotify с премиум-функциями: без рекламы, скачивание треков, высокое качество звука.',
      en: 'Spotify with premium features: no ads, track downloads, high-quality audio.',
    },
  },
  {
    id: 'youtube-mod',
    title: { ru: 'YouTube без рекламы', en: 'YouTube Ad-Free' },
    subtitle: { ru: 'uYou+ · Background play', en: 'uYou+ · Background play' },
    category: 'apps',
    icon: 'Play',
    color: '#ff0033',
    price: 0,
    rating: 4.9,
    sold: 6500,
    badge: 'free',
    delivery: { ru: 'Мгновенно', en: 'Instant' },
    description: {
      ru: 'YouTube без рекламы с фоновым воспроизведением, PiP и загрузкой видео.',
      en: 'YouTube without ads, with background playback, Picture-in-Picture, and video downloads.',
    },
  },
  {
    id: 'scarlet',
    title: { ru: 'Scarlet', en: 'Scarlet' },
    subtitle: { ru: 'Альтернативный магазин', en: 'Alternative app store' },
    category: 'utils',
    icon: 'Download',
    color: '#ff3b30',
    price: 0,
    rating: 4.5,
    sold: 8940,
    badge: 'free',
    delivery: { ru: 'Мгновенно', en: 'Instant' },
    description: {
      ru: 'Альтернативный магазин приложений для iOS. Тысячи приложений в одном месте.',
      en: 'An alternative app store for iOS. Thousands of apps in one place.',
    },
  },
  {
    id: 'vk-sova',
    title: { ru: 'VK Сова', en: 'VK Sova' },
    subtitle: { ru: 'Модифицированный VK · Тёмная тема', en: 'Modded VK · Dark theme' },
    category: 'apps',
    icon: 'MessageCircle',
    color: '#0077ff',
    price: 199,
    oldPrice: 299,
    rating: 4.4,
    sold: 1560,
    badge: 'sale',
    delivery: { ru: 'Мгновенно', en: 'Instant' },
    description: {
      ru: 'VK с расширенным функционалом: загрузка музыки, обход ограничений, тёмная тема.',
      en: 'VK with extended features: music downloads, restriction bypass, dark theme.',
    },
  },
]

/* ── Категории ─────────────────────────────────────────────── */
export const categories: Category[] = [
  {
    id: 'certs',
    title: { ru: 'Сертификаты', en: 'Certificates' },
    subtitle: { ru: 'Enterprise, Developer', en: 'Enterprise, Developer' },
    count: 3,
    icon: 'ShieldCheck',
    color: '#9533ff',
  },
  {
    id: 'apps',
    title: { ru: 'Приложения', en: 'Apps' },
    subtitle: { ru: 'Моды, твики', en: 'Mods, tweaks' },
    count: 12,
    icon: 'Smartphone',
    color: '#3bb33b',
  },
  {
    id: 'utils',
    title: { ru: 'Утилиты', en: 'Utilities' },
    subtitle: { ru: 'Инструменты', en: 'Tools' },
    count: 6,
    icon: 'Settings',
    color: '#fcab14',
  },
  {
    id: 'free',
    title: { ru: 'Бесплатное', en: 'Free' },
    subtitle: { ru: 'Без регистрации', en: 'No sign-up' },
    count: 8,
    icon: 'Gift',
    color: '#25a2e0',
  },
]

/* ── Отзывы ────────────────────────────────────────────────── */
export const reviews: Review[] = [
  {
    id: 1,
    name: { ru: 'Алексей М.', en: 'Alexey M.' },
    avatar: { ru: 'А', en: 'A' },
    rating: 5,
    text: {
      ru: 'Купил VIP сертификат — работает идеально уже 3 месяца. Все приложения ставятся без проблем, поддержка отвечает моментально.',
      en: 'Bought the VIP certificate — it’s been working flawlessly for 3 months. Every app installs without a hitch, and support replies instantly.',
    },
    date: { ru: '2 дня назад', en: '2 days ago' },
  },
  {
    id: 2,
    name: { ru: 'Дарья К.', en: 'Daria K.' },
    avatar: { ru: 'Д', en: 'D' },
    rating: 5,
    text: {
      ru: 'Наконец-то нашла нормальный сервис! Раньше покупала на других площадках — через неделю отзывали. Здесь всё стабильно.',
      en: 'Finally found a decent service! I used to buy elsewhere and the certs got revoked within a week. Everything is rock solid here.',
    },
    date: { ru: '5 дней назад', en: '5 days ago' },
  },
  {
    id: 3,
    name: { ru: 'Максим Р.', en: 'Maxim R.' },
    avatar: { ru: 'М', en: 'M' },
    rating: 4,
    text: {
      ru: 'Базовый серт на 40 дней — отличный способ попробовать. Потом перешёл на VIP. Всем рекомендую!',
      en: 'The 40-day Basic cert is a great way to test the waters. I later upgraded to VIP. Highly recommended!',
    },
    date: { ru: '1 неделю назад', en: '1 week ago' },
  },
  {
    id: 4,
    name: { ru: 'Кирилл В.', en: 'Kirill V.' },
    avatar: { ru: 'К', en: 'K' },
    rating: 5,
    text: {
      ru: 'Топовый магазин. Покупаю тут уже полгода, ни разу не подвели. Цены адекватные, доставка мгновенная.',
      en: 'Top-notch store. I’ve been buying here for six months and they’ve never let me down. Fair prices, instant delivery.',
    },
    date: { ru: '2 недели назад', en: '2 weeks ago' },
  },
  {
    id: 5,
    name: { ru: 'Анна С.', en: 'Anna S.' },
    avatar: { ru: 'А', en: 'A' },
    rating: 5,
    text: {
      ru: 'Подруга посоветовала — не пожалела. TikTok без рекламы это просто кайф, а сертификат работает без сбоев.',
      en: 'A friend recommended it — no regrets. Ad-free TikTok is pure joy, and the certificate runs without a single glitch.',
    },
    date: { ru: '3 недели назад', en: '3 weeks ago' },
  },
]

/* ── FAQ ────────────────────────────────────────────────────── */
export const faqs: FaqItem[] = [
  {
    id: 1,
    question: { ru: 'Что такое сертификат разработчика?', en: 'What is a developer certificate?' },
    answer: {
      ru: 'Сертификат Apple Enterprise Developer позволяет устанавливать приложения напрямую на iPhone и iPad, минуя App Store. Это легальный инструмент для корпоративного распространения приложений.',
      en: 'An Apple Enterprise Developer certificate lets you install apps directly on iPhone and iPad, bypassing the App Store. It’s a legitimate tool for distributing apps outside the store.',
    },
  },
  {
    id: 2,
    question: { ru: 'Как долго действует сертификат?', en: 'How long does a certificate last?' },
    answer: {
      ru: 'Зависит от тарифа: Базовый — 40 дней, Стандартный — 180 дней, VIP — 365 дней. После истечения срока необходимо продлить или приобрести новый.',
      en: 'It depends on the plan: Basic — 40 days, Standard — 180 days, VIP — 365 days. After it expires, you’ll need to renew or buy a new one.',
    },
  },
  {
    id: 3,
    question: { ru: 'Что будет если сертификат отзовут?', en: 'What happens if the certificate gets revoked?' },
    answer: {
      ru: 'Мы используем стабильные Enterprise-аккаунты с минимальным риском отзыва. Если это произойдёт — предоставим замену бесплатно в течение срока действия.',
      en: 'We use stable Enterprise accounts with minimal revocation risk. If it does happen, we’ll provide a free replacement within your active period.',
    },
  },
  {
    id: 4,
    question: { ru: 'Как установить приложение?', en: 'How do I install an app?' },
    answer: {
      ru: 'После покупки сертификата вы получите ссылку на установку. Перейдите по ней с iPhone, подтвердите установку в Настройки → Основные → Профили и управление устройством.',
      en: 'After purchasing a certificate you’ll get an install link. Open it on your iPhone and confirm in Settings → General → VPN & Device Management.',
    },
  },
  {
    id: 5,
    question: { ru: 'Какие способы оплаты доступны?', en: 'What payment methods are available?' },
    answer: {
      ru: 'Принимаем оплату через карты Visa/MasterCard/МИР, СБП (QR-код), криптовалюту, ЮMoney и другие популярные способы.',
      en: 'We accept Visa/MasterCard/MIR cards, SBP (QR code), cryptocurrency, YooMoney, and other popular payment methods.',
    },
  },
]

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocalPath = 'C:\\Users\\Николай\\Desktop\\BAZZAR PROD\\connect\\.env.local';
const envContent = fs.readFileSync(envLocalPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

const MOCK_PRODUCTS = [
  { id: 'cert-base', title: 'Базовый Сертификат', subtitle: 'Доступ на 1 год', category: 'certs', emoji: '📃', grad: 'linear-gradient(135deg,#10b981,#1db954)', image: '/img/bazzar/cert_base.png', price: 800, old_price: 1200, rating: 4.8, sold: 1240, badge: 'hot', delivery: '1–5 часов', active: true, stock: 50 },
  { id: 'cert-vip', title: 'VIP Сертификат', subtitle: 'Защита от отзыва + Гарантия', category: 'certs', emoji: '👑', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', image: '/img/bazzar/cert_vip.png', price: 1500, old_price: 2000, rating: 5.0, sold: 890, badge: 'hot', delivery: '1–5 часов', active: true, stock: 10 },
  { id: 'app-tiktok', title: 'TikTok Dark', subtitle: 'Мод без ограничений', category: 'apps', emoji: '🎵', grad: 'linear-gradient(135deg,#1b2838,#66c0f4)', image: '/img/bazzar/tiktok_dark.png', price: 0, old_price: null, rating: 4.9, sold: 15400, badge: null, delivery: 'Моментально', active: true, stock: 999 },
  { id: 'app-spotify', title: 'Spotify++', subtitle: 'Premium бесплатно', category: 'apps', emoji: '🎧', grad: 'linear-gradient(135deg,#10b981,#1db954)', image: '/img/bazzar/spotify_plus.png', price: 0, old_price: null, rating: 4.8, sold: 9200, badge: null, delivery: 'Моментально', active: true, stock: 999 },
  { id: 'tool-scarlet', title: 'Scarlet', subtitle: 'Установщик IPA', category: 'tools', emoji: '🔴', grad: 'linear-gradient(135deg,#ef4444,#7c1d1d)', image: '/img/bazzar/scarlet.png', price: 0, old_price: null, rating: 4.7, sold: 21000, badge: 'hot', delivery: 'Моментально', active: true, stock: 999 },
  { id: 'tool-esing', title: 'ESign', subtitle: 'Продвинутая подпись', category: 'tools', emoji: '✍️', grad: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', image: '/img/bazzar/esign.png', price: 0, old_price: null, rating: 4.9, sold: 18500, badge: null, delivery: 'Моментально', active: true, stock: 999 },
  { id: 'app-vk', title: 'VK Сова', subtitle: 'Оффлайн режим', category: 'apps', emoji: '🦉', grad: 'linear-gradient(135deg,#2563eb,#7c3aed)', image: '/img/bazzar/vk.png', price: 0, old_price: null, rating: 4.6, sold: 5400, badge: null, delivery: 'Моментально', active: false, stock: 0 }
];

const MOCK_USERS = [
  { udid: '00008110-000A183849102A', registeredAt: '2026-06-25T10:30:00Z', status: 'bought', lastPurchase: '2026-06-25T10:35:00Z', plan: 'Apple Developer (1 Год)' },
  { udid: '00008120-001B2948502A3B', registeredAt: '2026-06-26T14:15:00Z', status: 'thinking', lastPurchase: null, plan: null },
  { udid: '00008030-002C3827103C4D', registeredAt: '2026-06-26T15:00:00Z', status: 'bought', lastPurchase: '2026-06-26T15:20:00Z', plan: 'Установка Scarlet' },
  { udid: '00008110-003D47192A4E5F', registeredAt: '2026-06-26T18:45:00Z', status: 'pending', lastPurchase: '2026-06-26T18:50:00Z', plan: 'Apple Developer (VIP)' },
  { udid: '00008120-004E56283B5F60', registeredAt: '2026-06-26T19:10:00Z', status: 'thinking', lastPurchase: null, plan: null },
];

async function seed() {
  console.log('Seeding Bazzar Products...');
  
  // We need to fetch inserted products to get their UUIDs for the reviews
  const insertedProducts = [];
  for (const prod of MOCK_PRODUCTS) {
    const { data, error } = await supabase.from('bazzar_products').insert([{
      title: prod.title,
      subtitle: prod.subtitle,
      category: prod.category,
      emoji: prod.emoji,
      grad: prod.grad,
      image: prod.image,
      price: prod.price,
      old_price: prod.old_price,
      rating: prod.rating,
      sold: prod.sold,
      badge: prod.badge,
      delivery: prod.delivery,
      active: prod.active,
      stock: prod.stock
    }]).select().single();
    
    if (error) console.error('Error inserting product:', error.message);
    else insertedProducts.push({ tempId: prod.id, ...data });
  }

  console.log('Seeding Bazzar Users...');
  for (const user of MOCK_USERS) {
    const { error } = await supabase.from('bazzar_users').insert([{
      udid: user.udid,
      status: user.status,
      last_purchase: user.lastPurchase,
      plan: user.plan,
      created_at: user.registeredAt
    }]);
    if (error) console.error('Error inserting user:', error.message);
  }

  console.log('Seeding Bazzar Reviews...');
  const baseCert = insertedProducts.find(p => p.tempId === 'cert-base');
  const vipCert = insertedProducts.find(p => p.tempId === 'cert-vip');
  const scarlet = insertedProducts.find(p => p.tempId === 'tool-scarlet');
  const vk = insertedProducts.find(p => p.tempId === 'app-vk');

  const MOCK_REVIEWS = [
    { productId: baseCert?.id, author: 'Alex M.', rating: 5, text: 'Всё супер, сертификат выдали за 10 минут! Работает отлично.', date: '2026-06-25T12:00:00Z', status: 'published' },
    { productId: scarlet?.id, author: 'Игорь В.', rating: 4, text: 'Немного пришлось подождать, но в целом все гуд.', date: '2026-06-26T10:00:00Z', status: 'published' },
    { productId: vipCert?.id, author: 'anon88', rating: 5, text: 'Очень крутой саппорт, помогли с установкой приложений.', date: '2026-06-26T15:00:00Z', status: 'pending' },
    { productId: vk?.id, author: 'Dmitriy', rating: 1, text: 'Не получилось запустить на моем старом айфоне.', date: '2026-06-26T16:00:00Z', status: 'rejected' },
  ];

  for (const review of MOCK_REVIEWS) {
    if (!review.productId) continue;
    const { error } = await supabase.from('bazzar_reviews').insert([{
      product_id: review.productId,
      author: review.author,
      rating: review.rating,
      text: review.text,
      status: review.status,
      created_at: review.date
    }]);
    if (error) console.error('Error inserting review:', error.message);
  }

  console.log('Seeding Analytics...');
  const MOCK_ANALYTICS = [
    { date: '2026-06-20', unique_visitors: 120, registrations: 20, views: 900, add_to_cart: 50, orders: 30 },
    { date: '2026-06-21', unique_visitors: 150, registrations: 35, views: 1100, add_to_cart: 65, orders: 40 },
    { date: '2026-06-22', unique_visitors: 180, registrations: 40, views: 1350, add_to_cart: 70, orders: 45 },
    { date: '2026-06-23', unique_visitors: 290, registrations: 85, views: 2100, add_to_cart: 120, orders: 80 },
    { date: '2026-06-24', unique_visitors: 400, registrations: 120, views: 3200, add_to_cart: 180, orders: 110 },
    { date: '2026-06-25', unique_visitors: 380, registrations: 105, views: 2950, add_to_cart: 160, orders: 100 },
    { date: '2026-06-26', unique_visitors: 520, registrations: 150, views: 4200, add_to_cart: 230, orders: 150 },
  ];

  for (const an of MOCK_ANALYTICS) {
    const { error } = await supabase.from('bazzar_analytics').insert([an]);
    if (error) console.error('Error inserting analytics:', error.message);
  }

  console.log('Done seeding Bazzar Certs.');
}

seed();

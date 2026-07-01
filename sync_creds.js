const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase environment variables not found in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getLocalCredsPath() {
  const userHome = os.homedir();
  const paths = [
    path.join(process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming'), 'higgsfield', 'credentials.json'),
    path.join(userHome, '.config', 'higgsfield', 'credentials.json'),
    path.join(userHome, '.higgsfield', 'credentials.json'),
    path.join(userHome, 'AppData', 'Local', 'higgsfield', 'credentials.json')
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

async function sync() {
  const credsPath = getLocalCredsPath();
  if (!credsPath) {
    console.error("Ошибка: Файл credentials.json не найден!");
    console.log("Сначала войдите в аккаунт Higgsfield CLI, выполнив команду:");
    console.log("npx higgsfield auth login");
    process.exit(1);
  }

  console.log(`Найден локальный файл авторизации: ${credsPath}`);
  const credsText = fs.readFileSync(credsPath, 'utf8');

  console.log("Синхронизация токена с облаком Supabase...");
  const { data, error } = await supabase.storage
    .from('support-attachments')
    .upload('cli_credentials.json', credsText, { upsert: true, contentType: 'application/json' });

  if (error) {
    console.error("Ошибка загрузки:", error.message);
  } else {
    console.log("УСПЕХ! Авторизация ИИ Завода обновлена в облаке! 🎉");
  }
}

sync();

# CONNECT — запуск на своём компьютере

Внутренняя платформа команды BAZZAR Group (Next.js 14 + Supabase).

Ниже — полная инструкция, как скачать проект и запустить его локально.
Шаги 1–4 делаются **один раз**. Дальше — только «Запуск» и «Обновление».

---

## Что должно быть установлено (один раз)

### 1. Node.js
Скачай **LTS-версию** с https://nodejs.org → установи (всё «Далее → Далее»).
Проверка — открой терминал и набери:
```bash
node -v
npm -v
```
Если показались номера версий (например `v20.x.x`) — всё ок.

### 2. Git
- **Windows:** https://git-scm.com/download/win → установи.
- **macOS:** уже есть; если нет — установится при первом вызове `git`.

Проще всего для новичка — **GitHub Desktop**: https://desktop.github.com
Он скачивает проект и обновляет его в пару кликов, без команд.

---

## 2. Скачать проект (один раз)

### Вариант А — через GitHub Desktop (рекомендую)
1. Открой GitHub Desktop, войди под аккаунтом, у которого есть доступ к репозиторию `tvinck/connect`.
2. **File → Clone repository → вкладка GitHub.com → выбери `tvinck/connect` → Clone.**
3. Вверху нажми **Current Branch** и выбери ветку:
   ```
   claude/pensive-franklin-4EDRO
   ```
4. Запомни путь к папке (показан в окне, обычно `Documents/GitHub/connect`).

### Вариант Б — через терминал
```bash
git clone https://github.com/tvinck/connect.git
cd connect
git checkout claude/pensive-franklin-4EDRO
```

---

## 3. Вставить ключи Supabase (один раз)

В корне проекта создай файл с именем **`.env.local`** и вставь в него:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fhwrdhebhgywhvoeqpxj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3JkaGViaGd5d2h2b2VxcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mjk0MjcsImV4cCI6MjA5NTUwNTQyN30.1odxq5Ull4GDI_zoThLfwjbYE6IaDI0_yDGv-_lzDHM
SUPABASE_SERVICE_ROLE_KEY=ВСТАВЬ_СЮДА_SERVICE_ROLE_KEY
```

> ⚠️ Этот файл специально **не хранится в Git** (в нём секреты). Поэтому при
> скачивании его нет — нужно создать вручную один раз. Образец полей —
> в файле `.env.local.example`.
>
> 🔑 **`SUPABASE_SERVICE_ROLE_KEY`** нужен, чтобы CEO мог приглашать сотрудников
> (создаёт им вход). Возьми его в Supabase: **Settings → API → service_role**
> (секция «Project API keys», кнопка «Reveal»). Этот ключ — только для сервера,
> никогда не вставляй его в `NEXT_PUBLIC_*` и не публикуй.

---

## 3.1 Применить миграцию для чатов (один раз)

Открой Supabase → **SQL Editor** → New query, вставь и выполни содержимое
файла **`supabase/migrations/0002_features.sql`** (добавляет ответы в чате).
Без этого ответы на сообщения работать не будут.

---

## 4. Установить зависимости (один раз)

Открой терминал **в папке проекта** и выполни:
```bash
npm install
```
Это скачает все библиотеки (займёт 1–3 минуты).

> Как открыть терминал в папке:
> - **GitHub Desktop:** меню `Repository → Open in Terminal` (или Command Prompt).
> - **Windows:** в папке проекта зажми Shift + правый клик → «Открыть окно PowerShell здесь».
> - **VS Code:** открой папку проекта, затем `Terminal → New Terminal`.

---

## ▶️ Запуск

```bash
npm run dev
```
Появится строка `Local: http://localhost:3000` — открой этот адрес в браузере.

Вход:
```
Почта:  artem@bazzar.group
Пароль: connect2026
```
(пароль одинаковый у всех пятерых: artem / masha / dima / sonya / ivan @bazzar.group)

Чтобы **остановить** сервер — в терминале нажми `Ctrl + C`.

---

## 🔄 Как обновлять проект (когда я добавляю новое)

Каждый раз, когда появились изменения:

### GitHub Desktop
1. Сверху нажми **Fetch origin**, затем **Pull origin**.
2. Убедись, что выбрана ветка `claude/pensive-franklin-4EDRO`.
3. В терминале: `npm install` (на случай новых библиотек), затем `npm run dev`.

### Терминал
```bash
git pull origin claude/pensive-franklin-4EDRO
npm install
npm run dev
```

`.env.local` трогать не нужно — он остаётся на месте.

---

## Если что-то не работает

| Симптом | Что делать |
|---|---|
| `command not found: npm` | Node.js не установлен / перезапусти терминал |
| Белый экран, ошибка про `SUPABASE` | Проверь, что создал `.env.local` (шаг 3) и перезапустил `npm run dev` |
| «Неверная почта или пароль» | В Supabase не выполнен `seed.sql` — прогони его в SQL Editor |
| Порт занят (`3000 in use`) | Закрой другой запущенный `npm run dev` или открой `http://localhost:3001` |

Если непонятно — скопируй текст ошибки из терминала и пришли мне.

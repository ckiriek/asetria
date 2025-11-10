# Next.js Setup Guide для Asetria

## ✅ Что создано

### Структура проекта
```
asetria/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles (Tailwind)
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser Supabase client
│   │   ├── server.ts       # Server Supabase client
│   │   └── database.types.ts # TypeScript types для БД
│   └── utils.ts            # Utility functions
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind config
├── next.config.js          # Next.js config
└── postcss.config.js       # PostCSS config
```

### Технологии
- ✅ Next.js 14 (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Supabase SSR (@supabase/ssr)
- ✅ Lucide React (иконки)
- ✅ React Hook Form + Zod (формы)

## 🚀 Установка и запуск

### 1. Установите зависимости

```bash
cd /Users/mitchkiriek/asetria
npm install
```

### 2. Создайте .env.local

Скопируйте из `SUPABASE_CREDENTIALS.md`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qtlpjxjlwrjindgybsfd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bHBqeGpsd3JqaW5kZ3lic2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDEwNTcsImV4cCI6MjA3ODI3NzA1N30.kP-rU87DoYFwLVt2fy8fLxqSStnOkVqQV_MGIh7ohGg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bHBqeGpsd3JqaW5kZ3lic2ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcwMTA1NywiZXhwIjoyMDc4Mjc3MDU3fQ.FhH0KOUaIFVzlokU7oGehUvRWdd6__PqQJa-U3eqwPk

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Запустите dev сервер

```bash
npm run dev
```

Откройте http://localhost:3000

## 📁 Структура App Router

Next.js 14 использует App Router (папка `app/`):

- `app/layout.tsx` - Root layout для всего приложения
- `app/page.tsx` - Главная страница (/)
- `app/dashboard/` - Будущий dashboard
- `app/api/` - API routes (для Edge Functions)

## 🔧 Доступные команды

```bash
npm run dev          # Запуск dev сервера (http://localhost:3000)
npm run build        # Production build
npm run start        # Запуск production сервера
npm run lint         # ESLint проверка
npm run type-check   # TypeScript проверка
```

## 🎨 Tailwind CSS

Настроен с shadcn/ui цветовой схемой:
- CSS переменные в `app/globals.css`
- Конфигурация в `tailwind.config.ts`
- Утилита `cn()` для объединения классов

## 🔐 Supabase клиенты

### Browser Client (для Client Components)
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('projects').select()
```

### Server Client (для Server Components)
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data } = await supabase.from('projects').select()
```

## 📝 TypeScript типы

Все типы БД автоматически типизированы в `lib/supabase/database.types.ts`:

```typescript
import type { Database } from '@/lib/supabase/database.types'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
```

## 🐛 Troubleshooting

### Ошибка: "Cannot find module"
```bash
# Удалите node_modules и переустановите
rm -rf node_modules package-lock.json
npm install
```

### Ошибка: TypeScript errors
```bash
# Проверьте типы
npm run type-check
```

### Ошибка: Supabase connection
- Проверьте `.env.local` файл
- Убедитесь, что ключи правил��ные
- Проверьте RLS политики в Supabase

## ✅ Проверка установки

После `npm run dev` вы должны увидеть:
1. ✅ Landing page на http://localhost:3000
2. ✅ "Supabase Connected" статус
3. ✅ Без TypeScript ошибок
4. ✅ Tailwind стили работают

## 📋 Следующие шаги

После успешного запуска:
1. ✅ Создайте `/dashboard` страницу
2. ✅ Добавьте аутентификацию
3. ✅ Создайте UI компоненты
4. ✅ Подключите к Supabase данным

---

**Готово к Фазе 3: Backend Edge Functions?**

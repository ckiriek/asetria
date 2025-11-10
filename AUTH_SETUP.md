# Настройка аутентификации - Простой способ

## Проблема
Ошибка "Database error querying schema" при попытке логина.

## Решение: Создать пользователя через Supabase Dashboard

### Шаг 1: Откройте Supabase Dashboard

Перейдите по ссылке:
```
https://supabase.com/dashboard/project/qtlpjxjlwrjindgybsfd/auth/users
```

### Шаг 2: Создайте пользователя

1. Нажмите кнопку **"Add user"** → **"Create new user"**

2. Заполните форму:
   - **Email**: `admin@democro.com`
   - **Password**: `demo123`
   - **Auto Confirm User**: ✅ **ОБЯЗАТЕЛЬНО включите!**

3. Нажмите **"Create user"**

### Шаг 3: Проверьте, что пользователь создан

В списке пользователей должен появиться:
- Email: admin@democro.com
- Status: ✅ Confirmed

### Шаг 4: Обновите public.users таблицу

Выполните этот SQL в **SQL Editor**:

```sql
-- Обновляем или создаем запись в public.users
INSERT INTO public.users (id, email, name, role, org_id)
SELECT 
  id,
  email,
  'Admin User',
  'admin',
  '00000000-0000-0000-0000-000000000001'
FROM auth.users
WHERE email = 'admin@democro.com'
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  org_id = EXCLUDED.org_id;
```

### Шаг 5: Проверьте настройки Auth

Перейдите в **Authentication** → **Settings**:

1. **Site URL**: Должен быть `http://localhost:3000` или `http://localhost:3001`
2. **Redirect URLs**: Добавьте:
   - `http://localhost:3000/**`
   - `http://localhost:3001/**`

### Шаг 6: Попробуйте залогиниться

1. Откройте http://localhost:3001/auth/login
2. Нажмите **"Use Demo Account"** или введите:
   - Email: `admin@democro.com`
   - Password: `demo123`
3. Должно работать! ✅

---

## Альтернатива: Временно отключить Auth

Если всё ещё не работает, можно временно отключить middleware для тестирования:

### Переименуйте middleware.ts

```bash
mv middleware.ts middleware.ts.disabled
```

Теперь можно зайти в `/dashboard` без логина для тестирования UI.

**Важно**: Не забудьте вернуть middleware обратно перед продакшеном!

```bash
mv middleware.ts.disabled middleware.ts
```

---

## Troubleshooting

### Ошибка: "Invalid login credentials"
- Убедитесь, что пользователь **Confirmed** (зеленая галочка)
- Попробуйте удалить и создать пользователя заново

### Ошибка: "Database error querying schema"
- Проверьте, что в `.env.local` правильные ключи (без переносов строк)
- Перезапустите dev сервер
- Очистите кеш: `rm -rf .next && npm run dev`

### Ошибка: "Email not confirmed"
- В Dashboard: Authentication → Users
- Найдите пользователя → три точки → "Confirm email"

---

## Проверка подключения к Supabase

Выполните в SQL Editor:

```sql
-- Проверка пользователя
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as confirmed,
  pub_u.role,
  pub_u.org_id
FROM auth.users u
LEFT JOIN public.users pub_u ON u.id = pub_u.id
WHERE u.email = 'admin@democro.com';
```

Должно вернуть:
- confirmed: `true`
- role: `admin`
- org_id: `00000000-0000-0000-0000-000000000001`

---

## Если ничего не помогает

Создайте новый Supabase проект с нуля:
1. Новый проект в Dashboard
2. Примените миграции из `supabase/migrations/`
3. Обновите ключи в `.env.local`
4. Создайте пользователя через Dashboard

Иногда проще начать с чистого листа, чем отлаживать проблемы с Auth.

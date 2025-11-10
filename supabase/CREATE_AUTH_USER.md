# Создание пользователя для аутентификации

## Вариант 1: Через Supabase Dashboard (Рекомендуется)

1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/qtlpjxjlwrjindgybsfd

2. Перейдите в **Authentication** → **Users**

3. Нажмите **Add User** → **Create new user**

4. Заполните:
   - **Email**: `admin@democro.com`
   - **Password**: `demo123`
   - **Auto Confirm User**: ✅ (включите!)

5. Нажмите **Create User**

6. Пользователь создан! Теперь можно логиниться.

---

## Вариант 2: Через SQL (если нужно)

Выполните этот SQL в **SQL Editor** в Supabase Dashboard:

```sql
-- Создаем пользователя в auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000012', -- Тот же ID что в seed.sql
  'authenticated',
  'authenticated',
  'admin@democro.com',
  crypt('demo123', gen_salt('bf')), -- Хеш пароля
  NOW(),
  NOW(),
  NOW(),
  '',
  '{"provider":"email","providers":["email"]}',
  '{}'
);

-- Создаем identity для email провайдера
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000012',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000012', 'email', 'admin@democro.com'),
  'email',
  NOW(),
  NOW(),
  NOW()
);
```

**Важно**: Убедитесь, что UUID пользователя совпадает с тем, что в `seed.sql` (00000000-0000-0000-0000-000000000012)

---

## Вариант 3: Через API (программно)

```bash
curl -X POST 'https://qtlpjxjlwrjindgybsfd.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@democro.com",
    "password": "demo123"
  }'
```

---

## Проверка

После создания пользователя:

1. Откройте http://localhost:3000/auth/login
2. Введите:
   - Email: `admin@democro.com`
   - Password: `demo123`
3. Или нажмите **Use Demo Account**
4. Вы должны попасть в Dashboard!

---

## Troubleshooting

### Ошибка "Invalid login credentials"
- Проверьте, что пользователь создан в Authentication → Users
- Проверьте, что **Email Confirmed** = true
- Попробуйте пересоздать пользователя

### Ошибка "User already registered"
- Пользователь уже существует, просто логиньтесь

### Middleware редиректит на /auth/login
- Это нормально! Middleware защищает `/dashboard` от неавторизованных пользователей
- Залогиньтесь и всё заработает

---

## Создание дополнительных пользователей

Для других ролей (medical_writer, reviewer, viewer):

```sql
-- Medical Writer
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, confirmation_token,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000013',
  'authenticated', 'authenticated',
  'writer@democro.com',
  crypt('demo123', gen_salt('bf')),
  NOW(), NOW(), NOW(), '',
  '{"provider":"email","providers":["email"]}', '{}'
);
```

Не забудьте также создать соответствующую запись в таблице `users`!

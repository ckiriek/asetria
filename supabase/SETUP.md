# Supabase Setup Guide для Asetria

## Шаг 1: Создание проекта в Supabase

### Вариант A: Через Supabase Dashboard (Рекомендуется для продакшена)

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект:
   - **Name**: `asetria-prod` (или `asetria-dev` для разработки)
   - **Database Password**: Сохраните надежный пароль
   - **Region**: Выберите ближайший регион (например, `eu-central-1` для Европы)
   - **Pricing Plan**: Free для MVP, Pro для продакшена

3. Дождитесь создания проекта (~2 минуты)

### Вариант B: Локальная разработка с Supabase CLI

```bash
# Установите Supabase CLI
brew install supabase/tap/supabase

# Инициализируйте проект
cd /Users/mitchkiriek/asetria
supabase init

# Запустите локальный Supabase
supabase start
```

## Шаг 2: Применение миграций

### Для облачного проекта:

1. Получите connection string из Settings → Database
2. Примените миграции:

```bash
# Через Supabase Dashboard
# SQL Editor → New Query → Скопируйте содержимое файлов миграций по порядку:
# 1. supabase/migrations/00001_initial_schema.sql
# 2. supabase/migrations/00002_rls_policies.sql
# 3. supabase/seed.sql (опционально, для тестовых данных)
```

### Для локального проекта:

```bash
# Миграции применятся автоматически при запуске
supabase start

# Или примените вручную
supabase db reset
```

## Шаг 3: Настройка Storage Buckets

Создайте два bucket'а в Storage:

### 1. Bucket "documents"
```sql
-- Через SQL Editor или Dashboard → Storage → New Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Политики доступа
CREATE POLICY "Users can upload documents to their org projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can read documents from their org projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);
```

### 2. Bucket "terms"
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('terms', 'terms', true);

CREATE POLICY "Anyone can read term files"
ON storage.objects FOR SELECT
USING (bucket_id = 'terms');

CREATE POLICY "Admins can upload term files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'terms' 
  AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
```

## Шаг 4: Настройка Authentication

1. Перейдите в **Authentication → Providers**
2. Включите Email provider:
   - ✅ Enable Email provider
   - ✅ Confirm email (для продакшена)
   - ✅ Secure email change

3. (Опционально) Настройте OAuth провайдеры:
   - Google OAuth для удобного входа
   - Azure AD для корпоративных клиентов

4. Настройте Email Templates:
   - **Confirm signup**: Кастомизируйте под бренд Asetria
   - **Reset password**: Добавьте ссылку на ваш домен

## Шаг 5: Получение API ключей

1. Перейдите в **Settings → API**
2. Скопируйте следующие значения:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Anon (public) key - для клиентской части
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role key - ТОЛЬКО для серверной части и Edge Functions
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **ВАЖНО**: Service role key обходит RLS - используйте только на сервере!

## Шаг 6: Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Azure OpenAI (получите из Azure Portal)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# External APIs
OPENFDA_API_KEY=your-openfda-key (опционально, есть rate limit без ключа)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Шаг 7: Загрузка MedDRA subset

1. Скачайте MedDRA subset CSV (бесплатная версия)
2. Загрузите в bucket `terms`:

```bash
# Через Supabase CLI
supabase storage cp meddra_subset.csv supabase://terms/meddra_subset.csv

# Или через Dashboard → Storage → terms → Upload
```

3. Импортируйте в таблицу `term_ontology`:

```sql
-- Создайте временную таблицу для импорта
CREATE TEMP TABLE meddra_import (
  term TEXT,
  code TEXT,
  parent_code TEXT,
  level INT
);

-- Импортируйте CSV (через Dashboard или COPY command)
COPY meddra_import FROM '/path/to/meddra_subset.csv' CSV HEADER;

-- Вставьте в term_ontology
INSERT INTO term_ontology (term, source, code, parent_code, level)
SELECT term, 'MedDRA', code, parent_code, level
FROM meddra_import;
```

## Шаг 8: Проверка установки

Выполните следующие проверки:

```sql
-- 1. Проверьте таблицы
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Должно быть 11 таблиц:
-- audit_log, document_links, documents, entities_corpus, 
-- evidence_sources, integrations, organizations, projects, 
-- term_ontology, users, validation_rules

-- 2. Проверьте RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Все таблицы должны иметь rowsecurity = true

-- 3. Проверьте seed данные
SELECT * FROM organizations;
SELECT * FROM users;
SELECT * FROM projects;

-- 4. Проверьте validation rules
SELECT COUNT(*) FROM validation_rules WHERE document_type = 'IB';
-- Должно быть 14 правил для IB
```

## Шаг 9: Настройка Edge Functions (следующая фаза)

Edge Functions будут настроены в Фазе 3. Пока подготовьте:

```bash
# Создайте директорию для функций
mkdir -p supabase/functions
```

## Troubleshooting

### Ошибка: "relation does not exist"
- Убедитесь, что миграции применены в правильном порядке
- Проверьте, что вы в правильной схеме (public)

### Ошибка: "permission denied for table"
- Проверьте RLS политики
- Убедитесь, что пользователь аутентифицирован
- Для тестирования можете временно отключить RLS: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

### Ошибка при загрузке в Storage
- Проверьте политики Storage
- Убедитесь, что bucket существует
- Проверьте размер файла (лимит 50MB по умолчанию)

## Следующие шаги

После завершения настройки Supabase:
1. ✅ Переходите к **Фазе 2**: Настройка Next.js проекта
2. Подключите Supabase клиент к фронтенду
3. Создайте базовую аутентификацию

## Полезные ссылки

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

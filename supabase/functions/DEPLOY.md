# Edge Functions Deployment Guide

## ✅ Созданные функции

### 1. generate-document
**Путь**: `supabase/functions/generate-document/index.ts`

**Назначение**: Генерация документов (IB, Protocol, ICF, Synopsis) с использованием AI

**Входные данные**:
```typescript
{
  projectId: string
  documentType: 'IB' | 'Protocol' | 'ICF' | 'Synopsis'
  userId: string
}
```

**Что делает**:
1. Загружает данные проекта из БД
2. Собирает entities из `entities_corpus`
3. Загружает evidence sources (ClinicalTrials.gov, PubMed, openFDA)
4. Формирует контекст для AI
5. Генерирует документ (placeholder, Azure OpenAI будет в Фазе 4)
6. Создает запись в таблице `documents`
7. Логирует в `audit_log`

### 2. validate-document
**Путь**: `supabase/functions/validate-document/index.ts`

**Назначение**: Валидация документов по правилам ICH/FDA

**Входные данные**:
```typescript
{
  documentId: string
  documentType: 'IB' | 'Protocol' | 'ICF' | 'Synopsis'
  content: string
}
```

**Что делает**:
1. Загружает validation rules для типа документа
2. Проверяет каждое правило:
   - `required`: наличие обязательных секций
   - `completeness`: достаточность контента
   - `format`: форматирование
   - `consistency`: консистентность терминологии
3. Вычисляет completeness score (%)
4. Обновляет статус документа
5. Возвращает детальный отчет

## 🚀 Деплой функций

### Вариант A: Через Supabase CLI (Рекомендуется)

#### 1. Установите Supabase CLI
```bash
brew install supabase/tap/supabase
```

#### 2. Залогиньтесь
```bash
supabase login
```

#### 3. Свяжите проект
```bash
cd /Users/mitchkiriek/asetria
supabase link --project-ref qtlpjxjlwrjindgybsfd
```

#### 4. Деплой функций
```bash
# Деплой всех функций
supabase functions deploy

# Или по отдельности
supabase functions deploy generate-document
supabase functions deploy validate-document
```

#### 5. Установите переменные окружения
```bash
# Для каждой функции нужны эти переменные
supabase secrets set SUPABASE_URL=https://qtlpjxjlwrjindgybsfd.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Для Azure OpenAI (добавим позже)
supabase secrets set AZURE_OPENAI_ENDPOINT=your-endpoint
supabase secrets set AZURE_OPENAI_API_KEY=your-key
supabase secrets set AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### Вариант B: Через Supabase Dashboard

1. Откройте Dashboard: https://supabase.com/dashboard/project/qtlpjxjlwrjindgybsfd/functions
2. Нажмите "Deploy new function"
3. Скопируйте код из `supabase/functions/[function-name]/index.ts`
4. Установите переменные окружения в Settings

## 🧪 Тестирование функций

### Локальное тестирование

```bash
# Запустите локальный Supabase
supabase start

# Запустите функцию локально
supabase functions serve generate-document --env-file .env.local

# В другом терминале протестируйте
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-document' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"projectId":"00000000-0000-0000-0000-000000000021","documentType":"IB","userId":"00000000-0000-0000-0000-000000000012"}'
```

### Тестирование в продакшене

```bash
# Через curl
curl -i --location --request POST 'https://qtlpjxjlwrjindgybsfd.supabase.co/functions/v1/generate-document' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"projectId":"00000000-0000-0000-0000-000000000021","documentType":"IB","userId":"00000000-0000-0000-0000-000000000012"}'
```

## 📝 API Routes (Next.js)

Созданы Next.js API routes для удобного вызова из фронтенда:

### POST /api/generate
```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'uuid',
    documentType: 'IB'
  })
})
```

### POST /api/validate
```typescript
const response = await fetch('/api/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentId: 'uuid',
    documentType: 'IB',
    content: 'document content...'
  })
})
```

## 🔍 Мониторинг

### Логи функций
```bash
# Через CLI
supabase functions logs generate-document

# Или в Dashboard
https://supabase.com/dashboard/project/qtlpjxjlwrjindgybsfd/logs/edge-functions
```

### Метрики
- Invocations count
- Error rate
- Execution time
- Memory usage

## ⚠️ Важные замечания

1. **Lint ошибки в IDE**: Нормальны для Deno Edge Functions - они используют Deno runtime, не Node.js
2. **CORS**: Настроен для всех origins (`*`), в продакшене ограничьте
3. **Аутентификация**: API routes проверяют auth, Edge Functions получают userId из запроса
4. **Rate limiting**: Supabase имеет лимиты на Free tier (500K invocations/месяц)
5. **Timeout**: Edge Functions имеют timeout 150 секунд

## 🔄 Следующие шаги

1. ✅ Деплой функций в Supabase
2. ✅ Протестировать через curl или Postman
3. ➡️ Фаза 4: Интеграция Azure OpenAI для реальной генерации
4. ➡️ Фаза 4: Добавить интеграции с внешними API

## 📚 Полезные ссылки

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy)
- [Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

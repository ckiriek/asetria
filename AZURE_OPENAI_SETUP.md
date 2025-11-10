# ✅ Azure OpenAI настроен!

## Credentials

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-large
```

**⚠️ Important:** Replace with your actual credentials in `.env.local` (never commit real keys!)

## Что сделано

1. ✅ Добавлены credentials в `.env.local`
2. ✅ Обновлен `lib/integrations/azure-openai.ts`
3. ✅ Обновлена Edge Function `generate-document`
4. ✅ Установлены секреты в Supabase: `supabase secrets set`
5. ✅ Задеплоены Edge Functions:
   - `generate-document`
   - `validate-document`

## Тестирование

### 1. Через UI (Рекомендуется)

1. Откройте проект в Dashboard
2. Нажмите "Generate Document" → выберите тип (IB, Protocol, ICF, Synopsis)
3. Подождите 10-30 секунд
4. Документ должен сгенерироваться с реальным контентом от GPT-4.1!

### 2. Через API (для отладки)

```bash
curl -X POST 'http://localhost:3000/api/generate' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: YOUR_SESSION_COOKIE' \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "documentType": "IB"
  }'
```

### 3. Напрямую Edge Function

```bash
curl -X POST 'https://qtlpjxjlwrjindgybsfd.supabase.co/functions/v1/generate-document' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "documentType": "IB",
    "userId": "YOUR_USER_ID"
  }'
```

## Мониторинг

### Логи Edge Functions

```bash
# В реальном времени
supabase functions logs generate-document --project-ref qtlpjxjlwrjindgybsfd

# Или в Dashboard
https://supabase.com/dashboard/project/qtlpjxjlwrjindgybsfd/logs/edge-functions
```

### Проверка секретов

```bash
supabase secrets list --project-ref qtlpjxjlwrjindgybsfd
```

## Стоимость Azure OpenAI

### GPT-4.1 (gpt-4-turbo)
- **Input**: ~$10 per 1M tokens
- **Output**: ~$30 per 1M tokens

### Примерная стоимость генерации IB:
- Input: ~2000 tokens (контекст проекта) = $0.02
- Output: ~4000 tokens (документ) = $0.12
- **Итого**: ~$0.14 за документ

### Оптимизация:
- Кешировать контекст проекта
- Использовать более дешевую модель для черновиков
- Batch processing для нескольких документов

## Troubleshooting

### Ошибка: "Azure OpenAI not configured"
- Проверьте `.env.local` - все переменные заполнены?
- Перезапустите dev сервер: `npm run dev`

### Ошибка: "Invalid API key"
- Проверьте, что API key правильный
- Проверьте, что endpoint правильный (с `/` в конце)

### Ошибка: "Deployment not found"
- Проверьте имя deployment: `gpt-4.1`
- В Azure Portal: AI Services → Deployments

### Ошибка: "Rate limit exceeded"
- Azure OpenAI имеет лимиты на TPM (tokens per minute)
- Увеличьте квоту в Azure Portal
- Или добавьте retry logic с exponential backoff

### Edge Function timeout
- Edge Functions имеют timeout 150 секунд
- Для длинных документов используйте streaming
- Или разбейте на несколько запросов

## Следующие шаги

1. ✅ Протестировать генерацию всех типов документов
2. ✅ Проверить качество генерации
3. ✅ Настроить промпты для лучших результатов
4. ⏳ Добавить streaming для real-time генерации
5. ⏳ Кеширование контекста проекта
6. ⏳ Мониторинг стоимости и использования

## Полезные ссылки

- [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [GPT-4 Turbo Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#gpt-4-turbo-and-gpt-4)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

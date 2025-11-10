# External API Integrations

## ✅ Созданные интеграции

### 1. ClinicalTrials.gov
**Файл**: `clinicaltrials.ts`

**API**: https://clinicaltrials.gov/data-api/api

**Функции**:
- `searchByCondition(condition, limit)` - Поиск по заболеванию
- `searchByIntervention(intervention, limit)` - Поиск по препарату
- `getStudy(nctId)` - Получить конкретное исследование

**Пример использования**:
```typescript
import { clinicalTrialsClient } from '@/lib/integrations/clinicaltrials'

const trials = await clinicalTrialsClient.searchByCondition('diabetes', 10)
console.log(trials[0].title, trials[0].phase)
```

**API Route**: `GET /api/integrations/clinicaltrials?query=diabetes&type=condition&limit=10`

---

### 2. PubMed/NCBI Entrez
**Файл**: `pubmed.ts`

**API**: https://www.ncbi.nlm.nih.gov/books/NBK25501/

**Функции**:
- `search(query, limit)` - Поиск публикаций
- `getArticle(pmid)` - Получить статью по PMID

**Пример использования**:
```typescript
import { pubMedClient } from '@/lib/integrations/pubmed'

const articles = await pubMedClient.search('GLP-1 agonist diabetes', 10)
console.log(articles[0].title, articles[0].authors)
```

**API Route**: `GET /api/integrations/pubmed?query=GLP-1+agonist&limit=10`

**Важно**: 
- Требуется email в запросах (уже настроен)
- Rate limit: 3 requests/second без API key, 10 requests/second с API key

---

### 3. openFDA
**Файл**: `openfda.ts`

**API**: https://open.fda.gov/apis/

**Функции**:
- `searchAdverseEvents(drugName, limit)` - Поиск побочных эффектов
- `getDrugLabel(drugName)` - Получить информацию о препарате
- `getSafetySummary(drugName)` - Сводка по безопасности

**Пример использования**:
```typescript
import { openFDAClient } from '@/lib/integrations/openfda'

const events = await openFDAClient.searchAdverseEvents('semaglutide', 10)
const summary = await openFDAClient.getSafetySummary('semaglutide')
console.log(`Total events: ${summary.totalEvents}`)
```

**API Routes**:
- `GET /api/integrations/openfda?drug=semaglutide&type=events&limit=10`
- `GET /api/integrations/openfda?drug=semaglutide&type=label`
- `GET /api/integrations/openfda?drug=semaglutide&type=summary`

**Важно**:
- API key опциональный (есть rate limit без ключа: 240 requests/minute)
- Добавьте `OPENFDA_API_KEY` в `.env.local` для увеличения лимита

---

### 4. Azure OpenAI
**Файл**: `azure-openai.ts`

**API**: https://learn.microsoft.com/en-us/azure/ai-services/openai/

**Функции**:
- `generateCompletion(messages, options)` - Генерация текста
- `generateDocument(documentType, context, systemPrompt)` - Генерация документа
- `isConfigured()` - Проверка конфигурации

**Пример использования**:
```typescript
import { azureOpenAIClient } from '@/lib/integrations/azure-openai'

const response = await azureOpenAIClient.generateCompletion([
  { role: 'system', content: 'You are a medical writer' },
  { role: 'user', content: 'Generate an IB summary' }
])
console.log(response.content)
```

**Конфигурация** (в `.env.local`):
```bash
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

**Важно**:
- Требуется Azure подписка и развернутая модель
- Рекомендуется gpt-4o или gpt-4-turbo для медицинских документов
- Стоимость: ~$0.03 за 1K tokens (input) + $0.06 за 1K tokens (output)

---

## 🔧 Использование в Edge Functions

Edge Functions автоматически используют эти интеграции:

### generate-document
```typescript
// Автоматически:
// 1. Загружает данные из ClinicalTrials.gov
// 2. Ищет публикации в PubMed
// 3. Получает safety data из openFDA
// 4. Генерирует документ через Azure OpenAI
```

### Пример контекста для AI:
```json
{
  "project": {
    "title": "AST-101 Phase 2 Trial",
    "phase": "Phase 2",
    "indication": "Type 2 Diabetes"
  },
  "entities": {
    "compound": { "AST-101": {...} },
    "indication": { "type_2_diabetes": {...} }
  },
  "evidence": {
    "clinical_trials": [...],
    "publications": [...],
    "safety_data": [...]
  }
}
```

---

## 📊 Rate Limits

| API | Free Tier | With API Key |
|-----|-----------|--------------|
| ClinicalTrials.gov | Unlimited | N/A |
| PubMed | 3 req/sec | 10 req/sec |
| openFDA | 240 req/min | 1000 req/min |
| Azure OpenAI | N/A | Pay-per-use |

---

## 🧪 Тестирование

### Локальное тестирование
```bash
# Запустите dev сервер
npm run dev

# Тестируйте API routes
curl http://localhost:3000/api/integrations/clinicaltrials?query=diabetes&limit=5
curl http://localhost:3000/api/integrations/pubmed?query=GLP-1&limit=5
curl http://localhost:3000/api/integrations/openfda?drug=semaglutide&type=summary
```

### Тестирование клиентов напрямую
```typescript
// В Next.js API route или Server Component
import { clinicalTrialsClient } from '@/lib/integrations/clinicaltrials'

const results = await clinicalTrialsClient.searchByCondition('diabetes', 5)
console.log(results)
```

---

## ⚠️ Важные замечания

1. **Аутентификация**: Все API routes проверяют Supabase auth
2. **Error handling**: Все клиенты возвращают пустые массивы при ошибках (не бросают исключения)
3. **Caching**: Рекомендуется кешировать результаты в `evidence_sources` таблице
4. **CORS**: API routes работают только с вашего домена
5. **Rate limiting**: Следите за лимитами, особенно для PubMed

---

## 🔄 Следующие шаги

1. ✅ Получите Azure OpenAI credentials
2. ✅ (Опционально) Получите openFDA API key
3. ✅ Протестируйте каждую интеграцию
4. ➡️ Фаза 5: Создайте UI для работы с интеграциями

---

## 📚 Полезные ссылки

- [ClinicalTrials.gov API Docs](https://clinicaltrials.gov/data-api/api)
- [PubMed E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
- [openFDA API](https://open.fda.gov/apis/)
- [Azure OpenAI Service](https://learn.microsoft.com/en-us/azure/ai-services/openai/)

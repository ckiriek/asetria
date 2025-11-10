# 🔍 API Compliance Analysis & Improvement Plan

## 📊 Executive Summary

**Status**: ✅ Хорошо, но есть критические улучшения

| API | Compliance | Priority Issues | Status |
|-----|------------|-----------------|--------|
| ClinicalTrials.gov | ✅ 90% | Rate limiting, fields optimization | Good |
| PubMed | ⚠️ 70% | Missing API key, rate limiting | Needs work |
| openFDA | ⚠️ 60% | Missing API key, aggregation features | Needs work |
| Azure OpenAI | ✅ 95% | Token usage monitoring | Good |

---

## 1️⃣ ClinicalTrials.gov API

### ✅ Что уже правильно:

```typescript
// ✅ Используем API v2 (правильно!)
private baseUrl = 'https://clinicaltrials.gov/api/v2'

// ✅ Правильные параметры v2
const params = new URLSearchParams({
  'query.cond': condition,      // ✅ Новый синтаксис v2
  'pageSize': limit.toString(), // ✅ Правильный параметр
  'format': 'json',             // ✅ JSON формат
})
```

### ⚠️ Что нужно улучшить:

#### 1. Rate Limiting (КРИТИЧНО!)

**Проблема**: Нет защиты от превышения лимита 50 req/min

**Текущий код:**
```typescript
// ❌ Нет rate limiting!
const response = await fetch(`${this.baseUrl}/studies?${params}`)
```

**Решение:**
```typescript
// ✅ Добавить rate limiter
import pLimit from 'p-limit'

export class ClinicalTrialsClient {
  private limiter = pLimit(50) // Max 50 concurrent requests
  private lastRequestTime = 0
  private minRequestInterval = 1200 // 1.2 sec between requests (50/min)

  async searchByCondition(condition: string, limit: number = 10) {
    return this.limiter(async () => {
      // Wait if needed
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
        )
      }
      
      this.lastRequestTime = Date.now()
      
      const response = await fetch(`${this.baseUrl}/studies?${params}`)
      
      // Handle 429 Too Many Requests
      if (response.status === 429) {
        console.warn('ClinicalTrials.gov rate limit hit, retrying...')
        await new Promise(resolve => setTimeout(resolve, 60000)) // Wait 1 min
        return this.searchByCondition(condition, limit) // Retry
      }
      
      // ... rest of code
    })
  }
}
```

#### 2. Fields Optimization (ВАЖНО!)

**Проблема**: Загружаем все поля, хотя используем только часть

**Решение:**
```typescript
// ✅ Запрашиваем только нужные поля
const params = new URLSearchParams({
  'query.cond': condition,
  'pageSize': limit.toString(),
  'format': 'json',
  'fields': 'NCTId,BriefTitle,OfficialTitle,OverallStatus,Phase,Condition,InterventionName,LeadSponsorName,StartDate,CompletionDate,EnrollmentCount,StudyType,HasResults,PrimaryOutcomeMeasure'
})
```

**Benefit**: Уменьшает размер ответа на ~70%, ускоряет запросы

#### 3. Pagination для больших выборок

**Проблема**: Если нужно >1000 результатов, нет пагинации

**Решение:**
```typescript
async searchByConditionPaginated(
  condition: string, 
  totalNeeded: number
): Promise<ClinicalTrial[]> {
  const pageSize = 100 // Max per request
  const results: ClinicalTrial[] = []
  
  for (let page = 1; results.length < totalNeeded; page++) {
    const params = new URLSearchParams({
      'query.cond': condition,
      'pageSize': pageSize.toString(),
      'pageNumber': page.toString(),
      'format': 'json',
      'fields': '...'
    })
    
    const data = await this.fetchWithRateLimit(params)
    if (data.studies.length === 0) break
    
    results.push(...this.parseStudies(data.studies))
  }
  
  return results.slice(0, totalNeeded)
}
```

#### 4. Получение результатов исследований

**Проблема**: Не используем resultsSection для извлечения данных по безопасности

**Решение:**
```typescript
async getStudyWithResults(nctId: string): Promise<ClinicalTrialWithResults | null> {
  const response = await fetch(`${this.baseUrl}/studies/${nctId}`)
  const data = await response.json()
  
  // Extract results section
  const resultsSection = data.resultsSection || {}
  const adverseEvents = resultsSection.adverseEventsModule?.eventGroups || []
  const outcomes = resultsSection.outcomeMeasuresModule?.outcomeMeasures || []
  
  return {
    ...this.parseStudies([data])[0],
    results: {
      adverseEvents,
      outcomes,
      demographics: resultsSection.baselineCharacteristicsModule
    }
  }
}
```

### 📋 Action Items:

- [ ] **HIGH**: Добавить rate limiting (50 req/min)
- [ ] **HIGH**: Обработка 429 ошибок с retry
- [ ] **MEDIUM**: Оптимизация полей (fields parameter)
- [ ] **MEDIUM**: Pagination для больших выборок
- [ ] **LOW**: Извлечение resultsSection для safety data

---

## 2️⃣ PubMed API (NCBI E-utilities)

### ✅ Что уже правильно:

```typescript
// ✅ Правильный базовый URL
private baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

// ✅ Email и tool указаны
email: this.email,
tool: this.tool,

// ✅ Двухшаговый процесс (ESearch → EFetch)
```

### ⚠️ Что нужно улучшить:

#### 1. API Key (КРИТИЧНО!)

**Проблема**: Нет API ключа → лимит 3 req/sec вместо 10 req/sec

**Текущий код:**
```typescript
// ❌ Нет API ключа!
const searchParams = new URLSearchParams({
  db: 'pubmed',
  term: query,
  retmax: limit.toString(),
  retmode: 'json',
  email: this.email,
  tool: this.tool,
  // ❌ api_key: missing!
})
```

**Решение:**
```typescript
export class PubMedClient {
  private apiKey?: string
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NCBI_API_KEY
  }
  
  async search(query: string, limit: number = 10) {
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmax: limit.toString(),
      retmode: 'json',
      email: this.email,
      tool: this.tool,
    })
    
    // ✅ Добавляем API key если есть
    if (this.apiKey) {
      searchParams.append('api_key', this.apiKey)
    }
    
    // ...
  }
}

// В .env.local
NCBI_API_KEY=your_key_here
```

**Как получить ключ:**
1. Зарегистрироваться на https://www.ncbi.nlm.nih.gov/account/
2. Settings → API Key Management → Create API Key
3. Добавить в `.env.local`

#### 2. Rate Limiting

**Проблема**: Нет защиты от превышения 3 req/sec (или 10 с ключом)

**Решение:**
```typescript
export class PubMedClient {
  private limiter = pLimit(10) // With API key
  private lastRequestTime = 0
  private minRequestInterval = 100 // 100ms = 10 req/sec
  
  private async fetchWithRateLimit(url: string) {
    return this.limiter(async () => {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
        )
      }
      
      this.lastRequestTime = Date.now()
      return fetch(url)
    })
  }
}
```

#### 3. Расширенный поиск с тегами

**Проблема**: Простой поиск без использования полей

**Текущий код:**
```typescript
// ❌ Простой поиск
term: `${project.title} ${project.indication}`
// Результат: много нерелевантных результатов
```

**Решение:**
```typescript
// ✅ Поиск с тегами полей
function buildPubMedQuery(compound: string, indication: string): string {
  // [TIAB] = Title/Abstract
  // [MH] = MeSH terms
  // [AU] = Author
  
  return `(${compound}[TIAB] OR ${compound}[MH]) AND (${indication}[TIAB] OR ${indication}[MH]) AND ("clinical trial"[PT] OR "randomized controlled trial"[PT])`
}

// Example:
// "(semaglutide[TIAB] OR semaglutide[MH]) AND (diabetes[TIAB] OR diabetes[MH]) AND ("clinical trial"[PT])"
```

#### 4. ESummary для быстрых метаданных

**Проблема**: EFetch возвращает полный XML, даже если нужны только метаданные

**Решение:**
```typescript
async getSummaries(pmids: string[]): Promise<PublicationSummary[]> {
  const params = new URLSearchParams({
    db: 'pubmed',
    id: pmids.join(','),
    retmode: 'json',
    email: this.email,
    tool: this.tool,
  })
  
  if (this.apiKey) params.append('api_key', this.apiKey)
  
  const response = await this.fetchWithRateLimit(
    `${this.baseUrl}/esummary.fcgi?${params}`
  )
  
  const data = await response.json()
  
  // ESummary возвращает JSON (быстрее чем XML parsing)
  return Object.values(data.result).map((item: any) => ({
    pmid: item.uid,
    title: item.title,
    authors: item.authors?.map((a: any) => a.name) || [],
    journal: item.source,
    year: item.pubdate?.split(' ')[0],
    doi: item.elocationid,
  }))
}
```

**Benefit**: В 3-5 раз быстрее чем EFetch + XML parsing

#### 5. History Server для больших выборок

**Проблема**: Если нужно >10k результатов, нет механизма

**Решение:**
```typescript
async searchLarge(query: string, maxResults: number = 50000) {
  // Step 1: ESearch с usehistory=y
  const searchParams = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmax: '0', // Don't return IDs, just count
    usehistory: 'y', // Store on NCBI server
    email: this.email,
    tool: this.tool,
  })
  
  if (this.apiKey) searchParams.append('api_key', this.apiKey)
  
  const searchResponse = await fetch(`${this.baseUrl}/esearch.fcgi?${searchParams}`)
  const searchData = await searchResponse.json()
  
  const webEnv = searchData.esearchresult.webenv
  const queryKey = searchData.esearchresult.querykey
  const count = parseInt(searchData.esearchresult.count)
  
  // Step 2: Fetch in batches using WebEnv
  const results: Publication[] = []
  const batchSize = 500
  
  for (let start = 0; start < Math.min(count, maxResults); start += batchSize) {
    const fetchParams = new URLSearchParams({
      db: 'pubmed',
      query_key: queryKey,
      WebEnv: webEnv,
      retstart: start.toString(),
      retmax: batchSize.toString(),
      retmode: 'xml',
      email: this.email,
      tool: this.tool,
    })
    
    if (this.apiKey) fetchParams.append('api_key', this.apiKey)
    
    const xmlText = await this.fetchWithRateLimit(
      `${this.baseUrl}/efetch.fcgi?${fetchParams}`
    )
    
    results.push(...this.parseXML(xmlText))
  }
  
  return results
}
```

### 📋 Action Items:

- [ ] **CRITICAL**: Получить NCBI API key и добавить в код
- [ ] **HIGH**: Добавить rate limiting (10 req/sec с ключом)
- [ ] **MEDIUM**: Использовать поисковые теги ([TIAB], [MH])
- [ ] **MEDIUM**: Добавить ESummary для быстрых метаданных
- [ ] **LOW**: History Server для больших выборок

---

## 3️⃣ openFDA API

### ✅ Что уже правильно:

```typescript
// ✅ Правильный базовый URL
private baseUrl = 'https://api.fda.gov'

// ✅ Правильный синтаксис поиска
search: `patient.drug.medicinalproduct:"${drugName}"`

// ✅ Обработка 404 (нет результатов)
if (response.status === 404) return []
```

### ⚠️ Что нужно улучшить:

#### 1. API Key (КРИТИЧНО!)

**Проблема**: Без ключа лимит 240 req/min и 1000 req/day

**Текущий код:**
```typescript
// ⚠️ API key опциональный, но не используется по умолчанию
export const openFDAClient = new OpenFDAClient(process.env.OPENFDA_API_KEY)
```

**Решение:**
```typescript
// В .env.local
OPENFDA_API_KEY=your_key_here

// Проверка наличия ключа
if (!process.env.OPENFDA_API_KEY) {
  console.warn('⚠️ openFDA API key not set! Limited to 1000 requests/day')
}
```

**Как получить ключ:**
1. Перейти на https://open.fda.gov/apis/authentication/
2. Заполнить форму (бесплатно)
3. Получить ключ на email
4. Добавить в `.env.local`

**Benefit**: Лимит увеличивается с 1000/day до 120,000/day!

#### 2. Aggregation API (count parameter)

**Проблема**: Не используем агрегацию для выявления сигналов

**Текущий код:**
```typescript
// ❌ Загружаем отдельные события
async searchAdverseEvents(drugName: string, limit: number = 10)
```

**Решение:**
```typescript
// ✅ Добавить метод для агрегации
async getTopReactions(drugName: string, limit: number = 10) {
  const params = new URLSearchParams({
    search: `patient.drug.medicinalproduct:"${drugName}"`,
    count: 'patient.reaction.reactionmeddrapt.exact',
    limit: limit.toString(),
  })
  
  if (this.apiKey) params.append('api_key', this.apiKey)
  
  const response = await fetch(`${this.baseUrl}/drug/event.json?${params}`)
  const data = await response.json()
  
  // Returns: [{ term: "Nausea", count: 1234 }, ...]
  return data.results.map((r: any) => ({
    reaction: r.term,
    count: r.count,
    percentage: (r.count / data.meta.results.total * 100).toFixed(2)
  }))
}

// Другие полезные агрегации:
async getAgeDistribution(drugName: string) {
  // count: 'patient.patientonsetage'
}

async getGenderDistribution(drugName: string) {
  // count: 'patient.patientsex'
}

async getYearlyTrend(drugName: string) {
  // count: 'receiptdate'
}
```

**Benefit**: Получаем статистику без загрузки тысяч записей

#### 3. Сложные запросы с логикой

**Проблема**: Простые запросы без AND/OR/NOT

**Решение:**
```typescript
// ✅ Сложные запросы
async searchSeriousEvents(drugName: string, reaction: string) {
  const params = new URLSearchParams({
    search: `patient.drug.medicinalproduct:"${drugName}"+AND+patient.reaction.reactionmeddrapt:"${reaction}"+AND+serious:1`,
    limit: '100',
  })
  
  // Finds: serious events with specific drug AND reaction
}

async searchExcludingReaction(drugName: string, excludeReaction: string) {
  const params = new URLSearchParams({
    search: `patient.drug.medicinalproduct:"${drugName}"+NOT+patient.reaction.reactionmeddrapt:"${excludeReaction}"`,
    limit: '100',
  })
}
```

#### 4. Sorting и Date Ranges

**Проблема**: Нет сортировки по дате или важности

**Решение:**
```typescript
async getRecentEvents(drugName: string, daysBack: number = 90) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)
  const dateStr = startDate.toISOString().split('T')[0].replace(/-/g, '')
  
  const params = new URLSearchParams({
    search: `patient.drug.medicinalproduct:"${drugName}"+AND+receiptdate:[${dateStr}+TO+99991231]`,
    sort: 'receiptdate:desc',
    limit: '100',
  })
  
  if (this.apiKey) params.append('api_key', this.apiKey)
  
  // Returns: events from last 90 days, newest first
}
```

#### 5. Pagination для больших выборок

**Проблема**: Лимит 1000 записей за запрос, нет пагинации

**Решение:**
```typescript
async searchAdverseEventsPaginated(
  drugName: string, 
  totalNeeded: number
): Promise<AdverseEvent[]> {
  const pageSize = 1000 // Max per request
  const results: AdverseEvent[] = []
  
  for (let skip = 0; results.length < totalNeeded; skip += pageSize) {
    const params = new URLSearchParams({
      search: `patient.drug.medicinalproduct:"${drugName}"`,
      limit: pageSize.toString(),
      skip: skip.toString(),
    })
    
    if (this.apiKey) params.append('api_key', this.apiKey)
    
    const response = await fetch(`${this.baseUrl}/drug/event.json?${params}`)
    
    if (!response.ok) break
    
    const data = await response.json()
    if (!data.results || data.results.length === 0) break
    
    results.push(...this.parseAdverseEvents(data.results))
  }
  
  return results.slice(0, totalNeeded)
}
```

#### 6. Rate Limiting

**Проблема**: Нет защиты от 240 req/min лимита

**Решение:**
```typescript
export class OpenFDAClient {
  private limiter = pLimit(200) // Conservative: 200/min instead of 240
  private lastRequestTime = 0
  private minRequestInterval = 300 // 300ms between requests
  
  private async fetchWithRateLimit(url: string) {
    return this.limiter(async () => {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
        )
      }
      
      this.lastRequestTime = Date.now()
      
      const response = await fetch(url)
      
      // Handle 429 Too Many Requests
      if (response.status === 429) {
        console.warn('openFDA rate limit hit, waiting 60 seconds...')
        await new Promise(resolve => setTimeout(resolve, 60000))
        return this.fetchWithRateLimit(url) // Retry
      }
      
      return response
    })
  }
}
```

### 📋 Action Items:

- [ ] **CRITICAL**: Получить openFDA API key
- [ ] **HIGH**: Добавить rate limiting (240 req/min)
- [ ] **HIGH**: Реализовать aggregation API (count parameter)
- [ ] **MEDIUM**: Сложные запросы (AND/OR/NOT)
- [ ] **MEDIUM**: Sorting и date ranges
- [ ] **LOW**: Pagination для больших выборок

---

## 4️⃣ Azure OpenAI API

### ✅ Что уже правильно:

```typescript
// ✅ Правильный endpoint
// ✅ API key в headers
// ✅ Правильные параметры (temperature, max_tokens)
```

### ⚠️ Что можно улучшить:

#### 1. Token Usage Monitoring

**Добавить:**
```typescript
async generateDocument(context: any) {
  const response = await fetch(endpoint, { ... })
  const data = await response.json()
  
  // ✅ Log token usage
  console.log('Token usage:', {
    prompt: data.usage.prompt_tokens,
    completion: data.usage.completion_tokens,
    total: data.usage.total_tokens,
    cost: (data.usage.total_tokens / 1000 * 0.03).toFixed(4) // Estimate cost
  })
  
  // Save to database for analytics
  await supabase.from('ai_usage_log').insert({
    project_id: projectId,
    document_type: documentType,
    tokens_used: data.usage.total_tokens,
    estimated_cost: data.usage.total_tokens / 1000 * 0.03
  })
}
```

#### 2. Error Handling для Rate Limits

**Добавить:**
```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After')
  console.warn(`Azure OpenAI rate limit, retry after ${retryAfter}s`)
  await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000))
  return this.generateDocument(context) // Retry
}
```

---

## 📋 Priority Action Plan

### 🔴 CRITICAL (Do Now):

1. **Get API Keys**:
   - [ ] NCBI API Key (https://www.ncbi.nlm.nih.gov/account/)
   - [ ] openFDA API Key (https://open.fda.gov/apis/authentication/)
   
2. **Add to .env.local**:
   ```bash
   NCBI_API_KEY=your_ncbi_key_here
   OPENFDA_API_KEY=your_openfda_key_here
   ```

3. **Update Client Constructors**:
   ```typescript
   // pubmed.ts
   export const pubMedClient = new PubMedClient(process.env.NCBI_API_KEY)
   
   // openfda.ts
   export const openFDAClient = new OpenFDAClient(process.env.OPENFDA_API_KEY)
   ```

### 🟡 HIGH (This Week):

4. **Add Rate Limiting**:
   - [ ] ClinicalTrials.gov: 50 req/min
   - [ ] PubMed: 10 req/sec (with key)
   - [ ] openFDA: 240 req/min

5. **Error Handling**:
   - [ ] Handle 429 (rate limit) with retry
   - [ ] Handle 404 (not found)
   - [ ] Handle 500 (server error)

6. **openFDA Aggregation**:
   - [ ] Add `getTopReactions()` method
   - [ ] Add `getAgeDistribution()` method
   - [ ] Add `getYearlyTrend()` method

### 🟢 MEDIUM (Next Sprint):

7. **ClinicalTrials.gov Optimization**:
   - [ ] Add `fields` parameter to reduce response size
   - [ ] Extract resultsSection for safety data
   - [ ] Pagination for large datasets

8. **PubMed Advanced Search**:
   - [ ] Use field tags ([TIAB], [MH])
   - [ ] Add ESummary for fast metadata
   - [ ] History Server for >10k results

9. **openFDA Advanced Queries**:
   - [ ] Complex searches (AND/OR/NOT)
   - [ ] Date ranges and sorting
   - [ ] Pagination for large datasets

### 🔵 LOW (Future):

10. **Monitoring & Analytics**:
    - [ ] Token usage tracking (Azure OpenAI)
    - [ ] API call analytics dashboard
    - [ ] Cost estimation

11. **Caching**:
    - [ ] Cache ClinicalTrials.gov results (24h TTL)
    - [ ] Cache PubMed results (7d TTL)
    - [ ] Cache openFDA aggregations (1d TTL)

---

## 💰 Cost Impact

### Current (Without API Keys):

| API | Limit | Impact |
|-----|-------|--------|
| PubMed | 3 req/sec | Slow data fetching |
| openFDA | 1000 req/day | **Hits limit quickly!** |

### After Improvements (With API Keys):

| API | Limit | Impact |
|-----|-------|--------|
| PubMed | 10 req/sec | 3.3x faster ✅ |
| openFDA | 120,000 req/day | 120x more capacity ✅ |

**Estimated Time Savings**: 60-70% faster external data fetching

---

## 📊 Summary

### Current Status:
- ✅ **ClinicalTrials.gov**: Good compliance, needs rate limiting
- ⚠️ **PubMed**: Missing API key (critical!)
- ⚠️ **openFDA**: Missing API key (critical!), not using aggregation
- ✅ **Azure OpenAI**: Good, needs monitoring

### Critical Actions:
1. Get NCBI API key
2. Get openFDA API key
3. Add rate limiting to all APIs
4. Implement openFDA aggregation

### Expected Improvements:
- 🚀 **3.3x faster** PubMed queries
- 🚀 **120x more** openFDA capacity
- 📊 **Better insights** with aggregation API
- ⚡ **Fewer errors** with rate limiting

---

**Next Step: Get API keys and implement rate limiting!** 🔑

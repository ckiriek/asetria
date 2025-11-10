# 🌐 External API Integrations - Deep Dive

## 📊 Обзор

Asetria интегрируется с **4 внешними API** для получения данных:

| API | Что получаем | Зачем |
|-----|--------------|-------|
| **ClinicalTrials.gov** | Клинические испытания | Контекст похожих trials |
| **PubMed** | Научные публикации | Evidence-based данные |
| **openFDA** | Safety reports | Побочные эффекты |
| **Azure OpenAI** | AI-генерация | Создание документов |

---

## 1️⃣ ClinicalTrials.gov API

### 🎯 Что это?

**ClinicalTrials.gov** - база данных клинических испытаний от NIH (National Institutes of Health).

### 📡 API Details

**Base URL**: `https://clinicaltrials.gov/api/v2`  
**Authentication**: Не требуется  
**Rate Limit**: Unlimited  
**Format**: JSON  

### 🔍 Что запрашиваем?

#### Request 1: Search by Condition (Indication)

```http
GET https://clinicaltrials.gov/api/v2/studies?query.cond=Type+2+Diabetes&pageSize=10&format=json
```

**Parameters:**
- `query.cond` - Condition/disease (e.g., "Type 2 Diabetes")
- `pageSize` - Number of results (default: 10)
- `format` - Response format (json)

**Response:**
```json
{
  "studies": [
    {
      "protocolSection": {
        "identificationModule": {
          "nctId": "NCT12345678",
          "officialTitle": "A Phase 2 Study of Drug X in Type 2 Diabetes",
          "briefTitle": "Drug X for Diabetes"
        },
        "statusModule": {
          "overallStatus": "Recruiting",
          "startDateStruct": { "date": "2024-01-15" },
          "completionDateStruct": { "date": "2025-12-31" },
          "enrollmentInfo": { "count": 120 }
        },
        "designModule": {
          "phases": ["Phase 2"],
          "studyType": "Interventional"
        },
        "conditionsModule": {
          "conditions": ["Type 2 Diabetes Mellitus"]
        },
        "armsInterventionsModule": {
          "interventions": [
            { "name": "Drug X", "type": "Drug" }
          ]
        },
        "sponsorCollaboratorsModule": {
          "leadSponsor": { "name": "Pharma Company Inc" }
        }
      },
      "hasResults": false
    }
  ]
}
```

#### Request 2: Search by Intervention (Drug)

```http
GET https://clinicaltrials.gov/api/v2/studies?query.intr=semaglutide&pageSize=10&format=json
```

**Parameters:**
- `query.intr` - Intervention/drug name
- `pageSize` - Number of results
- `format` - json

#### Request 3: Get Specific Study

```http
GET https://clinicaltrials.gov/api/v2/studies/NCT12345678
```

### 📦 Что получаем?

**Parsed Data Structure:**
```typescript
interface ClinicalTrial {
  nctId: string              // "NCT12345678"
  title: string              // "A Phase 2 Study of Drug X..."
  status: string             // "Recruiting", "Completed", etc.
  phase: string[]            // ["Phase 2"]
  conditions: string[]       // ["Type 2 Diabetes Mellitus"]
  interventions: string[]    // ["Drug X", "Placebo"]
  sponsor: string            // "Pharma Company Inc"
  startDate: string          // "2024-01-15"
  completionDate?: string    // "2025-12-31"
  enrollment?: number        // 120
  studyType: string          // "Interventional"
  hasResults: boolean        // false
  resultsUrl?: string        // "https://clinicaltrials.gov/study/NCT12345678"
}
```

### 💡 Как используется?

```typescript
// В app/api/integrations/fetch-all/route.ts

const ctClient = new ClinicalTrialsClient()

// Search by indication
const trials = await ctClient.searchByCondition(project.indication, 10)
// Returns: Array of 10 ClinicalTrial objects

// Save to database
for (const trial of trials) {
  await supabase.from('evidence_sources').insert({
    project_id: projectId,
    source: 'ClinicalTrials.gov',
    external_id: trial.nctId,
    payload_json: trial
  })
}
```

### 🎯 Зачем нужно?

1. **Context для AI** - Показываем AI похожие trials
2. **Primary Endpoint** - Извлекаем most common endpoint
3. **Study Design** - Примеры дизайна для indication
4. **Enrollment** - Типичный размер выборки

---

## 2️⃣ PubMed API (NCBI E-utilities)

### 🎯 Что это?

**PubMed** - база данных медицинских публикаций от NCBI (National Center for Biotechnology Information).

### 📡 API Details

**Base URL**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils`  
**Authentication**: Email required (no API key needed)  
**Rate Limit**: 3 req/sec (free), 10 req/sec (with API key)  
**Format**: JSON (search) + XML (fetch)  

### 🔍 Что запрашиваем?

#### Step 1: Search for PMIDs

```http
GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=GLP-1+agonist+diabetes&retmax=10&retmode=json&email=asetria@example.com&tool=asetria
```

**Parameters:**
- `db` - Database (pubmed)
- `term` - Search query
- `retmax` - Max results (10)
- `retmode` - Response format (json)
- `email` - Required by NCBI
- `tool` - Application name

**Response:**
```json
{
  "esearchresult": {
    "count": "1234",
    "idlist": [
      "38123456",
      "38123457",
      "38123458",
      ...
    ]
  }
}
```

#### Step 2: Fetch Article Details

```http
GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=38123456,38123457&retmode=xml&email=asetria@example.com&tool=asetria
```

**Parameters:**
- `db` - Database (pubmed)
- `id` - Comma-separated PMIDs
- `retmode` - Response format (xml)
- `email` - Required
- `tool` - Application name

**Response (XML):**
```xml
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>38123456</PMID>
      <Article>
        <ArticleTitle>
          Efficacy of GLP-1 Agonists in Type 2 Diabetes: A Meta-Analysis
        </ArticleTitle>
        <Journal>
          <Title>Diabetes Care</Title>
        </Journal>
        <AuthorList>
          <Author>
            <LastName>Smith</LastName>
            <ForeName>John</ForeName>
          </Author>
          <Author>
            <LastName>Doe</LastName>
            <ForeName>Jane</ForeName>
          </Author>
        </AuthorList>
        <Abstract>
          <AbstractText>
            Background: GLP-1 agonists have shown promise...
          </AbstractText>
        </Abstract>
      </Article>
      <PubDate>
        <Year>2024</Year>
      </PubDate>
    </MedlineCitation>
  </PubmedArticle>
</PubmedArticleSet>
```

### 📦 Что получаем?

**Parsed Data Structure:**
```typescript
interface Publication {
  pmid: string              // "38123456"
  title: string             // "Efficacy of GLP-1 Agonists..."
  authors: string[]         // ["Smith John", "Doe Jane"]
  journal: string           // "Diabetes Care"
  year: string              // "2024"
  abstract?: string         // "Background: GLP-1 agonists..."
  doi?: string              // "10.2337/dc24-0123"
  pubmedUrl: string         // "https://pubmed.ncbi.nlm.nih.gov/38123456/"
}
```

### 💡 Как используется?

```typescript
// В app/api/integrations/fetch-all/route.ts

const pubmedClient = new PubMedClient()

// Search by compound + indication
const searchTerm = `${project.title} ${project.indication}`
// Example: "AST-101 Type 2 Diabetes"

const publications = await pubmedClient.search(searchTerm, 10)
// Returns: Array of 10 Publication objects

// Save to database
for (const pub of publications) {
  await supabase.from('evidence_sources').insert({
    project_id: projectId,
    source: 'PubMed',
    external_id: pub.pmid,
    payload_json: pub
  })
}
```

### 🎯 Зачем нужно?

1. **Evidence-based data** - Научные доказательства
2. **Literature review** - Для IB Section 7 (Effects in Humans)
3. **Efficacy data** - Данные об эффективности
4. **Citations** - Ссылки для документов

---

## 3️⃣ openFDA API

### 🎯 Что это?

**openFDA** - база данных FDA (Food and Drug Administration) с информацией о препаратах, побочных эффектах, и т.д.

### 📡 API Details

**Base URL**: `https://api.fda.gov`  
**Authentication**: API key optional  
**Rate Limit**: 240 req/min (free), 1000 req/min (with key)  
**Format**: JSON  

### 🔍 Что запрашиваем?

#### Request 1: Adverse Events

```http
GET https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"metformin"&limit=10
```

**Parameters:**
- `search` - Search query (drug name)
- `limit` - Max results (10)
- `api_key` - Optional API key

**Response:**
```json
{
  "results": [
    {
      "receiptdate": "20240115",
      "serious": "1",
      "patient": {
        "drug": [
          {
            "medicinalproduct": "METFORMIN",
            "drugcharacterization": "1"
          }
        ],
        "reaction": [
          {
            "reactionmeddrapt": "Nausea",
            "reactionoutcome": "1"
          },
          {
            "reactionmeddrapt": "Diarrhea",
            "reactionoutcome": "1"
          }
        ],
        "patientonsetage": 65,
        "patientsex": "2"
      }
    }
  ]
}
```

#### Request 2: Drug Label

```http
GET https://api.fda.gov/drug/label.json?search=openfda.brand_name:"Glucophage" OR openfda.generic_name:"metformin"&limit=1
```

**Response:**
```json
{
  "results": [
    {
      "openfda": {
        "brand_name": ["Glucophage"],
        "generic_name": ["METFORMIN HYDROCHLORIDE"],
        "manufacturer_name": ["Bristol-Myers Squibb Company"]
      },
      "indications_and_usage": [
        "GLUCOPHAGE is indicated as an adjunct to diet..."
      ],
      "warnings": [
        "Lactic Acidosis: There have been postmarketing cases..."
      ],
      "adverse_reactions": [
        "The most common adverse reactions (>5%) are diarrhea, nausea/vomiting..."
      ],
      "dosage_and_administration": [
        "The usual starting dose is 500 mg twice daily..."
      ]
    }
  ]
}
```

#### Request 3: Safety Summary (Aggregated)

```http
GET https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"metformin"&count=patient.reaction.reactionmeddrapt.exact&limit=10
```

**Response:**
```json
{
  "results": [
    { "term": "Nausea", "count": 1234 },
    { "term": "Diarrhea", "count": 987 },
    { "term": "Abdominal pain", "count": 654 },
    { "term": "Vomiting", "count": 543 },
    ...
  ]
}
```

### 📦 Что получаем?

**Parsed Data Structures:**

```typescript
interface AdverseEvent {
  receiptDate: string       // "20240115"
  drugName: string          // "METFORMIN"
  reactions: string[]       // ["Nausea", "Diarrhea"]
  seriousness: string       // "Serious" or "Non-serious"
  outcomes: string[]        // ["Recovered", "Unknown"]
  patientAge?: number       // 65
  patientSex?: string       // "Male" or "Female"
}

interface DrugLabel {
  brandName: string         // "Glucophage"
  genericName: string       // "METFORMIN HYDROCHLORIDE"
  manufacturer: string      // "Bristol-Myers Squibb Company"
  indications?: string      // "GLUCOPHAGE is indicated..."
  warnings?: string         // "Lactic Acidosis: There have been..."
  adverseReactions?: string // "The most common adverse reactions..."
  dosage?: string           // "The usual starting dose is 500 mg..."
}
```

### 💡 Как используется?

```typescript
// В app/api/integrations/fetch-all/route.ts

const fdaClient = new OpenFDAClient()

// Priority search strategy:
let adverseEvents: any[] = []
let searchStrategy = ''

// 1. Try drug_class (user-specified)
if (project.drug_class) {
  adverseEvents = await fdaClient.searchAdverseEvents(project.drug_class, 10)
  searchStrategy = `drug_class: ${project.drug_class}`
}

// 2. Try compound name (from title)
if (adverseEvents.length === 0) {
  adverseEvents = await fdaClient.searchAdverseEvents(project.title.split(' ')[0], 10)
  searchStrategy = `compound: ${project.title.split(' ')[0]}`
}

// 3. Fallback to indication-based mapping
if (adverseEvents.length === 0 && project.indication) {
  const drugClassMap = {
    'diabetes': ['metformin', 'insulin', 'glipizide'],
    'hypertension': ['lisinopril', 'amlodipine'],
    ...
  }
  
  const indicationLower = project.indication.toLowerCase()
  for (const [condition, drugs] of Object.entries(drugClassMap)) {
    if (indicationLower.includes(condition)) {
      adverseEvents = await fdaClient.searchAdverseEvents(drugs[0], 10)
      searchStrategy = `indication fallback: ${drugs[0]}`
      break
    }
  }
}

// Save to database
for (const event of adverseEvents) {
  await supabase.from('evidence_sources').insert({
    project_id: projectId,
    source: 'openFDA',
    external_id: `${event.drugName}-${event.receiptDate}`,
    payload_json: event
  })
}
```

### 🎯 Зачем нужно?

1. **Safety data** - Побочные эффекты для IB Section 7.4
2. **Risk assessment** - Оценка рисков
3. **Regulatory compliance** - FDA требует safety data
4. **Comparator data** - Данные по reference drugs

---

## 4️⃣ Azure OpenAI API

### 🎯 Что это?

**Azure OpenAI** - Microsoft's managed service для OpenAI models (GPT-4, GPT-4 Turbo).

### 📡 API Details

**Base URL**: `https://{your-resource}.openai.azure.com/`  
**Authentication**: API Key required  
**Rate Limit**: Depends on deployment  
**Format**: JSON  

### 🔍 Что запрашиваем?

#### Request: Chat Completion

```http
POST https://skillsy-east-ai.openai.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview

Headers:
  api-key: {AZURE_OPENAI_API_KEY}
  Content-Type: application/json

Body:
{
  "messages": [
    {
      "role": "system",
      "content": "You are an expert medical writer specializing in regulatory documentation..."
    },
    {
      "role": "user",
      "content": "Generate a comprehensive Investigator's Brochure for AST-101..."
    }
  ],
  "temperature": 0.7,
  "max_tokens": 4000,
  "top_p": 0.95
}
```

**Response:**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1705334400,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "# INVESTIGATOR'S BROCHURE\n\n## 1. TITLE PAGE\n\n**Compound**: AST-101..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1234,
    "completion_tokens": 3456,
    "total_tokens": 4690
  }
}
```

### 💡 Как используется?

```typescript
// В supabase/functions/generate-document/index.ts

// 1. Build context from project + entities + evidence
const context = {
  project: {
    title: project.title,
    phase: project.phase,
    indication: project.indication,
    design: project.design_json,
  },
  entities: entities.reduce((acc, entity) => {
    acc[entity.entity_type] = entity.entity_value
    return acc
  }, {}),
  evidence: {
    clinical_trials: evidence.filter(e => e.source === 'ClinicalTrials.gov'),
    publications: evidence.filter(e => e.source === 'PubMed'),
    safety_data: evidence.filter(e => e.source === 'openFDA'),
  },
}

// 2. Generate prompt based on document type
const prompt = generatePrompt(documentType, context)

// 3. Call Azure OpenAI
const response = await fetch(
  `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`,
  {
    method: 'POST',
    headers: {
      'api-key': AZURE_OPENAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  }
)

const data = await response.json()
const generatedContent = data.choices[0].message.content

// 4. Save to database
await supabase.from('documents').insert({
  project_id: projectId,
  type: documentType,
  content: generatedContent,
  status: 'draft',
})
```

### 🎯 Зачем нужно?

1. **Document generation** - Создание Protocol, IB, Synopsis
2. **AI-powered writing** - Профессиональный medical writing
3. **Context-aware** - Использует все собранные данные
4. **Regulatory-compliant** - Следует ICH/FDA guidelines

---

## 🔄 Complete Flow: Fetch External Data

### User Action:
```
User clicks [Fetch External Data]
```

### Backend Flow:

```typescript
// 1. Authenticate user
const { user } = await supabase.auth.getUser()

// 2. Get project details
const { data: project } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single()

// 3. Fetch from ClinicalTrials.gov
const ctClient = new ClinicalTrialsClient()
const trials = await ctClient.searchByCondition(project.indication, 10)
// → GET https://clinicaltrials.gov/api/v2/studies?query.cond=Type+2+Diabetes&pageSize=10

// 4. Fetch from PubMed
const pubmedClient = new PubMedClient()
const searchTerm = `${project.title} ${project.indication}`
const publications = await pubmedClient.search(searchTerm, 10)
// → GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?term=AST-101+Type+2+Diabetes
// → GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?id=38123456,38123457

// 5. Fetch from openFDA
const fdaClient = new OpenFDAClient()
let adverseEvents = []

// Try drug_class first
if (project.drug_class) {
  adverseEvents = await fdaClient.searchAdverseEvents(project.drug_class, 10)
  // → GET https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"DPP-4 inhibitor"
}

// Fallback to compound name
if (adverseEvents.length === 0) {
  adverseEvents = await fdaClient.searchAdverseEvents(project.title.split(' ')[0], 10)
  // → GET https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"AST-101"
}

// Fallback to indication mapping
if (adverseEvents.length === 0) {
  adverseEvents = await fdaClient.searchAdverseEvents('metformin', 10)
  // → GET https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"metformin"
}

// 6. Save all to database
for (const trial of trials) {
  await supabase.from('evidence_sources').insert({
    project_id: projectId,
    source: 'ClinicalTrials.gov',
    external_id: trial.nctId,
    payload_json: trial
  })
}

for (const pub of publications) {
  await supabase.from('evidence_sources').insert({
    project_id: projectId,
    source: 'PubMed',
    external_id: pub.pmid,
    payload_json: pub
  })
}

for (const event of adverseEvents) {
  await supabase.from('evidence_sources').insert({
    project_id: projectId,
    source: 'openFDA',
    external_id: `${event.drugName}-${event.receiptDate}`,
    payload_json: event
  })
}

// 7. Log audit trail
await supabase.from('audit_log').insert({
  project_id: projectId,
  actor_user_id: user.id,
  action: 'external_data_fetched',
  diff_json: {
    clinicalTrials: trials.length,
    publications: publications.length,
    safetyData: adverseEvents.length
  }
})

// 8. Return results
return {
  success: true,
  data: {
    clinicalTrials: trials.length,
    publications: publications.length,
    safetyData: adverseEvents.length
  }
}
```

### Frontend Display:

```
✅ Fetched 10 clinical trials from ClinicalTrials.gov
✅ Fetched 10 publications from PubMed
✅ Fetched 10 safety reports from openFDA
```

---

## 📊 Data Storage

### Table: `evidence_sources`

```sql
CREATE TABLE evidence_sources (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  source TEXT NOT NULL,           -- 'ClinicalTrials.gov', 'PubMed', 'openFDA'
  external_id TEXT NOT NULL,      -- NCT ID, PMID, or event ID
  payload_json JSONB NOT NULL,    -- Full API response
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example rows:**

| id | project_id | source | external_id | payload_json |
|----|------------|--------|-------------|--------------|
| uuid1 | proj1 | ClinicalTrials.gov | NCT12345678 | `{"nctId": "NCT12345678", "title": "...", ...}` |
| uuid2 | proj1 | PubMed | 38123456 | `{"pmid": "38123456", "title": "...", ...}` |
| uuid3 | proj1 | openFDA | metformin-20240115 | `{"drugName": "metformin", "reactions": [...], ...}` |

---

## 🎯 Summary

### What we request:

1. **ClinicalTrials.gov**:
   - Search by indication → Get 10 similar trials
   - Extract: NCT ID, title, phase, enrollment, design

2. **PubMed**:
   - Search by compound + indication → Get 10 publications
   - Extract: PMID, title, authors, abstract, journal

3. **openFDA**:
   - Search by drug class/compound → Get 10 adverse events
   - Extract: Drug name, reactions, seriousness, patient data

4. **Azure OpenAI**:
   - Send context + prompt → Generate document
   - Extract: Generated markdown content

### How we use it:

- **ClinicalTrials.gov** → Context for AI, primary endpoint extraction
- **PubMed** → Literature review, efficacy data
- **openFDA** → Safety data, risk assessment
- **Azure OpenAI** → Document generation with all context

### Where it's stored:

- **evidence_sources** table → All external data
- **documents** table → Generated documents
- **audit_log** table → All actions logged

---

**All external APIs integrated and working!** 🚀

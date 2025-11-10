# 🌐 External Evidence - Зачем и Как?

## 📋 Что это такое?

**External Evidence** - это данные из внешних публичных источников, которые мы автоматически собираем и используем для обогащения AI-генерируемых документов.

---

## 🎯 Зачем нужно?

### 1. **Evidence-Based Medicine** 📊
Regulatory документы (IB, Protocol) должны быть основаны на **научных доказательствах**, а не просто на мнениях или предположениях.

**Регуляторы (FDA, EMA) требуют:**
- Ссылки на опубликованные исследования
- Данные из похожих clinical trials
- Известные safety данные о препарате

### 2. **Экономия времени Medical Writers** ⏱️
Вместо того чтобы вручную:
- Искать публикации в PubMed
- Анализировать ClinicalTrials.gov
- Проверять FDA adverse events

**AI делает это автоматически за секунды!**

### 3. **Качество и Compliance** ✅
- Документы с references выглядят профессиональнее
- Regulatory reviewers видят, что вы сделали homework
- Снижается риск rejection из-за недостаточной evidence base

### 4. **Контекст для AI** 🤖
GPT-4 генерирует **лучший контент**, когда у него есть:
- Реальные данные из похожих trials
- Научные публикации по indication
- Safety данные о препарате

---

## 🔍 Что именно собираем?

### 1. **ClinicalTrials.gov** 🏥

**Что ищем:**
- Похожие clinical trials по indication (например, "Type 2 Diabetes")
- Trials в той же фазе (Phase 2, Phase 3)
- Completed trials с результатами

**Что получаем:**
```json
{
  "nctId": "NCT12345678",
  "title": "Study of Drug X in Type 2 Diabetes",
  "phase": "Phase 2",
  "status": "Completed",
  "enrollment": 250,
  "primaryOutcome": "HbA1c reduction at 12 weeks",
  "results": "Mean HbA1c reduction: -1.2%"
}
```

**Как используем:**
- В секции **"Effects in Humans"** IB - показываем что уже изучено
- В **Protocol** - сравниваем наш дизайн с существующими trials
- В **Synopsis** - контекст для нашего исследования

**Пример в IB:**
```markdown
### 7.3 Efficacy

**Evidence from Clinical Trials:**
- Study of Metformin in Type 2 Diabetes (NCT00123456)
  Phase: Phase 3 | Status: Completed
  Primary Outcome: HbA1c reduction at 24 weeks
  Enrollment: 500 participants
  Results: Mean HbA1c reduction of -1.5% vs placebo

- Study of SGLT2 Inhibitor in T2DM (NCT00234567)
  Phase: Phase 2 | Status: Completed
  Primary Outcome: Fasting glucose reduction
  Enrollment: 180 participants
```

---

### 2. **PubMed** 📚

**Что ищем:**
- Научные публикации по compound name
- Публикации по indication
- Механизм действия, PK/PD данные

**Что получаем:**
```json
{
  "pmid": "12345678",
  "title": "Efficacy and Safety of AST-202 in Type 2 Diabetes",
  "authors": ["Smith J", "Johnson M", "Williams K"],
  "journal": "New England Journal of Medicine",
  "publicationDate": "2024-03-15",
  "abstract": "Background: AST-202 is a novel DPP-4 inhibitor..."
}
```

**Как используем:**
- В **References** секции IB
- В **Background/Rationale** Protocol
- Для обоснования выбора endpoints
- Для описания mechanism of action

**Пример в IB:**
```markdown
### 7.3 Efficacy

**Evidence from Published Literature:**

- Efficacy and Safety of AST-202 in Type 2 Diabetes 
  (Smith J et al., NEJM, 2024-03-15)
  Background: AST-202 is a novel DPP-4 inhibitor that 
  demonstrated significant HbA1c reduction in preclinical 
  models. This phase 2 study evaluated...

- Pharmacokinetics of AST-202 in Healthy Volunteers
  (Johnson M et al., Clinical Pharmacology, 2023-11-20)
  AST-202 showed linear PK with t1/2 of 12 hours, 
  supporting once-daily dosing...
```

---

### 3. **openFDA** ⚠️

**Что ищем:**
- Adverse events для нашего препарата (или класса препаратов)
- Drug interactions
- Safety warnings

**Что получаем:**
```json
{
  "drugName": "AST-202",
  "adverseEvents": [
    {
      "term": "Hypoglycemia",
      "frequency": 45,
      "seriousness": "Serious"
    },
    {
      "term": "Nausea",
      "frequency": 123,
      "seriousness": "Non-serious"
    }
  ],
  "receiptDate": "2024-01-15"
}
```

**Как используем:**
- В **Safety and Tolerability** секции IB
- В **Risk Assessment** Protocol
- В **Risks** секции ICF (Informed Consent)
- Для планирования safety monitoring

**Пример в IB:**
```markdown
### 7.4 Safety and Tolerability

**Safety Data from FDA Adverse Event Reporting:**

- Hypoglycemia: 45 reports (Serious)
- Nausea: 123 reports (Non-serious)
- Headache: 89 reports (Non-serious)
- Dizziness: 67 reports (Non-serious)
- Diarrhea: 54 reports (Non-serious)

**Common Adverse Events:**
Based on post-marketing surveillance, the most common 
adverse events (≥5%) include:
- Hypoglycemia (15%) - mostly mild to moderate
- Nausea (8%) - usually transient
- Headache (6%) - self-limiting
```

---

## 🔄 Как это работает? (Technical Flow)

### Step 1: User нажимает "Fetch External Data"
```typescript
// components/fetch-external-data-button.tsx
const handleFetch = async () => {
  const response = await fetch('/api/integrations/fetch-all', {
    method: 'POST',
    body: JSON.stringify({ projectId })
  })
}
```

### Step 2: API делает 3 параллельных запроса
```typescript
// app/api/integrations/fetch-all/route.ts

// 1. ClinicalTrials.gov
const trials = await ctClient.searchByCondition(
  project.indication, // "Type 2 Diabetes"
  10 // limit
)

// 2. PubMed
const publications = await pubmedClient.search(
  `${project.title} ${project.indication}`, // "AST-202 Type 2 Diabetes"
  10
)

// 3. openFDA
const adverseEvents = await fdaClient.searchAdverseEvents(
  drugName, // "AST-202"
  10
)
```

### Step 3: Данные сохраняются в БД
```sql
-- evidence_sources table
INSERT INTO evidence_sources (
  project_id,
  source,        -- 'ClinicalTrials.gov', 'PubMed', 'openFDA'
  external_id,   -- NCT ID, PMID, etc.
  payload_json   -- Full data
)
```

### Step 4: AI использует при генерации документа
```typescript
// supabase/functions/generate-document/index.ts

// Fetch evidence sources
const { data: evidenceSources } = await supabase
  .from('evidence_sources')
  .select('*')
  .eq('project_id', projectId)

// Parse by source
const clinicalTrials = evidenceSources
  .filter(s => s.source === 'ClinicalTrials.gov')
  .map(s => s.payload_json)

const publications = evidenceSources
  .filter(s => s.source === 'PubMed')
  .map(s => s.payload_json)

const safetyData = evidenceSources
  .filter(s => s.source === 'openFDA')
  .map(s => s.payload_json)

// Pass to prompt
const prompt = generateIBPrompt({
  projectTitle,
  compoundName,
  indication,
  clinicalTrials,    // ← Used here!
  publications,      // ← Used here!
  safetyData        // ← Used here!
})
```

### Step 5: GPT-4 генерирует контент с references
```markdown
### 7.3 Efficacy

**Evidence from Published Literature:**
- Efficacy and Safety of AST-202... (Smith et al., NEJM, 2024)

**Evidence from Clinical Trials:**
- Study of Metformin in T2DM (NCT00123456)
  Phase: Phase 3 | Status: Completed
  Results: HbA1c reduction -1.5%
```

---

## 📊 Где используется в документах?

### Investigator's Brochure (IB)

#### Section 7.3: Efficacy
- ✅ Publications → Literature review
- ✅ Clinical Trials → Evidence of efficacy

#### Section 7.4: Safety
- ✅ openFDA → Known adverse events
- ✅ Publications → Safety data from studies

#### Section 8: Summary
- ✅ All sources → Benefit-risk assessment

---

### Clinical Trial Protocol

#### Section 2: Background and Rationale
- ✅ Publications → Scientific rationale
- ✅ Clinical Trials → Why this study is needed

#### Section 6: Study Endpoints
- ✅ Clinical Trials → What others measured
- ✅ Publications → Validated endpoints

#### Section 8: Safety Assessments
- ✅ openFDA → What to monitor
- ✅ Publications → Safety concerns

---

### Informed Consent Form (ICF)

#### Section: Risks
- ✅ openFDA → Known side effects
- ✅ Publications → Frequency of events

#### Section: Benefits
- ✅ Clinical Trials → Potential benefits
- ✅ Publications → Evidence of efficacy

---

### Study Synopsis

#### Background
- ✅ Publications → Context
- ✅ Clinical Trials → Landscape

#### Rationale
- ✅ All sources → Why this study matters

---

## 💡 Реальный пример

### Проект: AST-202 Phase 2 Trial for Type 2 Diabetes

#### 1. User создает проект:
```
Title: AST-202 Phase 2 Trial
Phase: Phase 2
Indication: Type 2 Diabetes
Compound: AST-202
```

#### 2. User нажимает "Fetch External Data"

#### 3. Система находит:

**ClinicalTrials.gov (5 trials):**
- NCT12345: Metformin in T2DM (Phase 3, Completed)
- NCT23456: SGLT2 inhibitor in T2DM (Phase 2, Recruiting)
- NCT34567: DPP-4 inhibitor in T2DM (Phase 3, Completed)

**PubMed (8 publications):**
- "DPP-4 inhibitors for T2DM: Meta-analysis" (NEJM, 2024)
- "AST-202 preclinical pharmacology" (J Pharmacol, 2023)
- "Glycemic control in T2DM: Current approaches" (Diabetes Care, 2024)

**openFDA (3 safety reports):**
- Hypoglycemia: 45 reports
- Nausea: 123 reports
- Headache: 89 reports

#### 4. User генерирует IB

#### 5. AI создает IB с этими данными:

```markdown
# INVESTIGATOR'S BROCHURE
## AST-202 for Type 2 Diabetes Mellitus

### 7.3 EFFICACY

**Evidence from Published Literature:**

1. DPP-4 inhibitors for Type 2 Diabetes: A Meta-analysis
   (Johnson M et al., NEJM, 2024-02-15)
   
   Meta-analysis of 25 RCTs showed DPP-4 inhibitors reduce 
   HbA1c by -0.7% to -1.2% vs placebo. Well-tolerated with 
   low hypoglycemia risk.

2. AST-202 Preclinical Pharmacology Study
   (Smith J et al., J Pharmacol, 2023-11-20)
   
   AST-202 demonstrated potent and selective DPP-4 inhibition 
   (IC50 = 2.3 nM). In diabetic mice, AST-202 reduced HbA1c 
   by 1.8% at 10mg/kg dose.

**Evidence from Clinical Trials:**

- Study of Metformin in Type 2 Diabetes (NCT12345678)
  Phase: Phase 3 | Status: Completed
  Primary Outcome: HbA1c reduction at 24 weeks
  Enrollment: 500 participants
  Results: Mean HbA1c reduction -1.5% vs placebo (p<0.001)

- Study of DPP-4 Inhibitor in T2DM (NCT34567890)
  Phase: Phase 3 | Status: Completed
  Primary Outcome: HbA1c change from baseline
  Enrollment: 800 participants
  Results: HbA1c reduction -0.9% with good tolerability

### 7.4 SAFETY AND TOLERABILITY

**Safety Data from FDA Adverse Event Reporting:**

Common Adverse Events (from post-marketing surveillance):
- Hypoglycemia: 45 reports (mostly mild-moderate, serious: 8%)
- Nausea: 123 reports (non-serious, transient)
- Headache: 89 reports (non-serious, self-limiting)
- Dizziness: 67 reports (non-serious)
- Diarrhea: 54 reports (non-serious)

**Analysis:**
The safety profile is consistent with the DPP-4 inhibitor 
class. Hypoglycemia risk is low when used as monotherapy. 
Most adverse events are mild and transient.
```

---

## ✅ Преимущества

### 1. **Для Medical Writers:**
- ⏱️ Экономия 4-6 часов на поиск references
- 📚 Автоматический literature review
- ✅ Актуальные данные (real-time API calls)

### 2. **Для Regulatory Reviewers:**
- 📊 Evidence-based документы
- 🔍 Прозрачность источников данных
- ✅ Compliance с guidelines

### 3. **Для AI:**
- 🤖 Лучший контекст → лучший output
- 📈 Более точные рекомендации
- 🎯 Релевантные примеры

### 4. **Для Бизнеса:**
- 💰 ROI: 4-6 часов × $150/час = $600-900 экономии на документ
- 🚀 Faster time-to-market
- ✅ Меньше regulatory delays

---

## 🎯 Итого

**External Evidence - это ключевая фича**, которая превращает Asetria из "просто AI генератора" в **профессиональный инструмент для regulatory документов**.

### Без External Evidence:
```markdown
### 7.3 Efficacy
- Phase 1 studies showed safety and tolerability
- Phase 2 studies are planned
```
❌ Слабо, нет evidence, регуляторы не примут

### С External Evidence:
```markdown
### 7.3 Efficacy

**Evidence from Published Literature:**
- Meta-analysis of 25 RCTs (NEJM, 2024): HbA1c -0.7% to -1.2%
- AST-202 preclinical study (J Pharmacol, 2023): HbA1c -1.8%

**Evidence from Clinical Trials:**
- NCT12345: Metformin Phase 3 (n=500): HbA1c -1.5% (p<0.001)
- NCT34567: DPP-4 inhibitor Phase 3 (n=800): HbA1c -0.9%

**Safety Data from FDA:**
- Hypoglycemia: 45 reports (8% serious)
- Nausea: 123 reports (transient)
```
✅ Профессионально, evidence-based, готово к submission!

---

## 🚀 Что дальше?

### Возможные улучшения:

1. **Больше источников:**
   - EMA (European Medicines Agency)
   - WHO Clinical Trials Registry
   - Cochrane Database

2. **Умный поиск:**
   - Semantic search (не просто keywords)
   - Relevance scoring
   - Automatic deduplication

3. **Кэширование:**
   - Не делать повторные запросы
   - Update только новых данных

4. **Visualization:**
   - График timeline похожих trials
   - Safety dashboard
   - Evidence quality score

---

**External Evidence = Competitive Advantage для Asetria!** 🎉

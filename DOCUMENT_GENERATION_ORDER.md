# 📄 Document Generation Order & Dependencies

## 🎯 Quick Answer

**Нет строгой зависимости между документами!** Все документы генерируются независимо на основе одних и тех же данных:
- Project details (title, indication, phase, etc.)
- External data (ClinicalTrials.gov, PubMed, openFDA)
- Extracted entities (compounds, endpoints, etc.)

**Однако есть рекомендуемый порядок для лучшего workflow:**

---

## 📋 Recommended Generation Order

### 1️⃣ **Synopsis (Clinical Study Synopsis)** - ПЕРВЫМ
**Почему первым:**
- Самый короткий документ (2-3 страницы)
- Дает общий обзор исследования
- Помогает проверить, что все данные корректны
- Быстро генерируется (~30 секунд)

**Что содержит:**
- Study title and objectives
- Study design overview
- Patient population
- Treatment arms
- Primary/secondary endpoints
- Safety considerations

**Используется для:**
- Быстрая проверка данных проекта
- Валидация external data
- Проверка extracted entities

---

### 2️⃣ **IB (Investigator's Brochure)** - ВТОРЫМ
**Почему вторым:**
- Средний размер (20-40 страниц)
- Фокус на compound и safety data
- Использует данные из PubMed и openFDA
- Генерируется ~2-3 минуты

**Что содержит:**
- Compound description
- Pharmacology and toxicology
- Clinical experience
- Safety profile
- Adverse events data
- Drug interactions

**Используется для:**
- Детальная информация о препарате
- Safety reference для других документов
- Investigator training materials

---

### 3️⃣ **Protocol (Clinical Trial Protocol)** - ТРЕТЬИМ
**Почему третьим:**
- Самый большой документ (50-100+ страниц)
- Самый детальный и структурированный
- Использует данные из ClinicalTrials.gov
- Генерируется ~5-7 минут

**Что содержит:**
- Detailed study design
- Inclusion/exclusion criteria
- Study procedures and assessments
- Statistical analysis plan
- Safety monitoring
- Data management

**Используется для:**
- Regulatory submission
- Ethics committee review
- Site initiation
- Study conduct

---

## 🔄 Data Flow & Dependencies

### Shared Data Sources (Все документы используют):

```
Project Data
    ├── title
    ├── indication
    ├── phase
    ├── sponsor
    └── design (primary_endpoint, duration, etc.)
    
External Data (from APIs)
    ├── ClinicalTrials.gov → Similar trials, endpoints, designs
    ├── PubMed → Scientific literature, clinical studies
    └── openFDA → Safety data, adverse events
    
Extracted Entities
    ├── compounds → Drug names, mechanisms
    ├── endpoints → Primary/secondary outcomes
    └── interventions → Treatment details
```

### Document-Specific Data Usage:

| Data Source | Synopsis | IB | Protocol |
|-------------|----------|-----|----------|
| **Project Details** | ✅✅✅ | ✅✅✅ | ✅✅✅ |
| **ClinicalTrials.gov** | ✅ | ✅ | ✅✅✅ |
| **PubMed** | ✅ | ✅✅✅ | ✅ |
| **openFDA** | ✅ | ✅✅✅ | ✅ |
| **Entities** | ✅✅ | ✅✅ | ✅✅✅ |

**Legend:**
- ✅ = Used
- ✅✅ = Heavily used
- ✅✅✅ = Critical dependency

---

## 🚫 What is NOT Dependent

### Documents DO NOT reference each other:
- ❌ Protocol does NOT use content from Synopsis
- ❌ IB does NOT use content from Protocol
- ❌ Synopsis does NOT use content from IB

### Each document is generated independently:
- ✅ Same input data (project + external data)
- ✅ Different prompts and templates
- ✅ Different focus and depth
- ✅ Different regulatory requirements

---

## 💡 Best Practices

### 1. **Start with Synopsis**
```
Reason: Quick validation of data quality
Time: ~30 seconds
Benefit: Catch data issues early
```

### 2. **Generate IB next**
```
Reason: Build compound knowledge base
Time: ~2-3 minutes
Benefit: Safety data for reference
```

### 3. **Generate Protocol last**
```
Reason: Most complex, takes longest
Time: ~5-7 minutes
Benefit: Complete regulatory package
```

### 4. **Validate each document**
```
After generation: Click "Validate"
Check: Completeness score, missing sections
Fix: Re-generate if score < 80%
```

---

## 🔧 Technical Implementation

### Generation Process (Same for all documents):

```typescript
// 1. Fetch project data
const project = await getProject(projectId)

// 2. Fetch external data (if available)
const evidenceSources = await getEvidenceSources(projectId)
const clinicalTrials = evidenceSources.filter(s => s.source_type === 'clinicaltrials')
const publications = evidenceSources.filter(s => s.source_type === 'pubmed')
const fdaData = evidenceSources.filter(s => s.source_type === 'openfda')

// 3. Fetch extracted entities
const entities = await getEntities(projectId)

// 4. Build context object
const context = {
  project,
  clinicalTrials,
  publications,
  fdaData,
  entities,
}

// 5. Generate document with AI
const content = await generateDocument(documentType, context)

// 6. Save to database
await saveDocument({
  project_id: projectId,
  type: documentType,
  content,
  version: 1,
  status: 'draft',
})
```

### Key Points:
- **Same context** for all documents
- **Different prompts** per document type
- **No cross-document dependencies**
- **Parallel generation possible** (but not recommended for UX)

---

## 📊 Generation Time Estimates

| Document | Size | Time | Tokens | Cost (est.) |
|----------|------|------|--------|-------------|
| **Synopsis** | 2-3 pages | ~30 sec | ~2,000 | $0.06 |
| **IB** | 20-40 pages | ~2-3 min | ~15,000 | $0.45 |
| **Protocol** | 50-100 pages | ~5-7 min | ~40,000 | $1.20 |
| **Total** | 72-143 pages | ~8-11 min | ~57,000 | $1.71 |

*Based on GPT-4 pricing: $0.03/1K tokens*

---

## 🎯 Workflow Recommendations

### Option 1: Sequential (Recommended)
```
1. Fetch External Data (1-2 min)
   ↓
2. Generate Synopsis (30 sec)
   ↓
3. Validate Synopsis
   ↓
4. Generate IB (2-3 min)
   ↓
5. Validate IB
   ↓
6. Generate Protocol (5-7 min)
   ↓
7. Validate Protocol
   ↓
8. Export all documents

Total time: ~10-15 minutes
```

### Option 2: Parallel (Advanced)
```
1. Fetch External Data (1-2 min)
   ↓
2. Generate all documents in parallel (5-7 min)
   ↓
3. Validate all documents
   ↓
4. Export all documents

Total time: ~7-10 minutes
```

**Note:** Parallel generation uses more API tokens simultaneously but saves time.

---

## ❓ FAQ

### Q: Can I generate Protocol first?
**A:** Yes! There's no technical dependency. But Synopsis is faster and helps validate data first.

### Q: Do I need to re-generate all documents if I change project data?
**A:** Yes, each document is a snapshot. Changes to project data require re-generation.

### Q: Can I generate only one document?
**A:** Yes! Each document is independent. Generate only what you need.

### Q: What if external data changes?
**A:** Documents use a snapshot of external data at generation time. Re-fetch and re-generate to update.

### Q: Can I edit generated documents?
**A:** Currently no inline editing. You can export to DOCX and edit there, or re-generate with updated data.

---

## 🔮 Future Enhancements

### Planned Features:
1. **Incremental updates** - Update specific sections without full re-generation
2. **Cross-document references** - Link related sections across documents
3. **Version comparison** - Compare different versions side-by-side
4. **Batch generation** - Generate all documents with one click
5. **Smart suggestions** - AI suggests improvements based on validation results

---

## 📝 Summary

### Key Takeaways:
- ✅ **No strict dependencies** between documents
- ✅ **All use same data sources** (project + external + entities)
- ✅ **Recommended order:** Synopsis → IB → Protocol
- ✅ **Each document is independent** and can be generated separately
- ✅ **Validate after generation** to ensure quality
- ✅ **Total time:** ~10-15 minutes for all three documents

### Best Practice:
```
1. Create project
2. Fetch external data
3. Generate Synopsis (validate data)
4. Generate IB (build knowledge)
5. Generate Protocol (complete package)
6. Validate all
7. Export for submission
```

---

**Happy document generation! 🚀**

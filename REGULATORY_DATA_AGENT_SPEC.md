# 🔬 Regulatory Data Agent - Technical Specification

**Last Updated:** 2025-11-10 22:30 UTC  
**Status:** Architecture Design  
**Owner:** Backend + ML Engineer  
**Priority:** Critical (Core Component)

---

## 🎯 Executive Summary

**Regulatory Data Agent** — самостоятельный микросервис, который является "глазами и руками" системы. Он отвечает за поиск, извлечение, нормализацию и валидацию публичных регуляторных данных из внешних источников (FDA, EMA, PubMed, ClinicalTrials.gov).

**Ключевое отличие:**
- Единственный агент, который ходит наружу (external API calls)
- Работает с публичными регуляторными данными (не PHI/PII)
- Имеет собственный слой кэширования и версионирования
- Критичен для Generic и Hybrid режимов
- Опционален для Innovator режима

---

## 🧩 Место в архитектуре

```
User Uploads/Inputs  
    ↓  
[Intake Agent] — проверил форму и базу данных  
    ↓  
[Regulatory Data Agent] ← ВЫ ЗДЕСЬ — пошёл наружу в FDA/EMA/ClinicalTrials/PubMed  
    ↓  
[Composer Agent] — строит структуру документа  
    ↓  
[Writer Agent] — пишет текст  
    ↓  
[Validator Agent] — проверяет compliance  
    ↓  
[Assembler Agent] — собирает финальный документ
```

### Когда активируется

| Тип продукта | Regulatory Data Agent | Почему |
|--------------|----------------------|--------|
| **Innovator** | ❌ опционально | Все данные от спонсора |
| **Generic** | ✅ **обязательно** | Основной источник — публичные регистры |
| **Hybrid** | ✅ частично | Nonclinical из регистров, clinical из загрузок |
| **Post-marketing** | ✅ опционально | FAERS / EudraVigilance данные |

---

## 🧠 Роль и назначение

### Основная задача
Искать, собирать, нормализовать и аннотировать публичные регуляторные данные, чтобы Writer Agent мог писать текст на основе достоверных источников.

### Что он делает

1. **Поиск источников:** FDA, EMA, MHRA, ClinicalTrials.gov, PubChem, PubMed, Orange Book
2. **Извлечение данных:** механизмы, PK/PD, tox, safety, adverse events, RLD info
3. **Нормализация:** единая схема, provenance, confidence levels
4. **Агрегация:** удаление дубликатов, проверка единиц, связывание через InChIKey
5. **Выдача результата:** чистый `compound_data.json` для Composer Agent
6. **Кэширование:** хранение в Regulatory Data Layer, обновления раз в 7–30 дней

---

## 📋 API Endpoints

**Service:** `regdata-agent`

### 1. POST `/regdata/enrich`
Запустить сбор данных

### 2. GET `/regdata/snapshot/{inchikey}`
Вернуть нормализованный compound_data.json

### 3. POST `/regdata/update/{source}`
Форс-апдейт конкретного источника

### 4. GET `/regdata/validate/{project_id}`
Вернуть coverage и issues

### 5. GET `/regdata/resolve`
Резолвинг идентификаторов в inchikey

---

## 🔄 Source Adapters

### 1. OpenFDA → labels.sections, adverse_events
### 2. Drugs@FDA → clinical/nonclinical summaries
### 3. DailyMed → labels (conflict resolution: newer wins)
### 4. EMA EPAR → nonclinical/clinical overviews
### 5. ClinicalTrials.gov → trials, efficacy data
### 6. PubChem → inchikey, chemical properties
### 7. PubMed → literature, references
### 8. Orange Book → RLD, TE-codes
### 9. MHRA PAR → EU/UK regulatory data

---

## 🗄️ Regulatory Data Layer

**Core Tables:**
- `compounds` (inchikey PK, name, mechanism, molecular data)
- `products` (brand_name, application_number, rld, te_code)
- `labels` (sections JSONB, effective_date)
- `nonclinical_summaries` (pk, tox, genotox JSONB)
- `clinical_summaries` (efficacy, safety JSONB)
- `trials` (nct_id, design, outcomes JSONB)
- `literature` (pmid, title, abstract)
- `adverse_events` (soc, pt, incidence)
- `ingestion_logs`, `audit_changes`

---

## ✅ Data Validator

**Правила:**
- Product type validation (RLD/TE-code для generic)
- PK parameters в разумных диапазонах
- References ≥ 5 для Generic IB
- MedDRA terms валидны
- Единицы измерения корректны

**Output:**
```json
{
  "coverage": {"nonclinical": 0.82, "clinical": 0.91, "label": 1.0},
  "issues": [...],
  "score": 90
}
```

---

## 🔐 Security & Compliance

- Все вызовы через egress allowlist
- Логи без PHI/PII
- MedDRA по лицензии
- Только public domain данные
- Провенанс и версии в manifest

---

## 📊 Caching Strategy

**Redis (Hot Keys):**
- Labels: TTL 7 дней
- RLD info: TTL 30 дней
- TE-коды: TTL 30 дней

**Updates:**
- Nightly sync job
- On-demand refresh

---

## 🚨 Error Handling

**Codes:**
- E101_ENRICH_TIMEOUT
- E102_SOURCE_RATE_LIMIT
- E301_IDENTITY_UNRESOLVED
- E401_TE_CODE_MISSING_FOR_GENERIC
- E402_RLD_NOT_FOUND

**Strategy:** Best effort, partial fail не роняет enrichment

---

## 📈 Metrics

- Enrichment coverage per project
- Time to snapshot
- Source error rate
- Conflict rate
- Label freshness age
- Validator average score

---

## 🚀 Implementation Plan

**Sprint 1 (Week 4-5):** PubChem, openFDA, DailyMed, Orange Book, Snapshot API  
**Sprint 2 (Week 5-6):** EMA EPAR, ClinicalTrials, PubMed, Deduper  
**Sprint 3 (Week 6-7):** MedDRA, Validator, Coverage scoring  
**Sprint 4 (Week 7-8):** Retries, Circuit breaker, Cache, Metrics

---

**Status:** 📋 Ready for Implementation

**Next:** Create detailed data contracts document

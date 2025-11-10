# 🎯 Primary Endpoint - Анализ использования

## ❓ Текущая ситуация

### Где сохраняется:
```typescript
// app/dashboard/projects/new/page.tsx
const designJson = {
  design_type: formData.design_type,
  blinding: formData.blinding,
  arms: parseInt(formData.arms),
  duration_weeks: parseInt(formData.duration_weeks),
  primary_endpoint: formData.primary_endpoint, // ← Сохраняется здесь
}

// Сохраняется в projects.design_json
```

### Где отображается:
```tsx
// app/dashboard/projects/[id]/page.tsx
<span className="text-gray-600">Primary Endpoint:</span>
<span className="font-medium">{designJson?.primary_endpoint || 'N/A'}</span>
```

### Где НЕ используется (проблема!):
❌ **НЕ передается в AI промпты для генерации документов**
❌ **НЕ используется в Protocol prompt**
❌ **НЕ используется в Synopsis prompt**
❌ **НЕ используется в IB prompt**

---

## 🔍 Как ДОЛЖНО работать

### Primary Endpoint - это ключевая информация для:

#### 1. **Protocol (Section 6: Objectives and Endpoints)**
```markdown
### 6. STUDY OBJECTIVES AND ENDPOINTS

#### 6.1 Primary Objective
To evaluate the effect of AST-101 on **HbA1c reduction** 
in patients with Type 2 Diabetes

#### 6.3 Primary Efficacy Endpoint
**Change from baseline in HbA1c at Week 24**
- Assessment method: Central laboratory
- Timing: Baseline, Week 12, Week 24
- Analysis: ANCOVA with baseline as covariate
```

#### 2. **Synopsis (Section 3: Study Endpoints)**
```markdown
### 3. STUDY ENDPOINTS

#### Primary Endpoint
**Change from baseline in HbA1c at Week 24**

Target: -0.8% reduction vs placebo (p<0.05)
```

#### 3. **IB (Section 7.2: Pharmacodynamics)**
```markdown
#### 7.2 Pharmacodynamics

Key endpoints for AST-101 evaluation:
- **Primary: HbA1c reduction at Week 24**
- Secondary: Fasting glucose, body weight
```

#### 4. **Statistical Analysis Plan**
```markdown
### Sample Size Calculation
Based on primary endpoint (HbA1c reduction):
- Expected difference: -0.8%
- Standard deviation: 1.2%
- Power: 90%
- Alpha: 0.05
- Required N: 180 subjects (90 per arm)
```

---

## ❌ Текущая проблема

### Что происходит сейчас:

**User вводит:**
```
Primary Endpoint: Change in HbA1c from baseline at Week 24
```

**AI генерирует Protocol:**
```markdown
### 6.3 Primary Efficacy Endpoint
Change from baseline in [primary measure] ← Generic placeholder!
```

**Проблема:**
- AI не знает что primary endpoint = "HbA1c at Week 24"
- Использует generic placeholders
- Документ выглядит неполным
- Medical writer должен вручную заполнять

---

## ✅ Решение

### 1. Передавать design_json в промпты

**Текущий код (generate-document/index.ts):**
```typescript
const context = {
  project: {
    title: project.title,
    phase: project.phase,
    indication: project.indication,
    countries: project.countries,
    design: project.design_json, // ← Передается, но не используется!
  },
  // ...
}
```

**Промпты должны использовать:**
```typescript
// lib/prompts/protocol-prompt.ts
export function generateProtocolPrompt(context: any) {
  const { project, entities } = context
  const design = project.design || {}
  
  const primaryEndpoint = design.primary_endpoint || 
                          entities.endpoint?.[0] || 
                          'Change from baseline in [primary measure]'
  
  return `
### 6.3 Primary Efficacy Endpoint
${primaryEndpoint}
  `
}
```

---

## 🔧 Исправления

### Fix 1: Protocol Prompt

**File**: `lib/prompts/protocol-prompt.ts`

**До:**
```typescript
#### 6.1 Primary Objective
${endpoints.length > 0 ? `To evaluate ${endpoints[0]}` : `To evaluate efficacy`}

#### 11.1 Primary Efficacy Endpoint
${endpoints[0] || 'Change from baseline in [primary measure]'}
```

**После:**
```typescript
// Extract primary endpoint from design_json or entities
const primaryEndpoint = project.design?.primary_endpoint || 
                        endpoints[0] || 
                        'Change from baseline in [primary measure]'

#### 6.1 Primary Objective
To evaluate ${primaryEndpoint} in patients with ${indication}

#### 11.1 Primary Efficacy Endpoint
${primaryEndpoint}
- Assessment method: [specify]
- Timing: Baseline, [timepoints]
- Analysis: [statistical method]
```

---

### Fix 2: Synopsis Prompt

**File**: `lib/prompts/synopsis-prompt.ts`

**До:**
```typescript
#### Primary Endpoint
${endpoints[0] || 'Change from baseline in [primary measure] at Week [X]'}
```

**После:**
```typescript
const primaryEndpoint = project.design?.primary_endpoint || 
                        endpoints[0] || 
                        'Change from baseline in [primary measure]'

#### Primary Endpoint
${primaryEndpoint}

**Target**: [specify target difference vs comparator]
**Analysis**: [statistical method]
```

---

### Fix 3: IB Prompt

**File**: `lib/prompts/ib-prompt.ts`

**До:**
```typescript
- Biomarkers and surrogate endpoints
${endpoints.length > 0 ? `- Key endpoints: ${endpoints.join(', ')}` : ''}
```

**После:**
```typescript
const primaryEndpoint = project.design?.primary_endpoint
const allEndpoints = primaryEndpoint 
  ? [primaryEndpoint, ...endpoints]
  : endpoints

- Biomarkers and surrogate endpoints
${allEndpoints.length > 0 ? `- Key endpoints: ${allEndpoints.join(', ')}` : ''}
```

---

## 📊 Сравнение: До vs После

### До (без primary_endpoint):

**Protocol Section 6:**
```markdown
### 6. STUDY OBJECTIVES AND ENDPOINTS

#### 6.1 Primary Objective
To evaluate the efficacy and safety of AST-101

#### 6.3 Primary Efficacy Endpoint
Change from baseline in [primary measure]
- Assessment method
- Timing of assessments
```
❌ Generic, неполный

---

### После (с primary_endpoint):

**Protocol Section 6:**
```markdown
### 6. STUDY OBJECTIVES AND ENDPOINTS

#### 6.1 Primary Objective
To evaluate the effect of AST-101 on **change in HbA1c 
from baseline at Week 24** in patients with Type 2 Diabetes

#### 6.3 Primary Efficacy Endpoint
**Change from baseline in HbA1c at Week 24**
- Assessment method: Central laboratory (HPLC)
- Timing: Baseline, Week 12, Week 24
- Analysis: ANCOVA with baseline HbA1c as covariate
- Target: -0.8% reduction vs placebo (p<0.05)
```
✅ Specific, complete, professional!

---

## 🎯 Дополнительные улучшения

### 1. Validation при создании проекта

```tsx
// Suggest primary endpoint based on indication
const primaryEndpointSuggestions = {
  'diabetes': 'Change in HbA1c from baseline at Week 24',
  'hypertension': 'Change in systolic blood pressure at Week 12',
  'depression': 'Change in MADRS score at Week 8',
  'pain': 'Change in pain intensity (VAS) at Week 4',
}

// Show suggestion
{indication && (
  <p className="text-xs text-blue-600">
    💡 Suggested: {primaryEndpointSuggestions[indication.toLowerCase()]}
  </p>
)}
```

### 2. Secondary Endpoints

```tsx
// Add secondary endpoints field
<label>Secondary Endpoints (optional)</label>
<textarea
  value={formData.secondary_endpoints}
  placeholder="e.g., Fasting glucose, Body weight, Quality of life"
/>
```

### 3. Endpoint Details

```tsx
// Add endpoint timing
<label>Primary Endpoint Timepoint</label>
<Input
  value={formData.endpoint_timepoint}
  placeholder="e.g., Week 24, Month 6, Day 28"
/>
```

---

## 💡 Почему это важно?

### 1. **Regulatory Compliance** 📋
FDA/EMA требуют **четкое определение** primary endpoint:
- Что измеряется
- Когда измеряется
- Как анализируется

### 2. **Statistical Planning** 📊
Sample size calculation **зависит от** primary endpoint:
- Expected effect size
- Standard deviation
- Clinical significance

### 3. **Study Design** 🔬
Primary endpoint определяет:
- Duration of study
- Visit schedule
- Assessment methods
- Data collection

### 4. **Document Quality** ✅
Документы с **specific endpoints** выглядят:
- Более профессионально
- Готовы к submission
- Меньше требуют редактирования

---

## 🚀 Action Items

### Priority 1: Fix Prompts ⚡
1. ✅ Update `protocol-prompt.ts` to use `design.primary_endpoint`
2. ✅ Update `synopsis-prompt.ts` to use `design.primary_endpoint`
3. ✅ Update `ib-prompt.ts` to include `design.primary_endpoint`

### Priority 2: Enhance UI 🎨
1. Add endpoint suggestions based on indication
2. Add secondary endpoints field
3. Add endpoint timepoint field

### Priority 3: Validation ✅
1. Validate endpoint format
2. Suggest standard endpoints
3. Check endpoint matches indication

---

## 📝 Summary

### Текущая ситуация:
❌ `primary_endpoint` сохраняется но **НЕ используется** в AI промптах
❌ Документы содержат generic placeholders
❌ Medical writer должен вручную заполнять

### После исправления:
✅ `primary_endpoint` передается в AI промпты
✅ Документы содержат **specific, detailed** endpoints
✅ Готовы к regulatory submission
✅ Меньше manual editing

### Value:
- ⏱️ Экономия 1-2 часа на документ (manual endpoint filling)
- 📊 Лучшее качество документов
- ✅ Regulatory compliance
- 💼 Профессиональный вид

---

**Primary Endpoint = Ключевая информация для всех документов!** 🎯

**Next**: Implement fixes в промптах! 🚀

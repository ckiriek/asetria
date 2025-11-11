# 📋 Data Contracts - Regulatory Data Layer

**Last Updated:** 2025-11-10 22:35 UTC  
**Purpose:** Стандартизированные контракты данных между Regulatory Data Agent и остальными агентами  
**Audience:** Backend, Frontend, Writer Agent, Assembler

---

## 🎯 Overview

Этот документ определяет точные форматы данных, которые:
1. **Regulatory Data Agent** извлекает из внешних источников
2. **Composer Agent** использует для построения структуры документа
3. **Writer Agent** использует для генерации narrative
4. **Validator Agent** использует для проверки compliance
5. **Assembler Agent** использует для вставки таблиц и графиков

---

## 1. labels.sections (FDA/EMA Labels)

### TypeScript Interface

```typescript
interface LabelSections {
  label_meta: {
    source: 'fda_label' | 'dailymed' | 'ema_smpc'
    application_number: string
    brand_name: string
    generic_name: string
    effective_date: string // ISO 8601
    version: string
    region: 'US' | 'EU' | 'UK'
    set_id: string
    source_url: string
  }
  sections: {
    highlights?: string
    indications_and_usage: string
    dosage_and_administration: {
      routes: string[]
      dosage_forms: string[]
      strengths: string[]
      adult: string
      pediatric?: string
      renal_dose_adjustment?: string
      hepatic_impairment?: string
    }
    contraindications: string[]
    warnings_and_precautions: string[]
    drug_interactions: Array<{
      partner: string
      effect: string
      action: string
    }>
    use_in_specific_populations: {
      pregnancy?: string
      lactation?: string
      geriatric_use?: string
      pediatric_use?: string
    }
    adverse_reactions_label: {
      common: Array<{
        pt: string
        note?: string
      }>
      postmarketing: Array<{
        pt: string
        severity?: 'serious' | 'mild'
      }>
    }
    clinical_pharmacology: {
      mechanism_of_action: string
      pharmacokinetics: {
        bioavailability_pct?: number
        tmax_h?: number
        t12_h?: number
        ppb_pct?: number
        metabolism?: string
        excretion?: string
      }
      pharmacodynamics?: string
    }
    overdosage?: string
    how_supplied_storage_and_handling?: {
      presentations: Array<{
        form: string
        strength: string
        color_imprint?: string
      }>
      storage: string
    }
    patient_counseling_information?: string[]
  }
}
```

### JSON Example (Metformin)

```json
{
  "label_meta": {
    "source": "fda_label",
    "application_number": "NDA020357",
    "brand_name": "GLUCOPHAGE",
    "generic_name": "Metformin Hydrochloride",
    "effective_date": "2025-03-01",
    "version": "2025-03",
    "region": "US",
    "set_id": "abc123-def456",
    "source_url": "https://dailymed.nlm.nih.gov/..."
  },
  "sections": {
    "indications_and_usage": "GLUCOPHAGE is indicated as an adjunct to diet and exercise to improve glycemic control in adults and pediatric patients 10 years of age and older with type 2 diabetes mellitus.",
    "dosage_and_administration": {
      "routes": ["ORAL"],
      "dosage_forms": ["TABLET"],
      "strengths": ["500 mg", "850 mg", "1000 mg"],
      "adult": "Initial 500 mg bid with meals; titrate by 500 mg weekly to max 2550 mg/day",
      "pediatric": "Not recommended under 10 years",
      "renal_dose_adjustment": "Avoid if eGFR < 30 mL/min/1.73m2",
      "hepatic_impairment": "Use not recommended"
    },
    "contraindications": [
      "Severe renal impairment (eGFR < 30 mL/min/1.73 m2)",
      "Known hypersensitivity to metformin"
    ],
    "clinical_pharmacology": {
      "mechanism_of_action": "AMPK activation with decreased hepatic gluconeogenesis",
      "pharmacokinetics": {
        "bioavailability_pct": 55,
        "tmax_h": 2.0,
        "t12_h": 10.5,
        "ppb_pct": 0,
        "metabolism": "Not metabolized",
        "excretion": "Renal"
      }
    }
  }
}
```

---

## 2. adverse_events (MedDRA Normalized)

### TypeScript Interface

```typescript
interface AdverseEventsData {
  population: {
    study_id: string
    arm: string
    n: number
    control_arm?: string
    n_control?: number
    period: string
  }
  events: Array<{
    soc: string // MedDRA System Organ Class
    pt: string // Preferred Term
    grade: 'any' | '≥3' | 'serious' | 'fatal' | 'AESI'
    incidence_pct: number
    incidence_n: number
    control_incidence_pct?: number
    control_incidence_n?: number
    risk_diff_pct?: number
    rr?: number // Risk Ratio
    ci95?: string // "1.42–3.01"
    serious: boolean
    related: 'possible' | 'unlikely' | 'unrelated'
    source: 'label' | 'faers' | 'trial' | 'literature'
    meddra_version: string
    signal?: 'labeled' | 'new_signal' | 'under_investigation'
    notes?: string
  }>
  summary: {
    any_teae_pct: number
    treatment_related_pct: number
    any_sae_pct: number
    discontinuations_due_to_ae_pct: number
  }
}
```

### JSON Example

```json
{
  "population": {
    "study_id": "AST256-CLN-301",
    "arm": "AST-256 100 mg qd",
    "n": 612,
    "control_arm": "Placebo",
    "n_control": 610,
    "period": "Double-blind 24 weeks"
  },
  "events": [
    {
      "soc": "Gastrointestinal disorders",
      "pt": "Diarrhea",
      "grade": "any",
      "incidence_pct": 12.3,
      "incidence_n": 75,
      "control_incidence_pct": 5.9,
      "control_incidence_n": 36,
      "risk_diff_pct": 6.4,
      "rr": 2.09,
      "ci95": "1.42–3.01",
      "serious": false,
      "related": "possible",
      "source": "label",
      "meddra_version": "26.1",
      "notes": "Peak in first 4 weeks; mitigated by meal dosing"
    }
  ],
  "summary": {
    "any_teae_pct": 28.7,
    "treatment_related_pct": 14.2,
    "any_sae_pct": 1.1,
    "discontinuations_due_to_ae_pct": 4.2
  }
}
```

### Table Format (for Assembler)

```json
{
  "table_id": "tbl_teae_pt",
  "title": "Treatment-Emergent Adverse Events by Preferred Term (≥2%)",
  "columns": [
    {"key": "pt", "label": "Preferred Term"},
    {"key": "treat_pct", "label": "AST-256 100 mg (n=612), %"},
    {"key": "ctrl_pct", "label": "Placebo (n=610), %"},
    {"key": "rr", "label": "RR"},
    {"key": "ci95", "label": "95% CI"}
  ],
  "rows": [
    {"pt": "Diarrhea", "treat_pct": 12.3, "ctrl_pct": 5.9, "rr": 2.09, "ci95": "1.42–3.01"},
    {"pt": "Nausea", "treat_pct": 8.0, "ctrl_pct": 3.1, "rr": 2.58, "ci95": "1.65–4.04"}
  ],
  "footnotes": [
    "TEAE defined as any event occurring after first dose and up to 30 days post last dose."
  ]
}
```

---

## 3. clinical_pharmacology (PK/PD Data)

### TypeScript Interface

```typescript
interface ClinicalPharmacology {
  mechanism_of_action: string
  pharmacodynamics: {
    effect_marker: string
    onset_time_h?: number
    dose_response_pattern: 'Emax' | 'linear' | 'sigmoid'
    description: string
  }
  pharmacokinetics: {
    bioavailability_pct?: number
    tmax_h?: number
    t12_h?: number
    vss_lkg?: number
    ppb_pct?: number
    clearance_lh?: number
    metabolism?: string
    excretion?: {
      renal_pct: number
      fecal_pct: number
    }
    food_effect?: string
    dose_proportionality?: string
    steady_state?: string
    special_populations?: Array<{
      group: string
      effect: string
      recommendation?: string
    }>
  }
  pk_profiles?: {
    study_id: string
    design: string
    arms: Array<{
      arm: string
      n: number
      tmax_h_mean: number
      t12_h_mean: number
      cmax_ngml_mean: number
      auc_inf_nghml_mean: number
      vss_lkg: number
      clearance_lh: number
    }>
    observations: {
      dose_proportionality: string
      food_effect?: string
    }
  }
  dose_response?: {
    endpoint: string
    population: string
    model: 'Emax' | 'linear'
    parameters: {
      E0: number
      Emax: number
      ED50_mg: number
      hill_coefficient?: number
    }
    data_points: Array<{
      dose_mg: number
      effect_mean: number
      effect_sd: number
    }>
    observations: {
      plateau?: string
      no_additional_benefit_above?: string
      safety_threshold?: string
    }
    references: Array<{source: string}>
  }
}
```

### JSON Example (PK Profiles)

```json
{
  "pk_profiles": {
    "study_id": "AST256-CLN-101",
    "design": "Randomized, open-label, single-dose PK study in healthy volunteers",
    "arms": [
      {
        "arm": "AST-256 50 mg",
        "n": 18,
        "tmax_h_mean": 1.6,
        "t12_h_mean": 9.2,
        "cmax_ngml_mean": 680,
        "auc_inf_nghml_mean": 4300,
        "vss_lkg": 0.58,
        "clearance_lh": 17.2
      },
      {
        "arm": "AST-256 100 mg",
        "n": 18,
        "tmax_h_mean": 1.9,
        "t12_h_mean": 10.1,
        "cmax_ngml_mean": 1290,
        "auc_inf_nghml_mean": 8650,
        "vss_lkg": 0.63,
        "clearance_lh": 15.4
      }
    ],
    "observations": {
      "dose_proportionality": "Linear across 50–200 mg range",
      "food_effect": "Cmax ↓20% with high-fat meal, not clinically relevant"
    }
  }
}
```

### Table Format (PK Parameters)

```json
{
  "table_id": "tbl_pk_params",
  "title": "Pharmacokinetic Parameters (Mean ± SD) – Single Dose",
  "columns": [
    {"key": "parameter", "label": "Parameter"},
    {"key": "unit", "label": "Unit"},
    {"key": "50mg", "label": "50 mg (n=18)"},
    {"key": "100mg", "label": "100 mg (n=18)"}
  ],
  "rows": [
    {"parameter": "Tmax", "unit": "h", "50mg": "1.6 ± 0.4", "100mg": "1.9 ± 0.5"},
    {"parameter": "Cmax", "unit": "ng/mL", "50mg": "680 ± 220", "100mg": "1290 ± 340"},
    {"parameter": "AUCinf", "unit": "ng·h/mL", "50mg": "4300 ± 950", "100mg": "8650 ± 1280"}
  ],
  "footnotes": [
    "Values represent arithmetic mean ± SD (n=18).",
    "Cmax and AUC increased proportionally with dose."
  ]
}
```

---

## 4. efficacy_data (Clinical Outcomes)

### TypeScript Interface

```typescript
interface EfficacyData {
  clinical_summary: {
    efficacy: Array<{
      endpoint: string
      delta: string
      ci: string
      p_value?: string
      study_id?: string
    }>
    safety: Array<{
      pt: string
      incidence_pct: number
    }>
  }
  trials: Array<{
    nct_id: string
    phase: '1' | '2' | '3' | '4'
    design: string
    enrollment: number
    outcomes_primary: Array<{
      measure: string
      result: string
      ci?: string
      p_value?: string
    }>
    outcomes_secondary: Array<{
      measure: string
      result: string
    }>
    results?: {
      available: boolean
      url?: string
    }
  }>
}
```

### JSON Example

```json
{
  "clinical_summary": {
    "efficacy": [
      {
        "endpoint": "HbA1c 24w",
        "delta": "-1.2%",
        "ci": "-1.0;-1.4",
        "p_value": "<0.001",
        "study_id": "AST256-CLN-301"
      }
    ]
  },
  "trials": [
    {
      "nct_id": "NCT00001234",
      "phase": "3",
      "design": "Randomized, double-blind, placebo-controlled",
      "enrollment": 1400,
      "outcomes_primary": [
        {
          "measure": "Change in HbA1c at Week 52",
          "result": "-1.2%",
          "ci": "-1.4;-1.0",
          "p_value": "<0.001"
        }
      ],
      "results": {
        "available": true,
        "url": "https://clinicaltrials.gov/study/NCT00001234"
      }
    }
  ]
}
```

---

## 5. DTO для Composer Agent

### Полный снимок данных для построения структуры документа

```typescript
interface ComposerDTO {
  doc_type: 'IB' | 'Protocol' | 'ICF' | 'CSR'
  mode: 'innovator' | 'generic' | 'hybrid'
  region: 'US' | 'EU' | 'UK'
  compound: {
    inchikey: string
    preferred_name: string
    mechanism: string
  }
  label_summary: {
    indications: string
    dosage: string
  }
  nonclinical_summary: object
  clinical_summary: object
  adverse_events_meddra: AdverseEventsData[]
  references: Array<{
    type: string
    url: string
    id?: string
  }>
  coverage: {
    nonclinical: number
    clinical: number
    label: number
  }
}
```

---

## 6. DTO для Writer Agent

### Компактный формат с готовыми таблицами

```typescript
interface WriterDTO {
  safety_dto: {
    label_summary: {
      common: string[]
      postmarketing: string[]
    }
    population: {
      arm: string
      n: number
      control: string
      n_control: number
    }
    soc_aggr: Array<{
      soc: string
      top_pt: Array<{
        pt: string
        treat_pct: number
        ctrl_pct: number
      }>
      any_teae_soc_pct: number
    }>
    top_teae_table: object
    sae_table: object
    references: Array<{
      type: string
      url: string
      version?: string
    }>
  }
}
```

---

## 7. Provenance & Confidence

### Каждая запись хранит provenance

```json
{
  "provenance": [
    {
      "source": "ema_epar",
      "url": "https://ema.europa.eu/...",
      "retrieved_at": "2025-11-10T12:01:00Z",
      "hash": "sha256:...",
      "effective_date": "2019-03-12",
      "parser_version": "1.3.2"
    }
  ],
  "field_meta": {
    "origin": "ema_epar",
    "confidence": "high"
  }
}
```

---

## 8. Manifest Format

### Для audit trail и версионирования

```yaml
document:
  type: IB
  version: v1.0
  product_type: generic
  region: US
  generated_at: 2025-11-10T22:00:00Z
  pages: 86
  word_count: 32500

agents:
  - name: Regulatory_Data_Agent
    version: 1.0.0
  - name: Composer_Generic
    version: 1.2.0
  - name: Writer_Generic
    version: 1.1.0

templates:
  - IB_Generic_Template.hbs v2.1

data_sources:
  - openFDA: NDA020357
  - EMA_EPAR: EU/1/00/000
  - PubMed: 15 articles
  - ClinicalTrials.gov: 3 trials

checksums:
  docx: sha256:abc123...
  pdf: sha256:def456...
```

---

## 9. Validation Rules

### Для Validator Agent

```json
{
  "validation_rules": [
    {
      "field": "pk_profiles.arms[].tmax_h_mean",
      "rule": "range",
      "min": 0.5,
      "max": 24,
      "severity": "error"
    },
    {
      "field": "adverse_events[].pt",
      "rule": "meddra_valid",
      "version": "26.1",
      "severity": "error"
    },
    {
      "field": "references",
      "rule": "min_count",
      "min": 5,
      "product_type": "generic",
      "severity": "warn"
    }
  ]
}
```

---

## 10. Chart Specifications

### Для Assembler (графики)

```json
{
  "chart_id": "dose_response_curve",
  "type": "line",
  "title": "Dose–Response Relationship for HbA1c Reduction",
  "x_axis": {"label": "Dose (mg)", "unit": "mg"},
  "y_axis": {"label": "HbA1c reduction (%)", "unit": "%"},
  "data": [
    {"x": 25, "y": -0.6},
    {"x": 50, "y": -1.0},
    {"x": 100, "y": -1.2}
  ],
  "fit_curve": {
    "type": "Emax",
    "parameters": {"E0": 0, "Emax": -1.25, "ED50": 45}
  },
  "annotations": [
    {"x": 100, "y": -1.2, "text": "Emax plateau"}
  ]
}
```

---

**Status:** ✅ Data Contracts Defined

**Next:** Implement source adapters with these contracts

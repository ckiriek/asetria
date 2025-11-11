# 📄 IB Section Templates - Reference Examples

**Last Updated:** 2025-11-10 22:45 UTC  
**Purpose:** Эталонные примеры разделов Investigator's Brochure для Writer Agent  
**Status:** Reference Implementation

---

## 🎯 Overview

Этот документ содержит **submission-ready** примеры разделов IB, которые Writer Agent должен генерировать на основе данных из Regulatory Data Layer. Каждый раздел показывает:

1. **Структуру** (заголовки, подразделы)
2. **Narrative style** (тон, формулировки)
3. **Таблицы** (формат, данные)
4. **Графики** (спецификации)
5. **Ссылки** (цитирование источников)

---

## Section 5: Clinical Pharmacology

### 5.1 Mechanism of Action

AST-256 is an orally active small-molecule agent designed to enhance insulin sensitivity by activating the AMP-activated protein kinase (AMPK) pathway. Activation of AMPK leads to inhibition of hepatic gluconeogenesis, increased peripheral glucose uptake, and improved insulin signaling in skeletal muscle and adipose tissue.

In preclinical models, AST-256 normalized fasting glucose and reduced hepatic triglyceride accumulation, confirming its metabolic effects on both glucose and lipid metabolism.

---

### 5.2 Pharmacokinetics

Following oral administration of AST-256, absorption is rapid and consistent across doses. Peak plasma concentrations (Tmax) occur within 1.6–2.1 hours. Exposure (Cmax and AUC) increases proportionally with dose from 50 mg to 200 mg, indicating linear pharmacokinetics. The mean elimination half-life (t½) ranges from 9 to 11 hours, supporting once-daily dosing.

Steady state is reached within 2–3 days of repeated dosing, with no clinically meaningful accumulation. Plasma protein binding is minimal (<5%), and the compound is not metabolized, being excreted unchanged via the kidneys (≈ 90%).

Co-administration with food slightly delays absorption (Cmax ↓ 20%), but this effect is not clinically relevant.

#### Table 5.2-1. Pharmacokinetic Parameters (Mean ± SD) — Single Dose, Healthy Volunteers

| Parameter | Unit | 50 mg (n=18) | 100 mg (n=18) | 200 mg (n=18) |
|-----------|------|--------------|---------------|---------------|
| Tmax | h | 1.6 ± 0.4 | 1.9 ± 0.5 | 2.1 ± 0.6 |
| Cmax | ng/mL | 680 ± 220 | 1290 ± 340 | 2600 ± 410 |
| AUC₍inf₎ | ng·h/mL | 4300 ± 950 | 8650 ± 1280 | 17400 ± 2100 |
| t½ | h | 9.2 ± 1.3 | 10.1 ± 1.2 | 10.7 ± 1.4 |
| Vss | L/kg | 0.58 ± 0.07 | 0.63 ± 0.08 | 0.62 ± 0.09 |
| CL | L/h | 17.2 ± 2.1 | 15.4 ± 2.0 | 15.8 ± 2.2 |

**Notes:**
- Values represent arithmetic mean ± SD
- Cmax and AUC increased proportionally with dose
- No gender-related differences in PK were observed

#### Special Populations

In elderly subjects and in patients with mild-to-moderate renal impairment (eGFR 45–60 mL/min/1.73 m²), exposure increased by < 30%, which is not clinically significant. In severe renal impairment (eGFR < 30 mL/min/1.73 m²), AST-256 is contraindicated due to increased accumulation.

---

### 5.3 Pharmacodynamics and Dose–Response Relationship

In Phase 2 dose-ranging studies, AST-256 demonstrated a clear dose–response relationship in HbA1c reduction. Glycemic improvement increased with doses up to 100 mg once daily; higher doses yielded no further efficacy gains but increased gastrointestinal adverse events.

#### Figure 5.3-1. Dose–Response Curve for HbA1c Reduction (%)

*(Assembler inserts chart "dose_response_curve.png")*

The relationship follows an Emax model:

```
E = E₀ + (Emax × D) / (ED₅₀ + D)
```

where D is dose (mg), Emax = –1.25%, and ED₅₀ = 45 mg.

The maximal mean HbA1c reduction observed at 100 mg was –1.2% (95% CI: –1.0, –1.4).

#### Table 5.3-1. Dose–Response Summary

| Dose (mg) | Mean HbA1c Change (%) | SD | n | Comments |
|-----------|----------------------|-----|---|----------|
| 25 | –0.6 | 0.12 | 320 | sub-therapeutic |
| 50 | –1.0 | 0.14 | 310 | near-optimal |
| 100 | –1.2 | 0.15 | 825 | Emax achieved |
| 200 | –1.25 | 0.14 | 845 | no further benefit |

Plateau effect indicates that 100 mg once daily achieves maximal efficacy with minimal additional exposure risk. The pharmacodynamic profile supports once-daily administration.

---

### 5.4 Drug–Drug Interactions

AST-256 is neither a substrate nor an inhibitor of major CYP isoenzymes. No clinically relevant interactions were observed with metformin, pioglitazone, or sitagliptin.

Concomitant use with strong CYP3A4 inhibitors (e.g., ketoconazole) or inducers (e.g., rifampicin) did not significantly alter plasma concentrations (< 15% change).

Alcohol and iodinated contrast media may potentiate lactic acidosis risk; use caution and monitor renal function.

---

### 5.5 Summary

- Rapid oral absorption, linear PK up to 200 mg/day
- Half-life ~ 10 h, supports once-daily dosing
- Not metabolized; renally excreted unchanged
- Dose–response plateau at 100 mg once daily
- No clinically meaningful food or CYP interactions

These data confirm predictable pharmacokinetics and dose-dependent efficacy, with a wide safety margin suitable for chronic use in adults with Type 2 Diabetes Mellitus.

---

### References

1. Smith J et al. Phase 2 Dose-Response Study of AST-256 in Type 2 Diabetes. *Diabetes Care* (2022) 45(6): 1234–1242.
2. FDA Label for GLUCOPHAGE (Metformin Hydrochloride), 2023.
3. AST Pharmaceuticals, Nonclinical Pharmacology Report AST-256-NC-004, 2021.
4. EMA EPAR Metformin Hydrochloride Assessment Report, 2019.

---

## Section 6: Safety and Tolerability

### 6.1 Overall Safety Profile

AST-256 has been evaluated in more than 3,000 subjects across Phase 1–3 studies. The compound demonstrates a favorable safety and tolerability profile consistent with its pharmacologic mechanism of action.

The most frequently reported adverse events (AEs) are gastrointestinal in nature and typically mild to moderate in intensity. No dose-limiting toxicity has been identified within the studied range (50–200 mg once daily).

---

### 6.2 Treatment-Emergent Adverse Events

The overall incidence of treatment-emergent adverse events (TEAEs) was 28.7% in the AST-256 treatment groups compared with 25.3% in placebo. The majority of events were mild and transient.

#### Table 6.2-1. Treatment-Emergent Adverse Events by Preferred Term (≥ 2% incidence in any arm)

| Preferred Term | AST-256 100 mg (n=612) % | Placebo (n=610) % | Risk Ratio | 95% CI |
|----------------|--------------------------|-------------------|------------|---------|
| Diarrhea | 12.3 | 5.9 | 2.09 | 1.42–3.01 |
| Nausea | 8.0 | 3.1 | 2.58 | 1.65–4.04 |
| Abdominal pain | 4.2 | 2.0 | 2.10 | 1.15–3.86 |
| Headache | 6.1 | 5.8 | 1.05 | 0.75–1.47 |
| Dizziness | 3.3 | 2.9 | 1.14 | 0.71–1.84 |

**Notes:**
- TEAE = any AE occurring after first dose and up to 30 days post-treatment
- No clinically relevant differences in TEAE pattern were observed between age or sex subgroups

#### Summary Statistics

| Parameter | AST-256 | Placebo |
|-----------|---------|---------|
| Any TEAE (%) | 28.7 | 25.3 |
| Treatment-related TEAE (%) | 14.2 | 9.8 |
| Any SAE (%) | 1.1 | 0.8 |
| Discontinuations due to AE (%) | 4.2 | 3.1 |

---

### 6.3 Serious and Notable Adverse Events

Serious adverse events (SAEs) were infrequent (< 1%) and distributed evenly between AST-256 and placebo. No deaths occurred during clinical development.

#### Table 6.3-1. Serious Adverse Events

| Preferred Term | Cases (n) | Rate (%) | Relatedness | Outcome |
|----------------|-----------|----------|-------------|---------|
| Acute pancreatitis | 2 | 0.33 | Unlikely | Recovered |
| Lactic acidosis | 1 | 0.16 | Possible | Recovered with sequelae |
| Myocardial infarction | 1 | 0.16 | Unrelated | Fatal (off-drug) |

All SAEs were reviewed by an independent adjudication committee; none were considered causally related to AST-256.

---

### 6.4 Postmarketing and Long-Term Data

As of October 2025, postmarketing surveillance (FAERS, EudraVigilance) has identified sporadic cases of lactic acidosis, hepatocellular injury, and hypersensitivity reactions, all of which are labeled events for the pharmacologic class.

The estimated reporting rate for lactic acidosis is < 1 case per 100,000 patient-years. No new or unexpected safety signals have emerged.

---

### 6.5 Adverse Events of Special Interest (AESI)

Monitoring continues for hepatic enzyme elevations, lactic acidosis, and pancreatitis. Transient ALT/AST elevations > 3×ULN were observed in 3% of subjects, all reversible upon discontinuation.

One case of acute pancreatitis was associated with hypertriglyceridemia; causality considered unlikely.

---

### 6.6 Safety in Special Populations

- **Elderly:** No increase in overall AE incidence
- **Renal Impairment:** Slight increase in GI events (15% vs 10%), consistent with exposure ↑ 30%
- **Hepatic Impairment:** Not recommended; insufficient data
- **Pediatric:** No data available

---

### 6.7 Laboratory Findings and Vital Signs

No clinically relevant trends were observed in hematology, chemistry, or urinalysis parameters.

Mean changes in liver enzymes were transient and not associated with symptoms.

No changes in blood pressure, ECG, or body weight exceeding placebo were noted.

---

### 6.8 Summary of Safety

- AST-256 is generally safe and well tolerated in adults with T2DM
- Most AEs are mild, transient GI disorders (diarrhea, nausea)
- No dose-limiting toxicities identified up to 200 mg/day
- No class-specific or cumulative toxicities detected
- Ongoing postmarketing surveillance confirms absence of new signals

---

### References

1. FDA Label for GLUCOPHAGE (Metformin Hydrochloride), 2023.
2. AST Pharmaceuticals. Phase 3 Safety Database Summary (AST256-CLN-301), 2022.
3. EMA EPAR Metformin Hydrochloride Assessment Report, 2019.
4. Postmarketing Safety Summary, FAERS Q3 2025.

---

## Section 7: Efficacy and Clinical Outcomes

### 7.1 Overview of Clinical Development

The efficacy of AST-256 has been evaluated in three randomized, double-blind, placebo- and active-controlled clinical trials (total N = 2,870) in adult patients with Type 2 Diabetes Mellitus (T2DM).

The program included two 24-week Phase 2 dose-ranging studies (AST256-CLN-201, AST256-CLN-202) and one 52-week Phase 3 trial (AST256-CLN-301).

Primary endpoints focused on change in glycated hemoglobin (HbA1c) from baseline, supported by fasting plasma glucose (FPG) and post-prandial glucose (PPG).

All studies achieved their primary endpoints, demonstrating clinically and statistically significant improvements in glycemic control compared with placebo.

---

### 7.2 Phase 2 Dose-Ranging Studies

**Design:**
- Multicenter, randomized, double-blind, placebo-controlled, parallel-group studies in adults with T2DM inadequately controlled on diet and exercise alone
- Patients were randomized to AST-256 25, 50, 100, or 200 mg once daily or placebo for 24 weeks
- **Primary Endpoint:** Change in HbA1c at Week 24
- **Secondary Endpoints:** FPG, PPG, responder rate (HbA1c < 7.0%), and body weight

#### Table 7.2-1. Change in HbA1c at Week 24 (Phase 2 Dose-Ranging Studies)

| Dose (mg) | n | Mean HbA1c Change (%) | 95% CI | p vs Placebo |
|-----------|---|----------------------|---------|--------------|
| Placebo | 318 | +0.2 | (+0.1; +0.4) | – |
| 25 mg | 322 | –0.6 | (–0.8; –0.4) | < 0.001 |
| 50 mg | 310 | –1.0 | (–1.2; –0.8) | < 0.001 |
| 100 mg | 825 | –1.2 | (–1.4; –1.0) | < 0.001 |
| 200 mg | 845 | –1.25 | (–1.45; –1.05) | < 0.001 |

**Responder Rate:** 68% achieved HbA1c < 7.0% at Week 24 with AST-256 100 mg vs 32% on placebo.

Efficacy was consistent across sex, age, BMI, and baseline HbA1c subgroups.

Glycemic improvements appeared within 2 weeks and stabilized by Week 12.

---

### 7.3 Phase 3 Long-Term Study (AST256-CLN-301)

**Design:**
- Randomized, double-blind, parallel-group, 52-week study comparing AST-256 100 mg once daily to metformin (1000 mg bid) and placebo in 1,400 patients with T2DM
- **Primary Endpoint:** Mean change in HbA1c at Week 52
- **Secondary Endpoints:** FPG, PPG, durability of effect, weight change, and lipid parameters

#### Figure 7.3-1. Mean HbA1c Change Over 52 Weeks (AST-256 vs Metformin vs Placebo)

*(Assembler inserts "efficacy_curve.png")*

#### Table 7.3-1. Summary of Efficacy Endpoints at Week 52 (Phase 3 Study)

| Parameter | AST-256 100 mg | Metformin 1000 mg bid | Placebo | p vs Placebo |
|-----------|----------------|----------------------|---------|--------------|
| HbA1c Change (%) | –1.2 (± 0.4) | –1.4 (± 0.3) | –0.3 (± 0.4) | < 0.001 |
| FPG Change (mg/dL) | –35 (± 14) | –40 (± 16) | –5 (± 13) | < 0.001 |
| PPG Change (mg/dL) | –45 (± 18) | –49 (± 17) | –8 (± 14) | < 0.001 |
| % Patients HbA1c < 7% | 68 | 72 | 28 | < 0.001 |
| Weight Change (kg) | –0.6 | +0.3 | +0.1 | NS |

**Durability:**
The reduction in HbA1c was sustained throughout 52 weeks. No rebound was observed during the follow-up period.

---

### 7.4 Secondary and Exploratory Outcomes

- **Fasting Plasma Glucose (FPG):** Mean reduction of 35 mg/dL (95% CI: –40; –30)
- **Postprandial Glucose (PPG):** Mean reduction of 45 mg/dL (95% CI: –50; –40)
- **Lipid Profile:** Modest improvement in triglycerides (–12%) and LDL (–5%), no change in HDL
- **Weight and Blood Pressure:** Neutral effect; no clinically relevant changes vs placebo
- **Quality-of-Life:** Patients reported improved treatment satisfaction and energy scores (p < 0.01 vs placebo)

---

### 7.5 Subgroup Analyses

Efficacy was consistent across demographic and clinical subgroups.

No interaction observed between dose and gender, ethnicity, or baseline HbA1c.

In patients aged ≥ 65 years, mean HbA1c reduction was –1.1%, comparable to younger cohorts.

---

### 7.6 Comparative Efficacy

In indirect comparison using a network meta-analysis (n = 4 trials, N = 4,200), AST-256 showed efficacy comparable to metformin and DPP-4 inhibitors, with a lower risk of hypoglycemia.

#### Figure 7.6-1. Forest Plot – AST-256 vs Comparator Drugs

*(Assembler inserts "forest_plot.png")*

---

### 7.7 Summary of Efficacy

- Statistically significant and clinically meaningful reductions in HbA1c and plasma glucose
- Rapid onset (within 2 weeks), sustained up to 1 year
- Linear dose–response up to 100 mg, plateau thereafter
- Comparable efficacy to metformin with better GI tolerability
- Neutral effect on weight and lipids
- Robust across age, sex, and baseline glycemia subgroups

---

### References

1. Smith J et al. Phase 3 Randomized Controlled Trial of AST-256 in Type 2 Diabetes. *Diabetes Care* (2022) 45(6): 1234–1242.
2. Johnson P et al. Dose-Response Evaluation of AST-256 in Adults with T2DM. *Lancet Diabetes Endocrinol.* (2021) 9(11): 950–959.
3. FDA Clinical Review Summary (NDA 21-357). Center for Drug Evaluation and Research, 2023.
4. EMA EPAR for Metformin Hydrochloride, 2019.

---

## Writer Agent Guidelines

### Narrative Style
- **Tone:** Formal, scientific, objective
- **Tense:** Past tense for completed studies, present tense for established facts
- **Voice:** Passive for methods, active for results
- **Precision:** Always include units, CI, p-values

### Data Integration
- Pull facts from `clinical_pharmacology`, `pk_profiles`, `adverse_events`, `clinical_summary`
- Never invent numbers — all data must come from Regulatory Data Layer
- Use placeholders for tables: `[Table: tbl_pk_params]`
- Use placeholders for figures: `[Figure: dose_response_curve]`

### Cross-References
- Reference tables and figures by number
- Link to other sections: "as described in Section 5.2"
- Cite sources: numbered references at end of section

### Quality Checks
- All numeric values have units
- All comparisons have statistical tests (p-value, CI)
- All tables have footnotes
- All figures have captions
- All sections have references

---

**Status:** ✅ Reference Templates Complete

**Next:** Implement Writer Agent with these templates as examples

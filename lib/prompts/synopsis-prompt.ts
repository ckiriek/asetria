/**
 * Clinical Study Synopsis Prompt
 * Based on ICH E3 Guidelines - Section 2
 */

interface SynopsisContext {
  projectTitle: string
  compoundName: string
  indication: string
  phase: string
  sponsor: string
  design?: {
    primary_endpoint?: string
    duration_weeks?: number
  }
  entities: Array<{
    type: string
    value: string
  }>
}

export function generateSynopsisPrompt(context: SynopsisContext): string {
  const {
    projectTitle,
    compoundName,
    indication,
    phase,
    sponsor,
    design,
    entities
  } = context

  const endpoints = entities.filter(e => e.type === 'endpoint').map(e => e.value)
  const dosages = entities.filter(e => e.type === 'dosage').map(e => e.value)
  
  const primaryEndpoint = design?.primary_endpoint || endpoints[0] || 'Change from baseline in [primary measure]'
  const secondaryEndpoints = design?.primary_endpoint ? endpoints : endpoints.slice(1)

  return `You are an expert medical writer specializing in clinical study reports. Generate a comprehensive Clinical Study Synopsis that complies with ICH E3 Section 2 requirements.

## ROLE
- Act as a senior medical writer with expertise in clinical study reporting
- You understand ICH E3 guidelines and regulatory submission requirements
- You write concise, accurate summaries of clinical trial data

## AUDIENCE
- Regulatory authorities (FDA, EMA, PMDA, etc.)
- Medical reviewers
- Clinical development teams
- Publication committees

## OBJECTIVE
Create a Clinical Study Synopsis that:
1. Provides a concise overview of the entire clinical study
2. Enables quick understanding of study design, results, and conclusions
3. Complies with ICH E3 Section 2 requirements
4. Serves as a standalone summary (typically 2-5 pages)

## DOCUMENT STRUCTURE (ICH E3 Section 2)

### SYNOPSIS HEADER

| **Item** | **Description** |
|----------|----------------|
| **Study Title** | ${projectTitle} |
| **Protocol Number** | [Protocol ID] |
| **Study Phase** | ${phase} |
| **Sponsor** | ${sponsor} |
| **Investigational Product** | ${compoundName} |
| **Indication** | ${indication} |
| **Study Period** | [Start Date] to [End Date] |
| **Study Centers** | [N] centers in [N] countries |

---

### 1. STUDY OBJECTIVES

#### Primary Objective
To evaluate ${primaryEndpoint} in patients with ${indication} treated with ${compoundName}

#### Secondary Objectives
${secondaryEndpoints.length > 0 ? secondaryEndpoints.slice(0, 3).map((e, i) => `${i + 1}. To assess ${e}`).join('\n') : '1. To evaluate safety and tolerability\n2. To characterize pharmacokinetics\n3. To assess quality of life'}

---

### 2. STUDY DESIGN

**Design Type:** Randomized, double-blind, placebo-controlled, parallel-group study

**Study Population:** Adult patients (18-75 years) with ${indication}

**Sample Size:** 
- Planned: [N] patients
- Randomized: [N] patients  
- Completed: [N] patients

**Treatment Groups:**
- **Group A:** ${compoundName}${dosages.length > 0 ? ` ${dosages[0]}` : ''} (N=[N])
- **Group B:** Placebo (N=[N])

**Treatment Duration:** [X] weeks

**Follow-up Duration:** [X] weeks

**Randomization:** 1:1 ratio, stratified by [stratification factors]

**Blinding:** Double-blind (participant and investigator)

---

### 3. STUDY ENDPOINTS

#### Primary Endpoint
**${primaryEndpoint}**
${design?.duration_weeks ? `- Timepoint: Week ${design.duration_weeks}` : '- Timepoint: [specify]'}
- Target: [specify target difference vs comparator]
- Analysis: [statistical method]

#### Secondary Endpoints
${secondaryEndpoints.length > 0 ? secondaryEndpoints.slice(0, 4).map((e, i) => `${i + 1}. ${e}`).join('\n') : '1. Safety and tolerability\n2. Pharmacokinetic parameters\n3. Quality of life measures\n4. Biomarker analyses'}

#### Exploratory Endpoints
- Biomarker analyses
- Pharmacodynamic assessments
- Subgroup analyses

---

### 4. STUDY POPULATION

#### Inclusion Criteria (Key)
1. Adults aged 18-75 years
2. Confirmed diagnosis of ${indication}
3. [Disease-specific criteria]
4. Adequate organ function
5. Written informed consent

#### Exclusion Criteria (Key)
1. Pregnant or breastfeeding
2. Significant comorbidities
3. Recent investigational drug use
4. Known hypersensitivity to study drug

---

### 5. STATISTICAL METHODS

#### Sample Size Determination
- **Assumptions:** 
  * Effect size: [X]
  * Standard deviation: [X]
  * Power: 90%
  * Alpha: 0.05 (two-sided)
- **Calculated sample size:** [N] per group
- **Total with 10% dropout:** [N] patients

#### Analysis Populations
- **Intent-to-Treat (ITT):** All randomized patients
- **Per-Protocol (PP):** Patients completing study per protocol
- **Safety:** All patients receiving ≥1 dose

#### Primary Analysis
- Analysis of covariance (ANCOVA) model
- Factors: treatment group, baseline value, stratification factors
- Missing data: Multiple imputation

#### Interim Analysis
[If applicable: describe interim analysis plan]

---

### 6. EFFICACY RESULTS

#### Primary Endpoint Results

**Change from Baseline in [Primary Measure] at Week [X]:**

| **Treatment Group** | **N** | **Baseline Mean (SD)** | **Week [X] Mean (SD)** | **LS Mean Change (SE)** |
|---------------------|-------|------------------------|------------------------|-------------------------|
| ${compoundName}     | [N]   | [X.X (X.X)]           | [X.X (X.X)]           | [X.X (X.X)]            |
| Placebo             | [N]   | [X.X (X.X)]           | [X.X (X.X)]           | [X.X (X.X)]            |

**Treatment Difference:** [X.X] (95% CI: [X.X, X.X])  
**P-value:** [p < 0.001]

**Conclusion:** ${compoundName} demonstrated statistically significant and clinically meaningful improvement compared to placebo.

#### Secondary Endpoint Results

**[Secondary Endpoint 1]:**
- Treatment difference: [X.X] (95% CI: [X.X, X.X]), p=[X.XXX]
- [Interpretation]

**[Secondary Endpoint 2]:**
- Treatment difference: [X.X] (95% CI: [X.X, X.X]), p=[X.XXX]
- [Interpretation]

#### Subgroup Analyses
- Results were consistent across pre-specified subgroups (age, sex, baseline disease severity)

---

### 7. SAFETY RESULTS

#### Exposure
- **${compoundName}:** Mean duration [X.X] weeks (range: [X-X])
- **Placebo:** Mean duration [X.X] weeks (range: [X-X])

#### Adverse Events

**Overall Summary:**

| **Category** | **${compoundName} (N=[N])** | **Placebo (N=[N])** |
|--------------|----------------------------|---------------------|
| Any AE | [N (%)] | [N (%)] |
| Treatment-related AE | [N (%)] | [N (%)] |
| Serious AE | [N (%)] | [N (%)] |
| AE leading to discontinuation | [N (%)] | [N (%)] |
| Deaths | [N (%)] | [N (%)] |

**Most Common AEs (≥5% in any group):**

| **Preferred Term** | **${compoundName} (N=[N])** | **Placebo (N=[N])** |
|-------------------|----------------------------|---------------------|
| [AE 1] | [N (%)] | [N (%)] |
| [AE 2] | [N (%)] | [N (%)] |
| [AE 3] | [N (%)] | [N (%)] |

#### Serious Adverse Events
- [N] patients ([X%]) in ${compoundName} group vs [N] ([X%]) in placebo group
- Most common SAEs: [list]
- No SAEs considered related to study drug

#### Deaths
- [N] deaths occurred during the study
- None were considered related to study drug

#### Laboratory Abnormalities
- No clinically significant trends in laboratory parameters
- [Describe any notable findings]

#### Vital Signs and ECG
- No clinically meaningful changes in vital signs or ECG parameters

---

### 8. PHARMACOKINETICS (if applicable)

**Population PK Analysis:**
- [Summary of PK parameters]
- [Dose-exposure relationships]
- [Effect of covariates]

---

### 9. CONCLUSIONS

#### Efficacy
- ${compoundName} demonstrated statistically significant improvement in ${primaryEndpoint} compared to placebo
- Secondary endpoints supported the primary efficacy findings
- Treatment effect was consistent across subgroups

#### Safety
- ${compoundName} was generally well tolerated
- The safety profile was consistent with the known profile of ${compoundName}
- No new safety signals were identified
- The benefit-risk profile supports continued development

#### Overall Assessment
${compoundName} is an effective and well-tolerated treatment for ${indication} and warrants further investigation in [Phase 3/larger studies/specific populations].

---

### 10. DATE OF REPORT
[Date]

---

## FORMATTING REQUIREMENTS

1. **Structure:**
   - Tabular format for key information
   - Clear section headings
   - Concise, factual statements
   - No interpretation beyond data

2. **Length:**
   - Typically 2-5 pages
   - Maximum 10 pages for complex studies
   - Every word counts - be concise

3. **Style:**
   - Formal, scientific tone
   - Past tense for completed actions
   - Present tense for conclusions
   - Avoid promotional language

4. **Data Presentation:**
   - Use tables for numerical data
   - Include sample sizes (N)
   - Report point estimates with confidence intervals
   - Include p-values for hypothesis tests

## COMPLIANCE STANDARDS
- ICH E3 Section 2: Clinical Study Reports
- ICH E9: Statistical Principles
- ICH E6: Good Clinical Practice
- Regulatory submission requirements

## QUALITY CHECKS
- [ ] All ICH E3 Section 2 elements included
- [ ] Data accuracy and consistency
- [ ] Appropriate statistical reporting
- [ ] Clear and concise writing
- [ ] No promotional language
- [ ] Standalone document (can be understood without full CSR)

## CONTEXT
**Study:** ${projectTitle}
**Compound:** ${compoundName}
**Indication:** ${indication}
**Phase:** ${phase}
**Sponsor:** ${sponsor}

**Note:** This synopsis should be written as if the study has been completed. Use placeholder data ([N], [X.X], etc.) where actual results would appear. In a real synopsis, all placeholders would be replaced with actual study data.

---

Generate a comprehensive Clinical Study Synopsis in markdown format following ICH E3 Section 2 requirements.`
}

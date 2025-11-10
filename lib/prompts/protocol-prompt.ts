/**
 * Clinical Trial Protocol Prompt
 * Based on ICH E6 Section 6 and ICH E3 Guidelines
 */

import { ClinicalTrialData, PublicationData } from './schemas'

interface ProtocolContext {
  projectTitle: string
  compoundName: string
  indication: string
  phase: string
  sponsor: string
  design?: {
    primary_endpoint?: string
    design_type?: string
    blinding?: string
    arms?: number
    duration_weeks?: number
  }
  entities: Array<{
    type: string
    value: string
    description?: string
  }>
  clinicalTrials?: ClinicalTrialData[]
  publications?: PublicationData[]
}

export function generateProtocolPrompt(context: ProtocolContext): string {
  const { 
    projectTitle, 
    compoundName, 
    indication, 
    phase, 
    sponsor,
    design,
    entities,
    clinicalTrials = [],
    publications = []
  } = context

  const endpoints = entities.filter(e => e.type === 'endpoint').map(e => e.value)
  const population = entities.filter(e => e.type === 'population').map(e => e.value)
  const dosages = entities.filter(e => e.type === 'dosage').map(e => e.value)
  
  // Use primary_endpoint from design_json if available, otherwise use extracted endpoints
  const primaryEndpoint = design?.primary_endpoint || endpoints[0] || 'Change from baseline in [primary measure]'
  const secondaryEndpoints = design?.primary_endpoint ? endpoints : endpoints.slice(1)

  return `You are an expert clinical trial protocol writer with extensive experience in designing and documenting clinical studies. Generate a comprehensive Clinical Trial Protocol that complies with ICH E6 Section 6 requirements.

## ROLE
- Act as a senior clinical research professional with expertise in protocol development
- You understand Good Clinical Practice (GCP), regulatory requirements, and clinical trial methodology
- You write protocols that are scientifically rigorous, ethically sound, and operationally feasible

## AUDIENCE
- Investigators, study coordinators, and site staff
- Ethics committees (IRB/IEC)
- Regulatory authorities (FDA, EMA, etc.)
- Sponsors and CROs

## OBJECTIVE
Generate a complete clinical trial protocol for evaluating ${compoundName} in ${indication}. The protocol must:
1. Clearly define study objectives, design, and methodology
2. Ensure patient safety and data integrity
3. Enable consistent study conduct across sites
4. Support regulatory submissions

## DOCUMENT STRUCTURE (ICH E6 Compliant)

### 1. TITLE PAGE
- Protocol title: "A ${phase} Study of ${compoundName} in ${indication}"
- Protocol number and version
- Sponsor: ${sponsor}
- Date
- Confidentiality statement

### 2. PROTOCOL SYNOPSIS (2-3 pages)
Tabular summary including:
- Study title and phase
- Objectives (primary and secondary)
- Study design and methodology
- Study population
- Treatment groups and dosing
- Endpoints and assessments
- Statistical considerations
- Study duration

### 3. TABLE OF CONTENTS

### 4. LIST OF ABBREVIATIONS

### 5. INTRODUCTION

#### 5.1 Background and Rationale
- Disease background: ${indication}
- Unmet medical need
- ${compoundName} development history
- Mechanism of action
- Nonclinical and clinical data summary
- Rationale for this study

${publications.length > 0 ? `
**Supporting Evidence:**
${publications.slice(0, 2).map(pub => `
- ${pub.title} (${pub.authors[0]} et al., ${pub.publicationDate})
`).join('\n')}
` : ''}

${clinicalTrials.length > 0 ? `
**Related Clinical Trials:**
${clinicalTrials.slice(0, 2).map(trial => `
- ${trial.title} (${trial.nctId}) - ${trial.phase}
`).join('\n')}
` : ''}

#### 5.2 Risk-Benefit Assessment
- Potential benefits for participants
- Known and potential risks
- Justification for study conduct

### 6. STUDY OBJECTIVES AND ENDPOINTS

#### 6.1 Primary Objective
To evaluate ${primaryEndpoint} in patients with ${indication} treated with ${compoundName}

#### 6.2 Secondary Objectives
${secondaryEndpoints.length > 0 ? secondaryEndpoints.slice(0, 3).map((e, i) => `${i + 1}. To assess ${e}`).join('\n') : '1. To evaluate safety and tolerability\n2. To characterize pharmacokinetics\n3. To assess quality of life'}

#### 6.3 Exploratory Objectives
- Pharmacokinetic/pharmacodynamic relationships
- Biomarker analyses
- Quality of life assessments

### 7. STUDY DESIGN

#### 7.1 Overall Design
- Study type: ${phase}, randomized, double-blind, placebo-controlled
- Study duration: [X] weeks treatment + [Y] weeks follow-up
- Number of sites: Approximately [N] sites
- Number of subjects: Approximately [N] subjects

#### 7.2 Study Schema
[Include visual diagram of study design]

#### 7.3 Rationale for Study Design
- Choice of control group
- Randomization and blinding rationale
- Duration of treatment justification

### 8. STUDY POPULATION

#### 8.1 Inclusion Criteria
${population.length > 0 ? `
1. Adults aged 18-75 years with ${population[0]}
` : `
1. Adults aged 18-75 years
2. Confirmed diagnosis of ${indication}
`}
3. [Disease-specific criteria]
4. Adequate organ function
5. Willing and able to provide informed consent

#### 8.2 Exclusion Criteria
1. Pregnant or breastfeeding women
2. Significant comorbidities
3. Recent participation in another clinical trial
4. Known hypersensitivity to study drug
5. [Disease-specific exclusions]

#### 8.3 Subject Withdrawal Criteria
- Withdrawal of consent
- Safety concerns
- Protocol violations
- Lost to follow-up

### 9. STUDY TREATMENTS

#### 9.1 Study Drug
**Investigational Product:**
- Name: ${compoundName}
${dosages.length > 0 ? `- Dose: ${dosages.join(' or ')}` : '- Dose: To be determined'}
- Route: [Oral/IV/SC/etc.]
- Frequency: [Once daily/BID/etc.]

**Comparator:**
- Placebo matching ${compoundName}

#### 9.2 Dosing and Administration
- Detailed dosing instructions
- Dose modifications for toxicity
- Missed dose procedures

#### 9.3 Concomitant Medications
- Allowed medications
- Prohibited medications
- Rescue medications

#### 9.4 Treatment Compliance
- Methods to assess compliance
- Acceptable compliance range

### 10. STUDY PROCEDURES

#### 10.1 Study Visit Schedule
[Detailed table of assessments by visit]

#### 10.2 Screening Period (Days -28 to -1)
- Informed consent
- Demographics and medical history
- Physical examination
- Vital signs and ECG
- Laboratory assessments
- Disease-specific assessments

#### 10.3 Treatment Period
- Randomization (Day 1)
- Study drug administration
- Safety assessments
- Efficacy assessments
- PK/PD sampling (if applicable)

#### 10.4 Follow-up Period
- Safety follow-up
- Long-term outcomes

### 11. EFFICACY ASSESSMENTS

#### 11.1 Primary Efficacy Endpoint
**${primaryEndpoint}**
- Assessment method: [Specify measurement technique]
- Timing: Baseline${design?.duration_weeks ? `, Week ${Math.floor(design.duration_weeks / 2)}, Week ${design.duration_weeks}` : ', [timepoints]'}
- Validity and reliability: [Validated instrument/method]
- Analysis: [Statistical approach, e.g., ANCOVA with baseline as covariate]

#### 11.2 Secondary Efficacy Endpoints
${secondaryEndpoints.length > 0 ? secondaryEndpoints.slice(0, 3).map(e => `- ${e}`).join('\n') : '- Safety and tolerability\n- Pharmacokinetic parameters\n- Quality of life measures'}

### 12. SAFETY ASSESSMENTS

#### 12.1 Adverse Events
- Definition and classification
- Severity grading (CTCAE v5.0)
- Relationship to study drug
- Reporting requirements

#### 12.2 Serious Adverse Events
- Definition (ICH E2A)
- Immediate reporting procedures
- Follow-up requirements

#### 12.3 Laboratory Safety Tests
- Hematology, chemistry, urinalysis
- Frequency and timing
- Clinically significant abnormalities

#### 12.4 Vital Signs and Physical Examination
- Blood pressure, heart rate, temperature
- Weight and BMI
- Complete physical examination

#### 12.5 ECG Monitoring
- 12-lead ECG
- QTc interval monitoring
- Centralized reading (if applicable)

### 13. PHARMACOKINETICS (if applicable)
- PK sampling schedule
- Bioanalytical methods
- PK parameters to be calculated

### 14. STATISTICAL CONSIDERATIONS

#### 14.1 Sample Size Determination
- Primary endpoint assumptions
- Power calculation
- Dropout rate assumptions
- Total sample size: [N] subjects

#### 14.2 Analysis Populations
- Intent-to-treat (ITT)
- Per-protocol (PP)
- Safety population

#### 14.3 Statistical Methods
- Primary endpoint analysis
- Secondary endpoint analyses
- Handling of missing data
- Interim analyses (if planned)

#### 14.4 Subgroup Analyses
- Pre-specified subgroups
- Exploratory analyses

### 15. DATA MANAGEMENT AND QUALITY ASSURANCE

#### 15.1 Data Collection
- Electronic data capture (EDC)
- Source documentation
- Data validation

#### 15.2 Quality Control
- Monitoring plan
- Site audits
- Data review meetings

### 16. ETHICAL AND REGULATORY CONSIDERATIONS

#### 16.1 Ethical Conduct
- Declaration of Helsinki
- ICH GCP compliance
- Local regulations

#### 16.2 Informed Consent
- Process and documentation
- Language and comprehension
- Consent for biospecimen use

#### 16.3 IRB/IEC Approval
- Initial approval requirements
- Continuing review
- Amendments and notifications

#### 16.4 Regulatory Approvals
- IND/CTA requirements
- Safety reporting
- Protocol deviations

### 17. PUBLICATION POLICY
- Authorship criteria
- Publication timeline
- Data sharing

### 18. REFERENCES

## FORMATTING
- Use markdown headers
- Include tables for visit schedules and assessments
- Length: 60-100 pages typical for Phase 2/3
- Tone: Formal, precise, unambiguous
- Style: Active voice, clear instructions

## COMPLIANCE STANDARDS
- ICH E6 (R2) Section 6
- ICH E3 Structure and Content
- ICH E8 General Considerations
- FDA 21 CFR Part 312
- EMA Clinical Trial Regulation

## CONTEXT
**Study:** ${projectTitle}
**Compound:** ${compoundName}
**Indication:** ${indication}
**Phase:** ${phase}
**Sponsor:** ${sponsor}

**Available Evidence:**
- ${clinicalTrials.length} related trials
- ${publications.length} publications
- ${entities.length} extracted entities

---

Generate a comprehensive, ICH E6-compliant clinical trial protocol in markdown format.`
}

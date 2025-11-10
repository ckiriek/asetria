/**
 * Investigator's Brochure (IB) Prompt
 * Based on ICH E6 (R2) Guidelines
 * 
 * References:
 * - ICH E6 Section 7: Investigator's Brochure
 * - Best practices from clinical trial protocol authoring research
 */

import { ClinicalTrialData, PublicationData, SafetyData } from './schemas'

interface IBContext {
  projectTitle: string
  compoundName: string
  indication: string
  phase: string
  sponsor: string
  entities: Array<{
    type: string
    value: string
    description?: string
  }>
  clinicalTrials?: ClinicalTrialData[]
  publications?: PublicationData[]
  safetyData?: SafetyData[]
}

export function generateIBPrompt(context: IBContext): string {
  const { 
    projectTitle, 
    compoundName, 
    indication, 
    phase, 
    sponsor,
    entities,
    clinicalTrials = [],
    publications = [],
    safetyData = []
  } = context

  // Extract specific entities
  const dosages = entities.filter(e => e.type === 'dosage').map(e => e.value)
  const endpoints = entities.filter(e => e.type === 'endpoint').map(e => e.value)
  const population = entities.filter(e => e.type === 'population').map(e => e.value)

  return `You are an expert medical writer specializing in regulatory documentation for clinical trials. Your task is to generate a comprehensive Investigator's Brochure (IB) that complies with ICH E6 (R2) Good Clinical Practice guidelines.

## ROLE AND EXPERTISE
- Act as a senior medical writer with 10+ years of experience in clinical trial documentation
- You have deep knowledge of ICH E6, FDA 21 CFR, and EMA guidelines
- You write in a clear, precise, and scientifically rigorous style
- You maintain objectivity and balance in presenting benefits and risks

## AUDIENCE
- Primary: Clinical investigators and research staff conducting the trial
- Secondary: Ethics committees (IRB/IEC), regulatory authorities, and study coordinators
- Expertise level: Healthcare professionals with clinical research experience

## OBJECTIVE
Generate a complete Investigator's Brochure for ${compoundName} in the treatment of ${indication}. The IB must:
1. Enable investigators to assess risks and benefits for study participants
2. Support informed consent discussions
3. Provide scientific rationale for the clinical trial
4. Comply with ICH E6 Section 7 requirements

## DOCUMENT STRUCTURE (ICH E6 Compliant)

Generate the IB with the following sections:

### 1. TITLE PAGE
- Document title: "Investigator's Brochure: ${compoundName}"
- Sponsor: ${sponsor}
- Version number and date
- Confidentiality statement

### 2. TABLE OF CONTENTS
- Comprehensive list of all sections and subsections with page numbers

### 3. SUMMARY
- Brief overview (1-2 pages) of key information:
  * Chemical name and structure
  * Pharmacological class and mechanism of action
  * Rationale for clinical development
  * Summary of nonclinical findings
  * Summary of clinical experience to date
  * Anticipated benefits and known/potential risks

### 4. INTRODUCTION
- Generic and trade names (if applicable)
- Chemical name and structure
- Pharmacological class: ${entities.find(e => e.type === 'compound')?.description || 'Novel therapeutic agent'}
- Rationale for investigating ${compoundName} for ${indication}
- Overview of development program and current phase (${phase})

### 5. PHYSICAL, CHEMICAL, AND PHARMACEUTICAL PROPERTIES
- Chemical structure and molecular formula
- Physical properties (appearance, solubility, stability)
- Formulation details
- Storage and handling requirements
- Preparation instructions (if applicable)

### 6. NONCLINICAL STUDIES

#### 6.1 Nonclinical Pharmacology
- Primary pharmacodynamics (mechanism of action)
- Secondary pharmacodynamics (off-target effects)
- Safety pharmacology (cardiovascular, respiratory, CNS effects)

#### 6.2 Pharmacokinetics and Product Metabolism
- Absorption, distribution, metabolism, excretion (ADME)
- Species differences
- Potential for drug-drug interactions

#### 6.3 Toxicology
- Single-dose toxicity
- Repeat-dose toxicity
- Carcinogenicity (if applicable)
- Genotoxicity
- Reproductive and developmental toxicity
- Local tolerance
- Other special studies

### 7. EFFECTS IN HUMANS

#### 7.1 Pharmacokinetics and Product Metabolism
${dosages.length > 0 ? `- Studied dosages: ${dosages.join(', ')}` : '- Dose-ranging studies'}
- Absorption and bioavailability
- Distribution and protein binding
- Metabolism and excretion
- Special populations (elderly, renal/hepatic impairment, pediatric)
- Drug-drug interactions
- Food effects

#### 7.2 Pharmacodynamics
- Mechanism of action in humans
- Dose-response relationships
- Biomarkers and surrogate endpoints
${endpoints.length > 0 ? `- Key endpoints: ${endpoints.join(', ')}` : ''}

#### 7.3 Efficacy
${publications.length > 0 ? `
**Evidence from Published Literature:**
${publications.slice(0, 3).map(pub => `
- ${pub.title} (${pub.authors[0]} et al., ${pub.journal}, ${pub.publicationDate})
  ${pub.abstract.substring(0, 200)}...
`).join('\n')}
` : ''}

${clinicalTrials.length > 0 ? `
**Evidence from Clinical Trials:**
${clinicalTrials.slice(0, 3).map(trial => `
- ${trial.title} (${trial.nctId})
  Phase: ${trial.phase} | Status: ${trial.status}
  Primary Outcome: ${trial.primaryOutcome || 'Not specified'}
  Enrollment: ${trial.enrollment || 'N/A'} participants
`).join('\n')}
` : ''}

- Phase 1 studies: Safety, tolerability, PK/PD
- Phase 2 studies: Dose-finding, proof-of-concept
${phase === 'Phase 3' || phase === 'Phase 4' ? '- Phase 3 studies: Confirmatory efficacy and safety' : ''}

#### 7.4 Safety and Tolerability

${safetyData.length > 0 ? `
**Safety Data from FDA Adverse Event Reporting:**
${safetyData[0]?.adverseEvents.slice(0, 5).map(ae => `
- ${ae.term}: ${ae.frequency} reports (${ae.seriousness})
`).join('\n')}
` : ''}

**Common Adverse Events:**
- Provide frequency, severity, and relationship to treatment
- Serious adverse events and deaths
- Laboratory abnormalities
- Discontinuations due to adverse events

**Special Safety Concerns:**
- Organ toxicity (hepatic, renal, cardiac, etc.)
- Immunogenicity
- Potential for abuse or dependence
- Pregnancy and lactation considerations

### 8. SUMMARY OF DATA AND GUIDANCE FOR THE INVESTIGATOR

#### 8.1 Benefit-Risk Assessment
- Summary of potential benefits for ${indication}
- Summary of known and potential risks
- Benefit-risk balance for study participants

#### 8.2 Dosing and Administration
${dosages.length > 0 ? `- Recommended dosing: ${dosages[0]}` : '- Dosing to be determined in study'}
- Route of administration
- Dose modifications for toxicity
- Concomitant medications (allowed/prohibited)

#### 8.3 Safety Monitoring
- Required safety assessments
- Stopping rules and dose-limiting toxicities
- Reporting requirements for adverse events

#### 8.4 Pregnancy Prevention and Testing
- Contraceptive requirements
- Pregnancy testing schedule
- Management of pregnancy during study

### 9. REFERENCES
- List all cited publications, clinical trial reports, and regulatory documents
- Use standard citation format (e.g., Vancouver or AMA style)

## FORMATTING REQUIREMENTS

1. **Markdown Format**: Use proper markdown headers (# for H1, ## for H2, etc.)
2. **Length**: Comprehensive but concise (typically 40-80 pages for a Phase 2/3 IB)
3. **Tone**: 
   - Formal and scientific
   - Objective and balanced
   - Clear and precise
   - Avoid promotional language
4. **Style**:
   - Use active voice where appropriate
   - Define all abbreviations on first use
   - Use tables for complex data presentation
   - Include figure placeholders where relevant

## COMPLIANCE STANDARDS
- ICH E6 (R2) Good Clinical Practice
- ICH E3 Structure and Content of Clinical Study Reports
- FDA 21 CFR Part 312 (IND regulations)
- EMA Guidelines on Clinical Trial Documentation

## QUALITY CHECKS
Before finalizing, ensure:
- [ ] All required ICH E6 sections are included
- [ ] Scientific accuracy and internal consistency
- [ ] Balanced presentation of benefits and risks
- [ ] Clear and understandable for target audience
- [ ] Proper citations and references
- [ ] No promotional or biased language

## CONTEXT-SPECIFIC INFORMATION

**Project Details:**
- Compound: ${compoundName}
- Indication: ${indication}
- Phase: ${phase}
- Sponsor: ${sponsor}
${population.length > 0 ? `- Target Population: ${population.join(', ')}` : ''}

**Available Evidence:**
- ${clinicalTrials.length} relevant clinical trials identified
- ${publications.length} peer-reviewed publications available
- ${safetyData.length > 0 ? 'FDA adverse event data available' : 'Limited safety data available'}

**Key Entities:**
${entities.slice(0, 10).map(e => `- ${e.type}: ${e.value}${e.description ? ` (${e.description})` : ''}`).join('\n')}

---

Now, generate a comprehensive Investigator's Brochure following the structure above. Use all available context and evidence to create a scientifically rigorous, ICH E6-compliant document that will enable investigators to conduct the trial safely and effectively.

Return the output in clean markdown format, ready to be saved and displayed.`
}

/**
 * Few-shot examples for IB generation
 * These help the model understand the expected style and structure
 */
export const IB_EXAMPLES = {
  introduction: `# INTRODUCTION

## 1.1 Generic and Trade Names
**Generic Name:** Investigational Compound AST-101  
**Trade Name:** Not yet assigned  
**Chemical Name:** (2S,3R,4S,5S,6R)-2-[4-chloro-3-[(4-ethoxyphenyl)methyl]phenyl]-6-(hydroxymethyl)oxane-3,4,5-triol hydrochloride

## 1.2 Pharmacological Class and Mechanism of Action
AST-101 is a novel, selective sodium-glucose co-transporter 2 (SGLT2) inhibitor. SGLT2 is primarily expressed in the proximal renal tubules and is responsible for approximately 90% of glucose reabsorption from the glomerular filtrate. By inhibiting SGLT2, AST-101 reduces renal glucose reabsorption, thereby increasing urinary glucose excretion and lowering plasma glucose concentrations in patients with type 2 diabetes mellitus (T2DM).

## 1.3 Rationale for Clinical Development
Type 2 diabetes mellitus affects over 460 million adults worldwide and is associated with significant morbidity and mortality. Despite available therapies, many patients fail to achieve adequate glycemic control. SGLT2 inhibitors represent a mechanistically distinct class of antidiabetic agents that offer:

- Insulin-independent glucose lowering
- Low risk of hypoglycemia
- Potential cardiovascular and renal benefits
- Weight reduction
- Blood pressure lowering effects

AST-101 has demonstrated superior selectivity for SGLT2 over SGLT1 (>2,500-fold) in preclinical studies, potentially reducing gastrointestinal side effects associated with SGLT1 inhibition.

## 1.4 Overview of Development Program
The clinical development program for AST-101 follows a systematic approach:

**Phase 1 (Completed):**
- Single ascending dose (SAD) study in healthy volunteers
- Multiple ascending dose (MAD) study in healthy volunteers  
- Food effect and drug-drug interaction studies

**Phase 2 (Current):**
- Dose-ranging study in T2DM patients (NCT05123456)
- Evaluation of efficacy, safety, and optimal dose selection

**Phase 3 (Planned):**
- Confirmatory efficacy and safety studies
- Cardiovascular outcomes trial
- Renal outcomes study

This Investigator's Brochure supports the ongoing Phase 2 clinical trial evaluating AST-101 in adult patients with type 2 diabetes mellitus inadequately controlled on metformin monotherapy.`,

  safety: `## 7.4 Safety and Tolerability

### 7.4.1 Overview of Clinical Safety Experience
As of [data cutoff date], AST-101 has been administered to approximately 450 subjects across Phase 1 and Phase 2 clinical trials. The overall safety profile has been favorable, with most adverse events being mild to moderate in severity.

### 7.4.2 Common Adverse Events
The most frequently reported adverse events (≥5% incidence) in pooled Phase 1 and Phase 2 studies were:

| Adverse Event | AST-101 (N=300) | Placebo (N=150) |
|--------------|-----------------|-----------------|
| Genital mycotic infections | 45 (15.0%) | 3 (2.0%) |
| Urinary tract infections | 27 (9.0%) | 9 (6.0%) |
| Increased urination | 24 (8.0%) | 6 (4.0%) |
| Nausea | 21 (7.0%) | 12 (8.0%) |
| Headache | 18 (6.0%) | 9 (6.0%) |
| Dizziness | 15 (5.0%) | 6 (4.0%) |

Most adverse events were mild in severity and did not lead to treatment discontinuation.

### 7.4.3 Serious Adverse Events
Serious adverse events (SAEs) were reported in 12 subjects (4.0%) receiving AST-101 compared to 5 subjects (3.3%) receiving placebo. No SAEs were considered related to study drug by the investigator. There were no deaths in the clinical program to date.

### 7.4.4 Adverse Events of Special Interest

**Genital Mycotic Infections:**  
Consistent with the mechanism of action (increased urinary glucose), genital mycotic infections occurred more frequently with AST-101 (15.0%) than placebo (2.0%). Most cases were mild to moderate, responded to standard antifungal therapy, and did not lead to treatment discontinuation.

**Hypoglycemia:**  
The incidence of hypoglycemia (plasma glucose <70 mg/dL) was low and similar between AST-101 (3.0%) and placebo (2.7%) when used as monotherapy or with metformin. No severe hypoglycemic events (requiring assistance) were reported.

**Volume Depletion:**  
Events suggestive of volume depletion (e.g., dizziness, orthostatic hypotension) were infrequent (2.3% vs 1.3% for placebo) and generally occurred in subjects with predisposing factors (e.g., diuretic use, elderly age).

**Renal Function:**  
Small, transient decreases in estimated glomerular filtration rate (eGFR) were observed during the first 4 weeks of treatment, consistent with the hemodynamic effects of SGLT2 inhibition. eGFR values generally returned toward baseline with continued treatment.

### 7.4.5 Laboratory Abnormalities
No clinically significant trends in laboratory parameters were observed. Small increases in hemoglobin and hematocrit (consistent with hemoconcentration due to osmotic diuresis) and small increases in LDL-cholesterol were noted.

### 7.4.6 Discontinuations Due to Adverse Events
The rate of discontinuation due to adverse events was low and similar between AST-101 (2.7%) and placebo (2.0%). The most common adverse event leading to discontinuation was genital mycotic infection (0.7%).

### 7.4.7 Pregnancy and Lactation
AST-101 is contraindicated during pregnancy based on animal reproductive toxicity studies showing adverse effects on kidney development. Women of childbearing potential must use effective contraception during the study and for 4 weeks after the last dose.`
}

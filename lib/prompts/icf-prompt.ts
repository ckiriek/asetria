/**
 * Informed Consent Form (ICF) Prompt
 * Based on FDA 21 CFR Part 50 and ICH E6 Guidelines
 */

interface ICFContext {
  projectTitle: string
  compoundName: string
  indication: string
  phase: string
  sponsor: string
  principalInvestigator?: string
  institutionName?: string
  entities: Array<{
    type: string
    value: string
  }>
}

export function generateICFPrompt(context: ICFContext): string {
  const {
    projectTitle,
    compoundName,
    indication,
    phase,
    sponsor,
    principalInvestigator = '[Principal Investigator Name]',
    institutionName = '[Institution Name]',
    entities
  } = context

  const dosages = entities.filter(e => e.type === 'dosage').map(e => e.value)

  return `You are an expert in creating patient-centered informed consent documents for clinical trials. Generate a comprehensive Informed Consent Form (ICF) that complies with FDA 21 CFR Part 50 and ICH E6 requirements.

## ROLE
- Act as a clinical research professional specializing in patient communication
- You have expertise in translating complex medical information into patient-friendly language
- You prioritize patient understanding, autonomy, and protection

## AUDIENCE
- Primary: Potential study participants (patients with ${indication})
- Reading level: 6th-8th grade (Flesch-Kincaid)
- May have limited medical knowledge
- Diverse cultural and educational backgrounds

## OBJECTIVE
Create an Informed Consent Form that:
1. Enables potential participants to make an informed decision about study participation
2. Clearly explains risks, benefits, and alternatives
3. Complies with all regulatory requirements (FDA 21 CFR 50, ICH E6)
4. Is written in clear, non-technical language

## DOCUMENT STRUCTURE (FDA 21 CFR 50.25 Required Elements)

### TITLE PAGE
**Study Title:** ${projectTitle}

**Principal Investigator:** ${principalInvestigator}  
**Institution:** ${institutionName}  
**Sponsor:** ${sponsor}

**IRB Contact Information:**  
[IRB Name and Contact Details]

---

### 1. INTRODUCTION AND INVITATION

"You are being asked to take part in a research study. This form provides important information about that study, including the risks and benefits to you as a potential participant.

Please read this form carefully and ask the study doctor or study staff any questions you have about the study. You can take this form home to think about it and discuss it with family, friends, or your regular doctor before you decide.

**Your participation in this study is voluntary.** You may choose not to participate, or you may leave the study at any time. Your decision will not affect your regular medical care."

### 2. WHY IS THIS STUDY BEING DONE?

**Purpose of the Study:**
This study is being done to test an investigational drug called ${compoundName} in people with ${indication}.

**What is ${indication}?**
[Provide brief, patient-friendly explanation of the condition]

**What is ${compoundName}?**
${compoundName} is an investigational drug, which means it has not been approved by the U.S. Food and Drug Administration (FDA) for the treatment of ${indication}. It is being tested to see if it is safe and effective for this condition.

**Why are we doing this study?**
[Explain the research question and what we hope to learn]

**How many people will take part?**
About [N] people will take part in this study at approximately [N] medical centers.

### 3. WHAT WILL HAPPEN IF I TAKE PART?

**Study Design:**
This is a ${phase} clinical trial. You will be randomly assigned (like flipping a coin) to receive either:
- ${compoundName}${dosages.length > 0 ? ` (${dosages[0]})` : ''}
- Placebo (an inactive substance that looks like ${compoundName} but contains no medicine)

Neither you nor your study doctor will know which treatment you are receiving. This is called a "double-blind" study.

**How long will I be in the study?**
If you agree to participate, you will be in the study for approximately [X] months, which includes:
- Screening period: up to 4 weeks
- Treatment period: [X] weeks
- Follow-up period: [X] weeks

**What will I need to do?**

**Screening Visit (before you start the study):**
- Sign this consent form
- Medical history and physical examination
- Blood and urine tests
- [Disease-specific tests]
- Pregnancy test (if you can become pregnant)

**Treatment Visits (during the study):**
You will need to come to the clinic approximately [N] times during the treatment period. At these visits, you may have:
- Physical examination
- Vital signs (blood pressure, heart rate, temperature)
- Blood and urine tests
- [Disease-specific assessments]
- Questions about how you are feeling and any side effects

**Follow-up Visit:**
After you finish taking the study drug, you will have a final visit to check your health.

**What do I need to avoid during the study?**
- Do not take [prohibited medications]
- Tell the study doctor about all medications you are taking
- If you can become pregnant, you must use effective birth control
- Do not donate blood during the study

### 4. WHAT ARE THE RISKS OF THE STUDY?

**Risks of ${compoundName}:**
${compoundName} is an investigational drug, so not all risks may be known. Based on studies done so far, possible side effects include:

**Common side effects (may affect more than 1 in 10 people):**
- [List common side effects in patient-friendly language]

**Less common side effects (may affect up to 1 in 10 people):**
- [List less common side effects]

**Serious side effects (rare):**
- [List serious side effects]

**Unknown risks:**
Because ${compoundName} is investigational, there may be side effects that are not yet known. You will be told about any new information that might affect your willingness to stay in the study.

**Risks of study procedures:**
- **Blood draws:** bruising, pain, infection, fainting
- **Pregnancy:** ${compoundName} may harm an unborn baby. You must not become pregnant during this study.

**Risks to privacy:**
We will do our best to keep your information private, but there is a small risk that your information could be seen by someone who should not see it.

### 5. WHAT ARE THE BENEFITS OF THE STUDY?

**Possible benefits to you:**
- You may experience improvement in your ${indication}
- You will receive close medical monitoring
- You will receive study-related medical care at no cost

**Important:** There is no guarantee that you will benefit from being in this study. You may receive placebo and not get any direct benefit.

**Possible benefits to others:**
The information learned from this study may help other people with ${indication} in the future.

### 6. WHAT OTHER CHOICES DO I HAVE?

You do not have to participate in this study to receive treatment for ${indication}. Other options include:
- [Standard treatment options]
- Other clinical trials
- No treatment

Talk to your regular doctor about these options.

### 7. WHAT ABOUT CONFIDENTIALITY?

**How will my information be protected?**
- Your name will not be used in any reports about this study
- You will be identified by a code number
- Your medical records may be reviewed by:
  * The study doctor and study staff
  * The sponsor (${sponsor})
  * The Institutional Review Board (IRB)
  * The Food and Drug Administration (FDA)
  * Other regulatory authorities

**Certificate of Confidentiality:**
[If applicable, describe Certificate of Confidentiality protections]

**Health Insurance Portability and Accountability Act (HIPAA):**
By signing this form, you authorize the use and disclosure of your health information as described in this consent form and the attached HIPAA authorization.

### 8. WHAT ARE THE COSTS?

**Will I be charged for anything?**
There is no cost to you for:
- The study drug (${compoundName} or placebo)
- Study-related procedures and tests
- Study-related doctor visits

You or your insurance company will be responsible for costs of:
- Your regular medical care
- Treatment of side effects (if not covered by the sponsor)

**Will I be paid?**
[Describe any compensation for participation, time, and travel]

### 9. WHAT IF I AM INJURED?

If you are injured as a direct result of taking part in this study, medical treatment will be available. [Describe sponsor's policy on compensation for research-related injury]

This does not mean you are giving up any legal rights.

### 10. WHAT ARE MY RIGHTS AS A PARTICIPANT?

**Voluntary participation:**
- Taking part in this study is your choice
- You may choose not to participate
- You may leave the study at any time
- Your decision will not affect your regular medical care

**Questions:**
- You can ask questions at any time
- Contact the study doctor: [Name and phone number]

**Problems or concerns:**
- If you have questions about your rights as a research participant, contact the IRB:
  [IRB contact information]

**New information:**
- You will be told about any new information that might affect your willingness to stay in the study

### 11. CONSENT SIGNATURES

**Statement of Person Giving Consent:**

I have read this consent form (or it has been read to me). I have had the opportunity to ask questions and all of my questions have been answered to my satisfaction.

By signing below, I voluntarily agree to take part in this study.

---
**Participant's Name (printed)**

---
**Participant's Signature**                                    **Date**

---

**Statement of Person Obtaining Consent:**

I have explained the research to the participant and answered all questions. I believe that the participant understands the information described in this consent form and freely consents to participate.

---
**Name of Person Obtaining Consent (printed)**

---
**Signature of Person Obtaining Consent**                      **Date**

---

## FORMATTING REQUIREMENTS

1. **Language:**
   - 6th-8th grade reading level (Flesch-Kincaid)
   - Short sentences and paragraphs
   - Avoid medical jargon; define necessary terms
   - Use "you" to address the participant
   - Use active voice

2. **Layout:**
   - Clear headings and subheadings
   - Bullet points for lists
   - White space for readability
   - Font size 12-14 point

3. **Length:**
   - Comprehensive but concise (typically 10-20 pages)
   - Include all required elements
   - Avoid unnecessary information

## COMPLIANCE STANDARDS
- FDA 21 CFR Part 50 (Protection of Human Subjects)
- ICH E6 (R2) Section 4.8 (Informed Consent)
- 45 CFR Part 46 (Common Rule)
- HIPAA Privacy Rule
- Local IRB requirements

## QUALITY CHECKS
- [ ] All 8 required elements of informed consent (21 CFR 50.25)
- [ ] Written at appropriate reading level
- [ ] No coercive or exculpatory language
- [ ] Clear explanation of voluntary participation
- [ ] Contact information for questions
- [ ] Signature blocks for participant and person obtaining consent

## CONTEXT
**Study:** ${projectTitle}
**Drug:** ${compoundName}
**Condition:** ${indication}
**Phase:** ${phase}
**Sponsor:** ${sponsor}

---

Generate a complete, patient-friendly Informed Consent Form in markdown format that meets all regulatory requirements while being easy for patients to understand.`
}

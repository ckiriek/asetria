/**
 * Entity Extraction Prompt
 * Extracts clinical trial entities from text using AI
 */

export interface EntityExtractionContext {
  text: string
  fileName: string
  projectTitle?: string
  projectIndication?: string
}

export function generateEntityExtractionPrompt(context: EntityExtractionContext): string {
  const { text, fileName, projectTitle, projectIndication } = context

  return `You are an expert medical information extraction system specialized in clinical trial documentation. Your task is to extract structured entities from the provided text.

## CONTEXT
- File: ${fileName}
${projectTitle ? `- Project: ${projectTitle}` : ''}
${projectIndication ? `- Indication: ${projectIndication}` : ''}

## TASK
Extract the following types of entities from the text:

### 1. COMPOUNDS / DRUGS
- Generic names
- Brand names
- Chemical names
- Dosage forms
- Strengths

### 2. INDICATIONS / CONDITIONS
- Primary indication
- Secondary indications
- Disease names
- Medical conditions

### 3. ENDPOINTS
- Primary endpoints
- Secondary endpoints
- Exploratory endpoints
- Outcome measures

### 4. DOSAGES
- Dose amounts
- Dosing regimens
- Frequency
- Duration

### 5. POPULATIONS
- Inclusion criteria
- Exclusion criteria
- Age ranges
- Demographics

### 6. STUDY DESIGN
- Study type (RCT, observational, etc.)
- Blinding
- Randomization
- Number of arms
- Duration

### 7. LOCATIONS
- Countries
- Sites
- Regions

### 8. DATES
- Start date
- End date
- Milestones

### 9. SPONSORS / ORGANIZATIONS
- Sponsor name
- CRO
- Investigators

### 10. REGULATORY
- Regulatory agencies
- Approvals
- Guidelines referenced

## OUTPUT FORMAT
Return a JSON array of entities. Each entity should have:
{
  "type": "compound|indication|endpoint|dosage|population|study_design|location|date|sponsor|regulatory",
  "value": "extracted value",
  "context": "surrounding text for context (optional)",
  "confidence": "high|medium|low"
}

## EXTRACTION RULES
1. Be precise - only extract explicitly mentioned entities
2. Normalize values (e.g., "Type 2 Diabetes Mellitus" → "Type 2 Diabetes")
3. Extract full context for complex entities
4. Mark confidence based on clarity of mention
5. Avoid duplicates - merge similar entities
6. Include units for dosages (mg, g, etc.)
7. Standardize date formats (YYYY-MM-DD)

## TEXT TO ANALYZE
\`\`\`
${text.substring(0, 10000)} ${text.length > 10000 ? '\n... (truncated)' : ''}
\`\`\`

## RESPONSE
Return ONLY a valid JSON array of extracted entities. No additional text or explanation.`
}

export interface ExtractedEntity {
  type: 'compound' | 'indication' | 'endpoint' | 'dosage' | 'population' | 'study_design' | 'location' | 'date' | 'sponsor' | 'regulatory'
  value: string
  context?: string
  confidence: 'high' | 'medium' | 'low'
}

export function validateExtractedEntities(entities: any[]): ExtractedEntity[] {
  const validTypes = [
    'compound', 'indication', 'endpoint', 'dosage', 'population',
    'study_design', 'location', 'date', 'sponsor', 'regulatory'
  ]
  
  const validConfidences = ['high', 'medium', 'low']

  return entities
    .filter(entity => {
      return (
        entity &&
        typeof entity === 'object' &&
        validTypes.includes(entity.type) &&
        typeof entity.value === 'string' &&
        entity.value.length > 0 &&
        validConfidences.includes(entity.confidence)
      )
    })
    .map(entity => ({
      type: entity.type,
      value: entity.value.trim(),
      context: entity.context?.trim(),
      confidence: entity.confidence
    }))
}

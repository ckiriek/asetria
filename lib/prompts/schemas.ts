/**
 * JSON Schemas for structured AI output
 * Based on ICH E6 guidelines and best practices
 */

export interface DocumentSection {
  title: string
  content: string
  level: number // 1 = H1, 2 = H2, etc.
  subsections?: DocumentSection[]
}

export interface DocumentMetadata {
  version: number
  wordCount: number
  generatedAt: string
  sections: string[]
  complianceStandards: string[]
}

export interface GeneratedDocument {
  title: string
  documentType: 'IB' | 'Protocol' | 'ICF' | 'Synopsis'
  sections: DocumentSection[]
  metadata: DocumentMetadata
  references?: string[]
}

/**
 * Schema for entity extraction from uploaded files
 */
export interface ExtractedEntity {
  type: 'compound' | 'indication' | 'dosage' | 'phase' | 'sponsor' | 'endpoint' | 'population' | 'other'
  value: string
  confidence: number // 0-1
  context?: string // surrounding text
  source?: string // file name or section
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[]
  summary: string
  metadata: {
    totalEntities: number
    byType: Record<string, number>
    extractedAt: string
  }
}

/**
 * Schema for clinical trial data from external APIs
 */
export interface ClinicalTrialData {
  nctId: string
  title: string
  phase: string
  status: string
  condition: string
  intervention: string
  sponsor: string
  startDate?: string
  completionDate?: string
  enrollment?: number
  primaryOutcome?: string
  secondaryOutcomes?: string[]
}

export interface PublicationData {
  pmid: string
  title: string
  authors: string[]
  journal: string
  publicationDate: string
  abstract: string
  doi?: string
}

export interface SafetyData {
  drugName: string
  adverseEvents: Array<{
    term: string
    frequency: number
    seriousness: string
  }>
  source: 'openFDA' | 'clinical_trial' | 'literature'
}

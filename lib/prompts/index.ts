/**
 * Clinical Document Generation Prompts
 * 
 * This module exports specialized prompts for generating regulatory-compliant
 * clinical trial documents using Azure OpenAI GPT-4.
 * 
 * Based on:
 * - ICH E6 (R2) Good Clinical Practice
 * - ICH E3 Structure and Content of Clinical Study Reports
 * - FDA 21 CFR Part 50 (Informed Consent)
 * - Best practices from clinical trial protocol authoring research
 */

export { generateIBPrompt, IB_EXAMPLES } from './ib-prompt'
export { generateProtocolPrompt } from './protocol-prompt'
export { generateICFPrompt } from './icf-prompt'
export { generateSynopsisPrompt } from './synopsis-prompt'

export type { 
  DocumentSection,
  DocumentMetadata,
  GeneratedDocument,
  ExtractedEntity,
  EntityExtractionResult,
  ClinicalTrialData,
  PublicationData,
  SafetyData
} from './schemas'

/**
 * Get the appropriate prompt generator for a document type
 */
export function getPromptGenerator(documentType: string) {
  switch (documentType.toUpperCase()) {
    case 'IB':
      return generateIBPrompt
    case 'PROTOCOL':
      return generateProtocolPrompt
    case 'ICF':
      return generateICFPrompt
    case 'SYNOPSIS':
      return generateSynopsisPrompt
    default:
      throw new Error(`Unknown document type: ${documentType}`)
  }
}

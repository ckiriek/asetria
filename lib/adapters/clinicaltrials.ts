/**
 * ClinicalTrials.gov Adapter
 * 
 * Fetches clinical trial data from ClinicalTrials.gov API v2
 * Critical for efficacy and safety data in regulatory documents
 * 
 * API: https://clinicaltrials.gov/api/v2/
 * Rate Limit: 50 requests/minute (no API key required)
 */

import type { Trial, ClinicalSummary } from '@/lib/types/regulatory-data'

const CLINICALTRIALS_BASE_URL = 'https://clinicaltrials.gov/api/v2'

interface CTStudy {
  protocolSection: {
    identificationModule: {
      nctId: string
      orgStudyIdInfo?: { id: string }
      briefTitle: string
      officialTitle?: string
    }
    statusModule: {
      statusVerifiedDate: string
      overallStatus: string
      startDateStruct?: { date: string }
      completionDateStruct?: { date: string }
    }
    sponsorCollaboratorsModule: {
      leadSponsor: { name: string }
      collaborators?: Array<{ name: string }>
    }
    descriptionModule?: {
      briefSummary?: string
      detailedDescription?: string
    }
    conditionsModule?: {
      conditions: string[]
    }
    designModule?: {
      studyType: string
      phases?: string[]
      designInfo?: {
        allocation?: string
        interventionModel?: string
        primaryPurpose?: string
        maskingInfo?: { masking?: string }
      }
      enrollmentInfo?: {
        count: number
        type: string
      }
    }
    armsInterventionsModule?: {
      armGroups?: Array<{
        label: string
        type: string
        description?: string
        interventionNames?: string[]
      }>
      interventions?: Array<{
        type: string
        name: string
        description?: string
      }>
    }
    outcomesModule?: {
      primaryOutcomes?: Array<{
        measure: string
        description?: string
        timeFrame?: string
      }>
      secondaryOutcomes?: Array<{
        measure: string
        description?: string
        timeFrame?: string
      }>
    }
    eligibilityModule?: {
      eligibilityCriteria?: string
      sex?: string
      minimumAge?: string
      maximumAge?: string
    }
    resultsSection?: {
      participantFlowModule?: {
        groups?: Array<{
          id: string
          title: string
          description?: string
        }>
      }
      baselineCharacteristicsModule?: {
        groups?: Array<{
          id: string
          title: string
        }>
      }
      outcomeMeasuresModule?: {
        outcomeMeasures?: Array<{
          type: string
          title: string
          description?: string
          timeFrame?: string
        }>
      }
    }
  }
}

interface CTSearchResponse {
  studies: CTStudy[]
  nextPageToken?: string
  totalCount: number
}

export class ClinicalTrialsAdapter {
  private baseUrl = CLINICALTRIALS_BASE_URL
  private lastRequestTime = 0
  private minRequestInterval = 1200 // 1.2 sec = 50 req/min

  /**
   * Rate limiting
   */
  private async rateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest))
    }
    this.lastRequestTime = Date.now()
  }

  /**
   * Search trials by drug name
   * 
   * @param drugName - e.g., "metformin"
   * @param maxResults - Maximum number of results (default: 20)
   * @returns Array of Trial objects
   */
  async searchTrialsByDrug(drugName: string, maxResults: number = 20): Promise<Trial[]> {
    try {
      await this.rateLimit()

      const url = `${this.baseUrl}/studies?query.term=${encodeURIComponent(drugName)}&pageSize=${maxResults}&format=json`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`ClinicalTrials.gov API error: ${response.status}`)
      }

      const data: CTSearchResponse = await response.json()

      if (!data.studies || data.studies.length === 0) {
        console.warn(`ClinicalTrials.gov: No trials found for ${drugName}`)
        return []
      }

      const trials = data.studies.map(study => this.parseStudyToTrial(study))

      console.log(`✅ ClinicalTrials.gov: Found ${trials.length} trials for ${drugName}`)
      return trials

    } catch (error) {
      console.error(`ClinicalTrials.gov searchTrialsByDrug error for ${drugName}:`, error)
      return []
    }
  }

  /**
   * Search trials by condition
   * 
   * @param condition - e.g., "Type 2 Diabetes"
   * @param maxResults - Maximum number of results (default: 20)
   * @returns Array of Trial objects
   */
  async searchTrialsByCondition(condition: string, maxResults: number = 20): Promise<Trial[]> {
    try {
      await this.rateLimit()

      const url = `${this.baseUrl}/studies?query.cond=${encodeURIComponent(condition)}&pageSize=${maxResults}&format=json`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`ClinicalTrials.gov API error: ${response.status}`)
      }

      const data: CTSearchResponse = await response.json()

      if (!data.studies || data.studies.length === 0) {
        return []
      }

      const trials = data.studies.map(study => this.parseStudyToTrial(study))

      console.log(`✅ ClinicalTrials.gov: Found ${trials.length} trials for ${condition}`)
      return trials

    } catch (error) {
      console.error(`ClinicalTrials.gov searchTrialsByCondition error for ${condition}:`, error)
      return []
    }
  }

  /**
   * Get trial by NCT ID
   * 
   * @param nctId - e.g., "NCT00000620"
   * @returns Trial object or null
   */
  async getTrialByNCTId(nctId: string): Promise<Trial | null> {
    try {
      await this.rateLimit()

      const url = `${this.baseUrl}/studies/${nctId}?format=json`

      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`ClinicalTrials.gov: Trial not found: ${nctId}`)
          return null
        }
        throw new Error(`ClinicalTrials.gov API error: ${response.status}`)
      }

      const data: CTSearchResponse = await response.json()

      if (!data.studies || data.studies.length === 0) {
        return null
      }

      const trial = this.parseStudyToTrial(data.studies[0])

      console.log(`✅ ClinicalTrials.gov: Fetched trial ${nctId}`)
      return trial

    } catch (error) {
      console.error(`ClinicalTrials.gov getTrialByNCTId error for ${nctId}:`, error)
      return null
    }
  }

  /**
   * Parse CT.gov study to our Trial format
   */
  private parseStudyToTrial(study: CTStudy): Trial {
    const protocol = study.protocolSection
    const id = protocol.identificationModule
    const status = protocol.statusModule
    const sponsor = protocol.sponsorCollaboratorsModule
    const design = protocol.designModule
    const arms = protocol.armsInterventionsModule
    const outcomes = protocol.outcomesModule
    const eligibility = protocol.eligibilityModule

    // Parse phases
    const phases = design?.phases || []
    const phaseMap: Record<string, string> = {
      'PHASE1': 'Phase 1',
      'PHASE2': 'Phase 2',
      'PHASE3': 'Phase 3',
      'PHASE4': 'Phase 4',
    }
    const phase = phases.map(p => phaseMap[p] || p).join(', ')

    // Parse trial design
    const trialDesign = {
      study_type: design?.studyType || 'Unknown',
      phase,
      allocation: design?.designInfo?.allocation,
      intervention_model: design?.designInfo?.interventionModel,
      primary_purpose: design?.designInfo?.primaryPurpose,
      masking: design?.designInfo?.maskingInfo?.masking,
      enrollment_n: design?.enrollmentInfo?.count,
    }

    // Parse arms
    const trialArms = arms?.armGroups?.map(arm => ({
      arm_name: arm.label,
      arm_type: arm.type,
      description: arm.description,
      n: undefined, // Not available in basic API response
    })) || []

    // Parse outcomes
    const primaryOutcomes = outcomes?.primaryOutcomes?.map(outcome => ({
      outcome_type: 'primary',
      measure: outcome.measure,
      description: outcome.description,
      time_frame: outcome.timeFrame,
      result: undefined,
      unit: undefined,
      n: undefined,
      mean: undefined,
      sd: undefined,
      p_value: undefined,
    })) || []

    const secondaryOutcomes = outcomes?.secondaryOutcomes?.map(outcome => ({
      outcome_type: 'secondary',
      measure: outcome.measure,
      description: outcome.description,
      time_frame: outcome.timeFrame,
      result: undefined,
      unit: undefined,
      n: undefined,
      mean: undefined,
      sd: undefined,
      p_value: undefined,
    })) || []

    const trial: Trial = {
      id: '', // Will be set by database
      inchikey: '', // Will be linked later
      registry_id: id.nctId,
      registry: 'ClinicalTrials.gov',
      title: id.officialTitle || id.briefTitle,
      phase,
      status: status.overallStatus,
      start_date: status.startDateStruct?.date,
      completion_date: status.completionDateStruct?.date,
      sponsor: sponsor.leadSponsor.name,
      collaborators: sponsor.collaborators?.map(c => c.name),
      indication: protocol.conditionsModule?.conditions.join(', '),
      trial_design: trialDesign,
      arms: trialArms,
      outcomes: [...primaryOutcomes, ...secondaryOutcomes],
      inclusion_criteria: eligibility?.eligibilityCriteria,
      exclusion_criteria: undefined,
      source: 'ClinicalTrials.gov',
      source_url: `https://clinicaltrials.gov/study/${id.nctId}`,
      retrieved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return trial
  }

  /**
   * Build clinical summary from trials
   * 
   * @param trials - Array of Trial objects
   * @returns ClinicalSummary object
   */
  static buildClinicalSummary(trials: Trial[]): ClinicalSummary {
    const totalSubjects = trials.reduce((sum, trial) => {
      return sum + (trial.trial_design?.enrollment_n || 0)
    }, 0)

    const phases = new Set<string>()
    trials.forEach(trial => {
      if (trial.phase) phases.add(trial.phase)
    })

    const indications = new Set<string>()
    trials.forEach(trial => {
      if (trial.indication) indications.add(trial.indication)
    })

    return {
      id: '',
      inchikey: '',
      total_subjects: totalSubjects,
      total_studies: trials.length,
      phases_studied: Array.from(phases),
      indications_studied: Array.from(indications),
      pharmacokinetics: undefined,
      efficacy_data: undefined,
      safety_data: undefined,
      special_populations: undefined,
      source: 'ClinicalTrials.gov',
      source_url: 'https://clinicaltrials.gov',
      retrieved_at: new Date().toISOString(),
      confidence: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

// Export singleton instance
export const clinicalTrialsAdapter = new ClinicalTrialsAdapter()

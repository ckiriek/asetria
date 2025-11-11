/**
 * Regulatory Data Layer Types
 * Data structures for normalized regulatory data from external sources
 */

// ============================================================================
// PROVENANCE
// ============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface Provenance {
  source: string // 'openFDA', 'PubChem', 'ClinicalTrials.gov', etc.
  source_id?: string // External ID
  source_url?: string
  retrieved_at: string // ISO timestamp
  confidence: ConfidenceLevel
}

// ============================================================================
// COMPOUNDS
// ============================================================================

export interface Compound {
  inchikey: string // Primary key - canonical identifier
  name: string
  synonyms: string[]
  mechanism_of_action?: string
  atc_codes: string[] // Anatomical Therapeutic Chemical codes
  molecular_weight?: number
  molecular_formula?: string
  smiles?: string // Simplified molecular-input line-entry system
  chemical_structure_url?: string
  
  // Provenance
  source: string
  source_id?: string
  source_url?: string
  retrieved_at: string
  confidence: ConfidenceLevel
  
  created_at: string
  updated_at: string
}

// ============================================================================
// PRODUCTS
// ============================================================================

export type Region = 'US' | 'EU' | 'UK' | 'JP' | 'CA'
export type ApprovalStatus = 'approved' | 'withdrawn' | 'suspended'

export interface Product {
  id: string
  inchikey: string
  
  // Product identification
  brand_name: string
  generic_name?: string
  dosage_form?: string // 'tablet', 'capsule', 'injection'
  strength?: string // '500mg', '1000mg'
  route?: string // 'oral', 'IV', 'subcutaneous'
  
  // Regulatory information
  region: Region
  application_number?: string // NDA/ANDA/BLA (US) or EPAR (EU)
  approval_date?: string
  approval_status: ApprovalStatus
  
  // RLD information
  is_rld: boolean
  te_code?: string // Therapeutic Equivalence code
  
  // Manufacturer
  manufacturer?: string
  
  // Provenance
  source: string
  source_url?: string
  retrieved_at: string
  
  created_at: string
  updated_at: string
}

// ============================================================================
// LABELS
// ============================================================================

export type LabelType = 'FDA_SPL' | 'EMA_SmPC' | 'MHRA_SmPC'

export interface Label {
  id: string
  product_id: string
  
  label_type: LabelType
  effective_date?: string
  version?: string
  
  sections: LabelSections
  full_text?: string
  
  // Provenance
  source: string
  source_url?: string
  retrieved_at: string
  confidence: ConfidenceLevel
  
  created_at: string
  updated_at: string
}

export interface LabelSections {
  indications_and_usage?: string
  dosage_and_administration?: string
  contraindications?: string
  warnings_and_precautions?: string
  adverse_reactions_label?: string
  drug_interactions?: string
  use_in_specific_populations?: string
  clinical_pharmacology?: ClinicalPharmacologySection
  nonclinical_toxicology?: string
  clinical_studies?: string
  how_supplied?: string
  patient_counseling?: string
  [key: string]: any // Allow additional sections
}

export interface ClinicalPharmacologySection {
  mechanism_of_action?: string
  pharmacokinetics?: PharmacokineticsSummary
  pharmacodynamics?: string
}

// ============================================================================
// NONCLINICAL DATA
// ============================================================================

export interface NonclinicalSummary {
  id: string
  inchikey: string
  
  pharmacology?: any // JSONB - flexible structure
  pharmacokinetics?: any
  toxicology?: any
  genotoxicity?: any
  carcinogenicity?: any
  reproductive_toxicity?: any
  
  // Provenance
  source: string
  source_document?: string
  source_url?: string
  retrieved_at: string
  confidence: ConfidenceLevel
  
  created_at: string
  updated_at: string
}

// ============================================================================
// CLINICAL DATA
// ============================================================================

export interface ClinicalSummary {
  id: string
  inchikey: string
  
  pharmacokinetics?: PharmacokineticsSummary
  pharmacodynamics?: PharmacodynamicsSummary
  efficacy?: EfficacyData[]
  safety?: SafetyData[]
  drug_interactions?: DrugInteraction[]
  special_populations?: SpecialPopulations
  
  // Provenance
  source: string
  source_document?: string
  source_url?: string
  retrieved_at: string
  confidence: ConfidenceLevel
  
  created_at: string
  updated_at: string
}

export interface PharmacokineticsSummary {
  bioavailability?: number // %
  tmax?: number // hours
  t_half?: number // hours
  cmax?: number // ng/mL
  auc?: number // ng·h/mL
  vss?: number // L/kg
  clearance?: number // L/h
  protein_binding?: number // %
  metabolism?: string
  excretion?: string
}

export interface PharmacodynamicsSummary {
  dose_response?: DoseResponse
  emax?: number
  ed50?: number
  mechanism?: string
}

export interface DoseResponse {
  endpoint: string
  model: string // 'Emax', 'linear', 'sigmoid'
  parameters: Record<string, number>
  data_points: Array<{ dose: number; response: number }>
}

export interface EfficacyData {
  endpoint: string
  delta: number
  unit?: string
  ci_95_lower?: number
  ci_95_upper?: number
  p_value?: number
  study_id?: string
}

export interface SafetyData {
  ae_type: string
  incidence: number // %
  severity?: string
  study_id?: string
}

export interface DrugInteraction {
  drug: string
  effect: string
  mechanism?: string
  clinical_significance?: string
}

export interface SpecialPopulations {
  elderly?: string
  pediatric?: string
  renal_impairment?: string
  hepatic_impairment?: string
  pregnancy?: string
  lactation?: string
}

// ============================================================================
// CLINICAL TRIALS
// ============================================================================

export interface Trial {
  nct_id: string // Primary key
  inchikey: string
  
  title?: string
  phase?: string
  status?: string
  enrollment?: number
  start_date?: string
  completion_date?: string
  
  design?: TrialDesign
  arms?: TrialArm[]
  outcomes_primary?: Outcome[]
  outcomes_secondary?: Outcome[]
  results?: TrialResults
  
  // Provenance
  source: string
  source_url?: string
  retrieved_at: string
  
  created_at: string
  updated_at: string
}

export interface TrialDesign {
  allocation?: string
  intervention_model?: string
  masking?: string
  primary_purpose?: string
}

export interface TrialArm {
  arm_label: string
  arm_type: string
  description?: string
  intervention?: string
}

export interface Outcome {
  measure: string
  time_frame?: string
  description?: string
}

export interface TrialResults {
  participant_flow?: any
  baseline?: any
  outcome_measures?: any
  adverse_events?: any
}

// ============================================================================
// ADVERSE EVENTS
// ============================================================================

export type Severity = 'mild' | 'moderate' | 'severe' | 'life-threatening' | 'fatal'

export interface AdverseEvent {
  id: string
  inchikey: string
  
  // Study context
  study_id?: string
  population_description?: string
  arm?: string
  n?: number
  
  // MedDRA coding
  soc?: string // System Organ Class
  soc_code?: string
  pt: string // Preferred Term (required)
  pt_code?: string
  
  // Event data
  incidence_n?: number
  incidence_pct?: number
  severity?: Severity
  serious?: boolean
  related?: boolean
  
  // Statistical comparison
  control_arm?: string
  control_n?: number
  control_incidence_pct?: number
  risk_ratio?: number
  ci_95_lower?: number
  ci_95_upper?: number
  p_value?: number
  
  // Provenance
  source: string
  source_url?: string
  retrieved_at: string
  confidence: ConfidenceLevel
  
  created_at: string
  updated_at: string
}

// ============================================================================
// LITERATURE
// ============================================================================

export interface Literature {
  pmid: string // Primary key
  inchikey: string
  
  title: string
  authors: string[]
  journal?: string
  publication_date?: string
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  
  abstract?: string
  keywords?: string[]
  mesh_terms?: string[]
  
  relevance_score?: number // 0-1
  
  // Provenance
  source: string
  source_url?: string
  retrieved_at: string
  
  created_at: string
  updated_at: string
}

// ============================================================================
// INGESTION LOGS
// ============================================================================

export type OperationType = 'enrich' | 'update' | 'resolve'
export type IngestionStatus = 'started' | 'completed' | 'failed' | 'partial'

export interface IngestionLog {
  id: string
  
  operation_type: OperationType
  inchikey?: string
  source_adapter: string // 'openFDA', 'PubChem', etc.
  
  status: IngestionStatus
  error_code?: string
  error_message?: string
  
  records_fetched?: number
  records_inserted?: number
  records_updated?: number
  duration_ms?: number
  
  triggered_by?: string // 'user', 'scheduler', 'api'
  project_id?: string
  
  created_at: string
}

// ============================================================================
// COMPOUND DATA SNAPSHOT (for Writer Agent)
// ============================================================================

export interface CompoundDataSnapshot {
  compound: Compound
  products: Product[]
  labels: Label[]
  nonclinical_summary?: NonclinicalSummary
  clinical_summary?: ClinicalSummary
  trials: Trial[]
  adverse_events: AdverseEvent[]
  literature: Literature[]
  
  // Metadata
  snapshot_timestamp: string
  coverage: {
    compound_identity: number // 0-1
    labels: number
    nonclinical: number
    clinical: number
    literature: number
  }
  
  provenance: {
    sources_used: string[]
    total_records: number
  }
}

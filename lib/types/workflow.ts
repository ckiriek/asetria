/**
 * Workflow Orchestrator Types
 * 
 * Type definitions for the pipeline orchestration system.
 * Provides state management, audit trail, and retry logic for document generation workflows.
 * 
 * @module lib/types/workflow
 */

// ============================================================================
// WORKFLOW STATES
// ============================================================================

export type WorkflowState =
  | 'created'      // Initial state
  | 'enriching'    // RegData agent working
  | 'enriched'     // Data ready
  | 'composing'    // Composer generating structure
  | 'composed'     // Structure ready
  | 'writing'      // Writer generating content
  | 'written'      // Content ready
  | 'validating'   // Validator checking
  | 'validated'    // Validation passed
  | 'assembling'   // Assembler formatting
  | 'assembled'    // Document ready
  | 'exporting'    // Export to PDF/DOCX
  | 'completed'    // Final state
  | 'failed'       // Error state
  | 'paused'       // User paused

export type StepStatus =
  | 'pending'      // Not started
  | 'running'      // Currently executing
  | 'completed'    // Successfully finished
  | 'failed'       // Error occurred
  | 'skipped'      // Skipped (optional step)

export type ErrorType =
  | 'transient'    // Network errors, retry automatically
  | 'validation'   // Data errors, require user fix
  | 'fatal'        // Critical errors, workflow failed

export type EventType =
  | 'started'           // Workflow started
  | 'step_completed'    // Step finished
  | 'state_changed'     // State transition
  | 'paused'            // Workflow paused
  | 'resumed'           // Workflow resumed
  | 'failed'            // Workflow failed
  | 'completed'         // Workflow completed
  | 'retry'             // Retry attempt

export type ActorType =
  | 'user'      // Human user
  | 'system'    // System/automated
  | 'agent'     // AI agent

export type DocumentType =
  | 'ib'        // Investigator Brochure
  | 'protocol'  // Clinical Study Protocol
  | 'icf'       // Informed Consent Form
  | 'csr'       // Clinical Study Report
  | 'sap'       // Statistical Analysis Plan

export type AgentName =
  | 'regdata'              // Regulatory Data Agent
  | 'composer'             // Composer Agent
  | 'writer'               // Writer Agent
  | 'validator'            // Validator Agent
  | 'assembler'            // Assembler Agent
  | 'export'               // Export Agent
  | 'composer_protocol'    // Protocol Composer
  | 'writer_protocol'      // Protocol Writer
  | 'validator_protocol'   // Protocol Validator
  | 'assembler_protocol'   // Protocol Assembler
  | 'composer_icf'         // ICF Composer
  | 'writer_icf'           // ICF Writer
  | 'validator_icf'        // ICF Validator
  | 'assembler_icf'        // ICF Assembler

// ============================================================================
// WORKFLOW EXECUTION
// ============================================================================

export interface WorkflowExecution {
  id: string
  
  // Project context
  project_id: string
  document_type: DocumentType
  document_id?: string
  
  // Workflow definition
  workflow_name: string
  workflow_version: string
  
  // Current state
  current_state: WorkflowState
  current_step?: string
  percent_complete: number
  
  // Timing
  started_at: string
  completed_at?: string
  paused_at?: string
  resumed_at?: string
  
  // Error handling
  error_code?: string
  error_message?: string
  retry_count: number
  max_retries: number
  
  // Checkpoint for retry
  checkpoint_data?: Record<string, any>
  
  // Metadata
  triggered_by?: string
  metadata?: Record<string, any>
  
  // Audit
  created_at: string
  updated_at: string
}

export interface CreateWorkflowExecutionInput {
  project_id: string
  document_type: DocumentType
  document_id?: string
  workflow_name: string
  triggered_by?: string
  metadata?: Record<string, any>
}

export interface UpdateWorkflowExecutionInput {
  current_state?: WorkflowState
  current_step?: string
  percent_complete?: number
  completed_at?: string
  paused_at?: string
  resumed_at?: string
  error_code?: string
  error_message?: string
  retry_count?: number
  checkpoint_data?: Record<string, any>
  metadata?: Record<string, any>
}

// ============================================================================
// WORKFLOW STEP
// ============================================================================

export interface WorkflowStep {
  id: string
  
  // Parent execution
  execution_id: string
  
  // Step definition
  step_name: string
  step_order: number
  agent_name: AgentName
  
  // Status
  status: StepStatus
  
  // Timing
  started_at?: string
  completed_at?: string
  duration_ms?: number
  
  // Input/Output
  input_data?: Record<string, any>
  output_data?: Record<string, any>
  
  // Error handling
  error_type?: ErrorType
  error_message?: string
  error_stack?: string
  retry_attempt: number
  
  // Metadata
  metadata?: Record<string, any>
  
  // Audit
  created_at: string
  updated_at: string
}

export interface CreateWorkflowStepInput {
  execution_id: string
  step_name: string
  step_order: number
  agent_name: AgentName
  status: StepStatus
  input_data?: Record<string, any>
  metadata?: Record<string, any>
}

export interface UpdateWorkflowStepInput {
  status?: StepStatus
  started_at?: string
  completed_at?: string
  duration_ms?: number
  output_data?: Record<string, any>
  error_type?: ErrorType
  error_message?: string
  error_stack?: string
  retry_attempt?: number
  metadata?: Record<string, any>
}

// ============================================================================
// WORKFLOW EVENT
// ============================================================================

export interface WorkflowEvent {
  id: string
  
  // Parent execution
  execution_id: string
  
  // Event details
  event_type: EventType
  event_data?: Record<string, any>
  
  // Actor
  actor_id?: string
  actor_type: ActorType
  
  // Context
  step_id?: string
  previous_state?: WorkflowState
  new_state?: WorkflowState
  
  // Metadata
  metadata?: Record<string, any>
  
  // Audit
  created_at: string
}

export interface CreateWorkflowEventInput {
  execution_id: string
  event_type: EventType
  event_data?: Record<string, any>
  actor_id?: string
  actor_type?: ActorType
  step_id?: string
  previous_state?: WorkflowState
  new_state?: WorkflowState
  metadata?: Record<string, any>
}

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

export interface WorkflowStepDefinition {
  name: string
  agent: AgentName
  description: string
  parallel: boolean
  required: boolean
  timeout_minutes: number
  retry_on_failure: boolean
}

export interface WorkflowDefinition {
  id: string
  
  // Definition
  name: string
  version: string
  description?: string
  
  // Configuration
  document_type: DocumentType
  steps: WorkflowStepDefinition[]
  
  // Status
  is_active: boolean
  is_default: boolean
  
  // Metadata
  created_by?: string
  metadata?: Record<string, any>
  
  // Audit
  created_at: string
  updated_at: string
}

export interface CreateWorkflowDefinitionInput {
  name: string
  version?: string
  description?: string
  document_type: DocumentType
  steps: WorkflowStepDefinition[]
  is_active?: boolean
  is_default?: boolean
  created_by?: string
  metadata?: Record<string, any>
}

// ============================================================================
// WORKFLOW STATE QUERY
// ============================================================================

export interface WorkflowStateQuery {
  execution_id: string
  current_state: WorkflowState
  current_step?: string
  percent_complete: number
  steps_completed: number
  steps_total: number
  error_message?: string
}

// ============================================================================
// WORKFLOW RESULT
// ============================================================================

export interface WorkflowResult<T = any> {
  success: boolean
  data?: T
  error?: {
    type: ErrorType
    message: string
    code?: string
    stack?: string
  }
}

// ============================================================================
// AGENT RESULT
// ============================================================================

export interface AgentResult<T = any> {
  success: boolean
  data?: T
  error?: {
    type: ErrorType
    message: string
    code?: string
  }
  metadata?: {
    duration_ms?: number
    model_used?: string
    tokens_consumed?: number
    [key: string]: any
  }
}

// ============================================================================
// WORKFLOW ENGINE CONFIG
// ============================================================================

export interface WorkflowEngineConfig {
  max_retries: number
  retry_delay_ms: number
  retry_backoff_multiplier: number
  timeout_minutes: number
  enable_checkpoints: boolean
  enable_events: boolean
}

export const DEFAULT_WORKFLOW_ENGINE_CONFIG: WorkflowEngineConfig = {
  max_retries: 3,
  retry_delay_ms: 1000,
  retry_backoff_multiplier: 2,
  timeout_minutes: 60,
  enable_checkpoints: true,
  enable_events: true,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get workflow state display name
 */
export function getWorkflowStateDisplay(state: WorkflowState): string {
  const displays: Record<WorkflowState, string> = {
    created: 'Created',
    enriching: 'Enriching Data',
    enriched: 'Data Enriched',
    composing: 'Composing Structure',
    composed: 'Structure Ready',
    writing: 'Writing Content',
    written: 'Content Written',
    validating: 'Validating',
    validated: 'Validated',
    assembling: 'Assembling Document',
    assembled: 'Document Assembled',
    exporting: 'Exporting',
    completed: 'Completed',
    failed: 'Failed',
    paused: 'Paused',
  }
  return displays[state]
}

/**
 * Get step status display name
 */
export function getStepStatusDisplay(status: StepStatus): string {
  const displays: Record<StepStatus, string> = {
    pending: 'Pending',
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
    skipped: 'Skipped',
  }
  return displays[status]
}

/**
 * Calculate percent complete based on steps
 */
export function calculatePercentComplete(
  steps: WorkflowStep[]
): number {
  if (steps.length === 0) return 0
  
  const completed = steps.filter(s => s.status === 'completed').length
  return Math.round((completed / steps.length) * 100)
}

/**
 * Check if workflow is in terminal state
 */
export function isTerminalState(state: WorkflowState): boolean {
  return state === 'completed' || state === 'failed'
}

/**
 * Check if workflow can be resumed
 */
export function canResumeWorkflow(state: WorkflowState): boolean {
  return state === 'paused' || state === 'failed'
}

/**
 * Get next state after step completion
 */
export function getNextState(
  currentState: WorkflowState,
  stepName: string
): WorkflowState {
  const stateTransitions: Record<string, WorkflowState> = {
    enrich: 'enriched',
    compose: 'composed',
    write: 'written',
    validate: 'validated',
    assemble: 'assembled',
    export: 'completed',
  }
  
  return stateTransitions[stepName] || currentState
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
  return `${(ms / 3600000).toFixed(1)}h`
}

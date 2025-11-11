/**
 * Workflow Engine
 * 
 * Core orchestration logic for managing document generation workflows.
 * Handles state transitions, step execution, error handling, and retry logic.
 * 
 * @module lib/workflow/engine
 */

import { createClient } from '@/lib/supabase/server'
import type {
  WorkflowExecution,
  WorkflowStep,
  WorkflowEvent,
  WorkflowDefinition,
  WorkflowState,
  StepStatus,
  AgentResult,
  WorkflowEngineConfig,
  CreateWorkflowExecutionInput,
  UpdateWorkflowExecutionInput,
  CreateWorkflowStepInput,
  UpdateWorkflowStepInput,
  CreateWorkflowEventInput,
} from '@/lib/types/workflow'
import { DEFAULT_WORKFLOW_ENGINE_CONFIG } from '@/lib/types/workflow'

export class WorkflowEngine {
  private config: WorkflowEngineConfig

  constructor(config?: Partial<WorkflowEngineConfig>) {
    this.config = { ...DEFAULT_WORKFLOW_ENGINE_CONFIG, ...config }
  }

  // ==========================================================================
  // WORKFLOW EXECUTION MANAGEMENT
  // ==========================================================================

  /**
   * Create a new workflow execution
   */
  async createExecution(
    input: CreateWorkflowExecutionInput
  ): Promise<WorkflowExecution> {
    const supabase = await createClient()

    // Get workflow definition
    const { data: definition, error: defError } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('name', input.workflow_name)
      .eq('is_active', true)
      .single()

    if (defError || !definition) {
      throw new Error(`Workflow definition not found: ${input.workflow_name}`)
    }

    // Create execution
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .insert({
        project_id: input.project_id,
        document_type: input.document_type,
        document_id: input.document_id,
        workflow_name: input.workflow_name,
        workflow_version: definition.version,
        current_state: 'created',
        percent_complete: 0,
        triggered_by: input.triggered_by,
        metadata: input.metadata,
      })
      .select()
      .single()

    if (execError || !execution) {
      throw new Error(`Failed to create workflow execution: ${execError?.message}`)
    }

    // Create initial steps
    await this.createSteps(execution.id, definition)

    // Record event
    await this.recordEvent({
      execution_id: execution.id,
      event_type: 'started',
      actor_id: input.triggered_by,
      actor_type: 'user',
      new_state: 'created',
    })

    return execution as WorkflowExecution
  }

  /**
   * Get workflow execution by ID
   */
  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single()

    if (error) {
      console.error('Failed to get workflow execution:', error)
      return null
    }

    return data as WorkflowExecution
  }

  /**
   * Update workflow execution
   */
  async updateExecution(
    executionId: string,
    input: UpdateWorkflowExecutionInput
  ): Promise<WorkflowExecution> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workflow_executions')
      .update(input)
      .eq('id', executionId)
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to update workflow execution: ${error?.message}`)
    }

    return data as WorkflowExecution
  }

  /**
   * Transition workflow to new state
   */
  async transitionState(
    executionId: string,
    newState: WorkflowState,
    metadata?: Record<string, any>
  ): Promise<WorkflowExecution> {
    const execution = await this.getExecution(executionId)
    if (!execution) {
      throw new Error(`Workflow execution not found: ${executionId}`)
    }

    const previousState = execution.current_state

    // Update execution
    const updated = await this.updateExecution(executionId, {
      current_state: newState,
      ...(newState === 'completed' && { completed_at: new Date().toISOString() }),
      ...(metadata && { metadata: { ...execution.metadata, ...metadata } }),
    })

    // Record event
    await this.recordEvent({
      execution_id: executionId,
      event_type: 'state_changed',
      actor_type: 'system',
      previous_state: previousState,
      new_state: newState,
      metadata,
    })

    return updated
  }

  // ==========================================================================
  // WORKFLOW STEP MANAGEMENT
  // ==========================================================================

  /**
   * Create workflow steps from definition
   */
  private async createSteps(
    executionId: string,
    definition: WorkflowDefinition
  ): Promise<void> {
    const supabase = await createClient()

    const steps = definition.steps.map((stepDef, index) => ({
      execution_id: executionId,
      step_name: stepDef.name,
      step_order: index + 1,
      agent_name: stepDef.agent,
      status: 'pending' as StepStatus,
      metadata: {
        description: stepDef.description,
        timeout_minutes: stepDef.timeout_minutes,
        retry_on_failure: stepDef.retry_on_failure,
      },
    }))

    const { error } = await supabase
      .from('workflow_steps')
      .insert(steps)

    if (error) {
      throw new Error(`Failed to create workflow steps: ${error.message}`)
    }
  }

  /**
   * Get workflow steps
   */
  async getSteps(executionId: string): Promise<WorkflowStep[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('execution_id', executionId)
      .order('step_order', { ascending: true })

    if (error) {
      console.error('Failed to get workflow steps:', error)
      return []
    }

    return data as WorkflowStep[]
  }

  /**
   * Get next pending step
   */
  async getNextStep(executionId: string): Promise<WorkflowStep | null> {
    const steps = await this.getSteps(executionId)
    return steps.find(s => s.status === 'pending') || null
  }

  /**
   * Update workflow step
   */
  async updateStep(
    stepId: string,
    input: UpdateWorkflowStepInput
  ): Promise<WorkflowStep> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workflow_steps')
      .update(input)
      .eq('id', stepId)
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to update workflow step: ${error?.message}`)
    }

    return data as WorkflowStep
  }

  /**
   * Start a workflow step
   */
  async startStep(stepId: string): Promise<WorkflowStep> {
    const step = await this.updateStep(stepId, {
      status: 'running',
      started_at: new Date().toISOString(),
    })

    // Record event
    await this.recordEvent({
      execution_id: step.execution_id,
      event_type: 'step_completed',
      actor_type: 'system',
      step_id: stepId,
      metadata: { step_name: step.step_name, status: 'running' },
    })

    return step
  }

  /**
   * Complete a workflow step
   */
  async completeStep(
    stepId: string,
    result: AgentResult
  ): Promise<WorkflowStep> {
    const supabase = await createClient()

    // Get step
    const { data: step } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('id', stepId)
      .single()

    if (!step) {
      throw new Error(`Workflow step not found: ${stepId}`)
    }

    const completedAt = new Date().toISOString()
    const durationMs = step.started_at
      ? new Date(completedAt).getTime() - new Date(step.started_at).getTime()
      : undefined

    // Update step
    const updated = await this.updateStep(stepId, {
      status: result.success ? 'completed' : 'failed',
      completed_at: completedAt,
      duration_ms: durationMs,
      output_data: result.data,
      error_type: result.error?.type,
      error_message: result.error?.message,
      metadata: {
        ...step.metadata,
        ...result.metadata,
      },
    })

    // Record event
    await this.recordEvent({
      execution_id: step.execution_id,
      event_type: 'step_completed',
      actor_type: 'agent',
      step_id: stepId,
      metadata: {
        step_name: step.step_name,
        status: updated.status,
        duration_ms: durationMs,
      },
    })

    // Update execution percent complete
    const allSteps = await this.getSteps(step.execution_id)
    const completedCount = allSteps.filter(s => s.status === 'completed').length
    const percentComplete = Math.round((completedCount / allSteps.length) * 100)

    await this.updateExecution(step.execution_id, {
      percent_complete: percentComplete,
      current_step: step.step_name,
    })

    return updated
  }

  // ==========================================================================
  // WORKFLOW EVENT MANAGEMENT
  // ==========================================================================

  /**
   * Record a workflow event
   */
  async recordEvent(input: CreateWorkflowEventInput): Promise<WorkflowEvent> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workflow_events')
      .insert(input)
      .select()
      .single()

    if (error || !data) {
      console.error('Failed to record workflow event:', error)
      throw new Error(`Failed to record workflow event: ${error?.message}`)
    }

    return data as WorkflowEvent
  }

  /**
   * Get workflow events
   */
  async getEvents(executionId: string): Promise<WorkflowEvent[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workflow_events')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to get workflow events:', error)
      return []
    }

    return data as WorkflowEvent[]
  }

  // ==========================================================================
  // WORKFLOW EXECUTION CONTROL
  // ==========================================================================

  /**
   * Pause a workflow execution
   */
  async pauseExecution(
    executionId: string,
    actorId?: string
  ): Promise<WorkflowExecution> {
    const execution = await this.updateExecution(executionId, {
      current_state: 'paused',
      paused_at: new Date().toISOString(),
    })

    await this.recordEvent({
      execution_id: executionId,
      event_type: 'paused',
      actor_id: actorId,
      actor_type: actorId ? 'user' : 'system',
      previous_state: execution.current_state,
      new_state: 'paused',
    })

    return execution
  }

  /**
   * Resume a paused workflow execution
   */
  async resumeExecution(
    executionId: string,
    actorId?: string
  ): Promise<WorkflowExecution> {
    const execution = await this.getExecution(executionId)
    if (!execution) {
      throw new Error(`Workflow execution not found: ${executionId}`)
    }

    if (execution.current_state !== 'paused') {
      throw new Error(`Cannot resume workflow in state: ${execution.current_state}`)
    }

    const updated = await this.updateExecution(executionId, {
      current_state: 'created', // Reset to created to continue
      resumed_at: new Date().toISOString(),
    })

    await this.recordEvent({
      execution_id: executionId,
      event_type: 'resumed',
      actor_id: actorId,
      actor_type: actorId ? 'user' : 'system',
      previous_state: 'paused',
      new_state: 'created',
    })

    return updated
  }

  /**
   * Fail a workflow execution
   */
  async failExecution(
    executionId: string,
    errorCode: string,
    errorMessage: string
  ): Promise<WorkflowExecution> {
    const execution = await this.updateExecution(executionId, {
      current_state: 'failed',
      error_code: errorCode,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })

    await this.recordEvent({
      execution_id: executionId,
      event_type: 'failed',
      actor_type: 'system',
      previous_state: execution.current_state,
      new_state: 'failed',
      metadata: { error_code: errorCode, error_message: errorMessage },
    })

    return execution
  }

  /**
   * Complete a workflow execution
   */
  async completeExecution(executionId: string): Promise<WorkflowExecution> {
    const execution = await this.updateExecution(executionId, {
      current_state: 'completed',
      percent_complete: 100,
      completed_at: new Date().toISOString(),
    })

    await this.recordEvent({
      execution_id: executionId,
      event_type: 'completed',
      actor_type: 'system',
      previous_state: execution.current_state,
      new_state: 'completed',
    })

    return execution
  }

  // ==========================================================================
  // RETRY LOGIC
  // ==========================================================================

  /**
   * Check if step should be retried
   */
  shouldRetryStep(step: WorkflowStep): boolean {
    if (step.status !== 'failed') return false
    if (step.error_type === 'fatal') return false
    if (step.error_type === 'validation') return false
    
    const retryOnFailure = step.metadata?.retry_on_failure ?? true
    if (!retryOnFailure) return false

    return step.retry_attempt < this.config.max_retries
  }

  /**
   * Retry a failed step
   */
  async retryStep(stepId: string): Promise<WorkflowStep> {
    const supabase = await createClient()

    const { data: step } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('id', stepId)
      .single()

    if (!step) {
      throw new Error(`Workflow step not found: ${stepId}`)
    }

    if (!this.shouldRetryStep(step as WorkflowStep)) {
      throw new Error(`Step cannot be retried: ${stepId}`)
    }

    // Calculate retry delay with exponential backoff
    const retryDelay =
      this.config.retry_delay_ms *
      Math.pow(this.config.retry_backoff_multiplier, step.retry_attempt)

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, retryDelay))

    // Reset step to pending
    const updated = await this.updateStep(stepId, {
      status: 'pending',
      retry_attempt: step.retry_attempt + 1,
      error_type: undefined,
      error_message: undefined,
      error_stack: undefined,
    })

    // Record retry event
    await this.recordEvent({
      execution_id: step.execution_id,
      event_type: 'retry',
      actor_type: 'system',
      step_id: stepId,
      metadata: {
        step_name: step.step_name,
        retry_attempt: updated.retry_attempt,
        retry_delay_ms: retryDelay,
      },
    })

    return updated
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine()

/**
 * Workflow API Route
 * 
 * Endpoints for managing workflow executions.
 * 
 * POST /api/v1/workflow - Create new workflow execution
 * GET /api/v1/workflow?execution_id=xxx - Get workflow status
 * 
 * @module app/api/v1/workflow/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { workflowEngine } from '@/lib/workflow/engine'
import type { CreateWorkflowExecutionInput } from '@/lib/types/workflow'

/**
 * POST /api/v1/workflow
 * 
 * Create a new workflow execution
 * 
 * Request body:
 * {
 *   project_id: string
 *   document_type: 'ib' | 'protocol' | 'icf' | 'csr' | 'sap'
 *   workflow_name?: string (defaults to '{document_type}-generation')
 *   document_id?: string
 *   triggered_by?: string
 *   metadata?: Record<string, any>
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: WorkflowExecution
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.project_id) {
      return NextResponse.json(
        { success: false, error: 'project_id is required' },
        { status: 400 }
      )
    }

    if (!body.document_type) {
      return NextResponse.json(
        { success: false, error: 'document_type is required' },
        { status: 400 }
      )
    }

    // Default workflow name based on document type
    const workflowName = body.workflow_name || `${body.document_type}-generation`

    const input: CreateWorkflowExecutionInput = {
      project_id: body.project_id,
      document_type: body.document_type,
      document_id: body.document_id,
      workflow_name: workflowName,
      triggered_by: body.triggered_by,
      metadata: body.metadata,
    }

    // Create workflow execution
    const execution = await workflowEngine.createExecution(input)

    return NextResponse.json({
      success: true,
      data: execution,
    })
  } catch (error: any) {
    console.error('Failed to create workflow execution:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create workflow execution',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/workflow?execution_id=xxx
 * 
 * Get workflow execution status with steps and events
 * 
 * Query parameters:
 * - execution_id: string (required)
 * - include_steps: boolean (default: true)
 * - include_events: boolean (default: false)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     execution: WorkflowExecution,
 *     steps?: WorkflowStep[],
 *     events?: WorkflowEvent[]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const executionId = searchParams.get('execution_id')
    const includeSteps = searchParams.get('include_steps') !== 'false'
    const includeEvents = searchParams.get('include_events') === 'true'

    if (!executionId) {
      return NextResponse.json(
        { success: false, error: 'execution_id is required' },
        { status: 400 }
      )
    }

    // Get execution
    const execution = await workflowEngine.getExecution(executionId)

    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Workflow execution not found' },
        { status: 404 }
      )
    }

    // Get steps if requested
    let steps
    if (includeSteps) {
      steps = await workflowEngine.getSteps(executionId)
    }

    // Get events if requested
    let events
    if (includeEvents) {
      events = await workflowEngine.getEvents(executionId)
    }

    return NextResponse.json({
      success: true,
      data: {
        execution,
        steps,
        events,
      },
    })
  } catch (error: any) {
    console.error('Failed to get workflow execution:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get workflow execution',
      },
      { status: 500 }
    )
  }
}

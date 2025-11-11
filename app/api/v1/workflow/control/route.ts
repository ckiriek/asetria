/**
 * Workflow Control API Route
 * 
 * Endpoints for controlling workflow execution (pause, resume, retry).
 * 
 * POST /api/v1/workflow/control - Control workflow execution
 * 
 * @module app/api/v1/workflow/control/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { workflowEngine } from '@/lib/workflow/engine'

/**
 * POST /api/v1/workflow/control
 * 
 * Control workflow execution
 * 
 * Request body:
 * {
 *   execution_id: string
 *   action: 'pause' | 'resume' | 'retry' | 'fail'
 *   actor_id?: string
 *   step_id?: string (required for 'retry')
 *   error_code?: string (required for 'fail')
 *   error_message?: string (required for 'fail')
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: WorkflowExecution | WorkflowStep
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.execution_id) {
      return NextResponse.json(
        { success: false, error: 'execution_id is required' },
        { status: 400 }
      )
    }

    if (!body.action) {
      return NextResponse.json(
        { success: false, error: 'action is required' },
        { status: 400 }
      )
    }

    const { execution_id, action, actor_id, step_id, error_code, error_message } = body

    let result

    switch (action) {
      case 'pause':
        result = await workflowEngine.pauseExecution(execution_id, actor_id)
        break

      case 'resume':
        result = await workflowEngine.resumeExecution(execution_id, actor_id)
        break

      case 'retry':
        if (!step_id) {
          return NextResponse.json(
            { success: false, error: 'step_id is required for retry action' },
            { status: 400 }
          )
        }
        result = await workflowEngine.retryStep(step_id)
        break

      case 'fail':
        if (!error_code || !error_message) {
          return NextResponse.json(
            { success: false, error: 'error_code and error_message are required for fail action' },
            { status: 400 }
          )
        }
        result = await workflowEngine.failExecution(execution_id, error_code, error_message)
        break

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Failed to control workflow:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to control workflow',
      },
      { status: 500 }
    )
  }
}

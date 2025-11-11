/**
 * Refine API Route
 * 
 * Endpoint for content refinement using Writer Agent
 * 
 * POST /api/v1/refine
 * - Refines content using AI
 * - Returns refined content with changes
 * 
 * Version: 1.0.0
 * Date: 2025-11-11
 */

import { NextRequest, NextResponse } from 'next/server'
import { writerAgent } from '@/lib/agents/writer'
import type { WriterRequest } from '@/lib/agents/writer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/refine
 * 
 * Refine content
 */
export async function POST(request: NextRequest) {
  try {
    const body: WriterRequest = await request.json()

    // Validate request
    if (!body.content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      )
    }

    if (!body.section_id) {
      return NextResponse.json(
        { error: 'section_id is required' },
        { status: 400 }
      )
    }

    if (!body.refinement_type) {
      return NextResponse.json(
        { error: 'refinement_type is required' },
        { status: 400 }
      )
    }

    const validTypes = ['enhance', 'simplify', 'expand', 'regulatory', 'technical']
    if (!validTypes.includes(body.refinement_type)) {
      return NextResponse.json(
        { error: `refinement_type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`✍️  Refine API: Processing ${body.section_id} (${body.refinement_type})`)

    // Call Writer Agent
    const result = await writerAgent.refine(body)

    console.log(`✅ Refine API: Completed in ${result.duration_ms}ms`)
    console.log(`   Words: ${result.word_count_before} → ${result.word_count_after}`)

    // Return result
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })

  } catch (error) {
    console.error('Refine API error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/refine/status
 * 
 * Get Writer Agent status
 */
export async function GET(request: NextRequest) {
  try {
    const status = writerAgent.getStatus()

    return NextResponse.json({
      ...status,
      available_refinement_types: [
        'enhance',
        'simplify',
        'expand',
        'regulatory',
        'technical',
      ],
      description: {
        enhance: 'Improve clarity and professional tone',
        simplify: 'Simplify language for better readability',
        expand: 'Add context and detail',
        regulatory: 'Optimize for regulatory submission',
        technical: 'Enhance technical accuracy',
      },
    })

  } catch (error) {
    console.error('Refine API GET error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

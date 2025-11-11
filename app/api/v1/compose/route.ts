/**
 * Compose API Route
 * 
 * Endpoint for document composition using Composer Agent
 * 
 * POST /api/v1/compose
 * - Triggers document composition
 * - Returns rendered sections
 * 
 * Version: 1.0.0
 * Date: 2025-11-11
 */

import { NextRequest, NextResponse } from 'next/server'
import { composerAgent } from '@/lib/agents/composer'
import type { ComposerRequest } from '@/lib/agents/composer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/compose
 * 
 * Compose document sections
 */
export async function POST(request: NextRequest) {
  try {
    const body: ComposerRequest = await request.json()

    // Validate request
    if (!body.project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      )
    }

    if (!body.document_type) {
      return NextResponse.json(
        { error: 'document_type is required' },
        { status: 400 }
      )
    }

    console.log(`📝 Compose API: Starting composition for project ${body.project_id}`)
    console.log(`📄 Document type: ${body.document_type}`)
    if (body.sections) {
      console.log(`📋 Sections requested: ${body.sections.join(', ')}`)
    }

    // Call Composer Agent
    const result = await composerAgent.compose(body)

    console.log(`✅ Compose API: Completed in ${result.duration_ms}ms`)
    console.log(`📊 Generated ${result.sections_generated.length} sections`)

    // Return result
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })

  } catch (error) {
    console.error('Compose API error:', error)
    
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
 * GET /api/v1/compose?project_id=xxx&document_type=xxx
 * 
 * Get available sections for a document type
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('project_id')
    const documentType = searchParams.get('document_type') as any

    if (!projectId || !documentType) {
      return NextResponse.json(
        { error: 'project_id and document_type are required' },
        { status: 400 }
      )
    }

    // Fetch project to get product type
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('product_type')
      .eq('id', projectId)
      .single()

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get available sections
    const sections = composerAgent.getAvailableSections(
      documentType,
      project.product_type as any
    )

    const hasTemplates = composerAgent.hasTemplates(
      documentType,
      project.product_type as any
    )

    return NextResponse.json({
      project_id: projectId,
      document_type: documentType,
      product_type: project.product_type,
      available_sections: sections,
      has_templates: hasTemplates,
      total_sections: sections.length,
    })

  } catch (error) {
    console.error('Compose API GET error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

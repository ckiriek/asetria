/**
 * Export API Route
 * 
 * Endpoint for document export using Export Agent
 * 
 * POST /api/v1/export
 * - Exports content to DOCX/PDF
 * - Returns file information and download URL
 * 
 * Version: 1.0.0
 * Date: 2025-11-11
 */

import { NextRequest, NextResponse } from 'next/server'
import { exportAgent } from '@/lib/agents/export'
import type { ExportRequest } from '@/lib/agents/export'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/export
 * 
 * Export document
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()

    // Validate request
    const validation = exportAgent.validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.errors },
        { status: 400 }
      )
    }

    console.log(`📤 Export API: Exporting to ${body.format}`)
    if (body.filename) {
      console.log(`   Filename: ${body.filename}`)
    }

    // Call Export Agent
    const result = await exportAgent.export(body)

    console.log(`✅ Export API: Completed in ${result.duration_ms}ms`)
    if (result.success) {
      console.log(`   File: ${result.filename}`)
      console.log(`   Size: ${result.file_size} bytes`)
      console.log(`   Pages: ${result.page_count}`)
    }

    // Return result
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })

  } catch (error) {
    console.error('Export API error:', error)
    
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
 * GET /api/v1/export/info
 * 
 * Get export information
 */
export async function GET(request: NextRequest) {
  try {
    const config = exportAgent.getConfiguration()

    return NextResponse.json({
      ...config,
      description: {
        docx: 'Microsoft Word document format',
        pdf: 'Portable Document Format',
        both: 'Export to both DOCX and PDF',
      },
      options: {
        include_toc: 'Include Table of Contents',
        include_headers: 'Include page headers',
        include_footers: 'Include page footers',
        page_numbers: 'Add page numbers',
        font_family: 'Font family (e.g., Times New Roman, Arial)',
        font_size: 'Font size in points',
        line_spacing: 'Line spacing (e.g., 1.0, 1.5, 2.0)',
        margins: 'Page margins in inches',
      },
      metadata_fields: [
        'title',
        'author',
        'subject',
        'keywords',
        'created',
      ],
    })

  } catch (error) {
    console.error('Export API GET error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Versions API Route
 * 
 * Endpoints for managing document versions.
 * 
 * POST /api/v1/versions - Create new version
 * GET /api/v1/versions - List versions
 * 
 * @module app/v1/versions/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, validateRequiredFields } from '@/lib/middleware/error-handler'
import type { CreateDocumentVersionInput } from '@/lib/types/versioning'

/**
 * POST /api/v1/versions
 * 
 * Create a new document version
 * 
 * Request body:
 * {
 *   document_id: string
 *   content: string
 *   generation_params?: Record<string, any>
 *   model_used?: string
 *   tokens_consumed?: number
 *   generation_duration_ms?: number
 *   metadata?: Record<string, any>
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: DocumentVersion
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json() as CreateDocumentVersionInput

    // Validate required fields
    validateRequiredFields(
      body,
      ['document_id', 'content'],
      'VersionManager',
      'create_version'
    )

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Call database function to create version
    const { data, error } = await supabase
      .rpc('create_document_version', {
        p_document_id: body.document_id,
        p_content: body.content,
        p_created_by: user.id,
        p_generation_params: body.generation_params || null,
        p_model_used: body.model_used || null,
      })
      .single()

    if (error || !data) {
      throw error || new Error('Failed to create version')
    }

    // Update additional fields if provided
    if (body.tokens_consumed || body.generation_duration_ms || body.metadata) {
      const { data: updated, error: updateError } = await supabase
        .from('document_versions')
        .update({
          tokens_consumed: body.tokens_consumed,
          generation_duration_ms: body.generation_duration_ms,
          metadata: body.metadata,
        })
        .eq('id', (data as any).id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        data: updated,
      })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return handleApiError(error, 'VersionManager', 'create_version')
  }
}

/**
 * GET /api/v1/versions
 * 
 * List document versions
 * 
 * Query parameters:
 * - document_id: string (required)
 * - status?: VersionStatus
 * - limit?: number
 * - offset?: number
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     versions: DocumentVersion[],
 *     current_version?: DocumentVersion,
 *     total: number
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const documentId = searchParams.get('document_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate required parameters
    validateRequiredFields(
      { document_id: documentId },
      ['document_id'],
      'VersionManager',
      'list_versions'
    )

    // Build query
    let query = supabase
      .from('document_versions')
      .select('*', { count: 'exact' })
      .eq('document_id', documentId!)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination and ordering
    query = query
      .order('version_number', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // Get current version
    const { data: currentVersion } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId!)
      .eq('is_current', true)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        versions: data || [],
        current_version: currentVersion || undefined,
        total: count || 0,
      },
    })
  } catch (error) {
    return handleApiError(error, 'VersionManager', 'list_versions')
  }
}

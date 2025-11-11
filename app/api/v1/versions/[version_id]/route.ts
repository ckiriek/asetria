/**
 * Version Detail API Route
 * 
 * Endpoints for managing individual versions.
 * 
 * GET /api/v1/versions/[version_id] - Get version
 * PATCH /api/v1/versions/[version_id] - Update version
 * DELETE /api/v1/versions/[version_id] - Delete version
 * 
 * @module app/api/v1/versions/[version_id]/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/middleware/error-handler'
import { createApiError, ErrorCodes } from '@/lib/types/errors'
import type { UpdateDocumentVersionInput } from '@/lib/types/versioning'

/**
 * GET /api/v1/versions/[version_id]
 * 
 * Get version by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { version_id: string } }
) {
  try {
    const supabase = await createClient()
    const { version_id } = params

    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('id', version_id)
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json(
        createApiError(
          ErrorCodes.NOT_FOUND,
          `Version not found: ${version_id}`,
          {
            category: 'not_found',
            severity: 'error',
            details: { version_id },
          }
        ),
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return handleApiError(error, 'VersionManager', 'get_version')
  }
}

/**
 * PATCH /api/v1/versions/[version_id]
 * 
 * Update version
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { version_id: string } }
) {
  try {
    const supabase = await createClient()
    const { version_id } = params
    const body = await request.json() as UpdateDocumentVersionInput

    const { data, error } = await supabase
      .from('document_versions')
      .update(body)
      .eq('id', version_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json(
        createApiError(
          ErrorCodes.NOT_FOUND,
          `Version not found: ${version_id}`,
          {
            category: 'not_found',
            severity: 'error',
            details: { version_id },
          }
        ),
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return handleApiError(error, 'VersionManager', 'update_version')
  }
}

/**
 * DELETE /api/v1/versions/[version_id]
 * 
 * Delete version (soft delete - mark as archived)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { version_id: string } }
) {
  try {
    const supabase = await createClient()
    const { version_id } = params

    // Soft delete - mark as archived
    const { data, error } = await supabase
      .from('document_versions')
      .update({ status: 'archived' })
      .eq('id', version_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json(
        createApiError(
          ErrorCodes.NOT_FOUND,
          `Version not found: ${version_id}`,
          {
            category: 'not_found',
            severity: 'error',
            details: { version_id },
          }
        ),
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Version ${version_id} archived successfully`,
      data,
    })
  } catch (error) {
    return handleApiError(error, 'VersionManager', 'delete_version')
  }
}

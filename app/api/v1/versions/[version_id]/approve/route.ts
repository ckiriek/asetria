/**
 * Version Approval API Route
 * 
 * Endpoint for approving document versions.
 * 
 * POST /api/v1/versions/[version_id]/approve - Approve version
 * 
 * @module app/api/v1/versions/[version_id]/approve/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/middleware/error-handler'
import { createApiError, ErrorCodes } from '@/lib/types/errors'

/**
 * POST /api/v1/versions/[version_id]/approve
 * 
 * Approve a document version
 * 
 * Request body:
 * {
 *   approval_notes?: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: DocumentVersion
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { version_id: string } }
) {
  try {
    const supabase = await createClient()
    const { version_id } = params
    const body = await request.json()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Call database function to approve version
    const { data, error } = await supabase
      .rpc('approve_document_version', {
        p_version_id: version_id,
        p_approved_by: user.id,
        p_approval_notes: body.approval_notes || null,
      })
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
      message: 'Version approved successfully',
    })
  } catch (error) {
    return handleApiError(error, 'VersionManager', 'approve_version')
  }
}

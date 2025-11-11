/**
 * Comments API Route
 * 
 * Endpoints for managing review comments.
 * 
 * POST /api/v1/comments - Create comment
 * GET /api/v1/comments - List comments
 * 
 * @module app/api/v1/comments/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, validateRequiredFields } from '@/lib/middleware/error-handler'
import type { CreateReviewCommentInput } from '@/lib/types/versioning'

/**
 * POST /api/v1/comments
 * 
 * Create a review comment
 * 
 * Request body:
 * {
 *   document_id: string
 *   version_id: string
 *   section_id?: string
 *   comment_text: string
 *   comment_type?: CommentType
 *   priority?: CommentPriority
 *   parent_comment_id?: string
 *   metadata?: Record<string, any>
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: ReviewComment
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json() as CreateReviewCommentInput

    // Validate required fields
    validateRequiredFields(
      body,
      ['document_id', 'version_id', 'comment_text'],
      'CommentManager',
      'create_comment'
    )

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Calculate thread depth if parent comment exists
    let threadDepth = 0
    if (body.parent_comment_id) {
      const { data: parentComment } = await supabase
        .from('review_comments')
        .select('thread_depth')
        .eq('id', body.parent_comment_id)
        .single()

      if (parentComment) {
        threadDepth = parentComment.thread_depth + 1
      }
    }

    // Create comment
    const { data, error } = await supabase
      .from('review_comments')
      .insert({
        document_id: body.document_id,
        version_id: body.version_id,
        section_id: body.section_id,
        section_path: body.section_path,
        comment_text: body.comment_text,
        comment_type: body.comment_type || 'general',
        priority: body.priority || 'medium',
        parent_comment_id: body.parent_comment_id,
        thread_depth: threadDepth,
        metadata: body.metadata,
        author_id: user.id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return handleApiError(error, 'CommentManager', 'create_comment')
  }
}

/**
 * GET /api/v1/comments
 * 
 * List review comments
 * 
 * Query parameters:
 * - document_id?: string
 * - version_id?: string
 * - section_id?: string
 * - status?: CommentStatus
 * - author_id?: string
 * - limit?: number
 * - offset?: number
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     comments: ReviewComment[],
 *     total: number
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const documentId = searchParams.get('document_id')
    const versionId = searchParams.get('version_id')
    const sectionId = searchParams.get('section_id')
    const status = searchParams.get('status')
    const authorId = searchParams.get('author_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('review_comments')
      .select('*', { count: 'exact' })

    // Apply filters
    if (documentId) {
      query = query.eq('document_id', documentId)
    }

    if (versionId) {
      query = query.eq('version_id', versionId)
    }

    if (sectionId) {
      query = query.eq('section_id', sectionId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (authorId) {
      query = query.eq('author_id', authorId)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        comments: data || [],
        total: count || 0,
      },
    })
  } catch (error) {
    return handleApiError(error, 'CommentManager', 'list_comments')
  }
}

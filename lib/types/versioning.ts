/**
 * Versioning Types
 * 
 * Type definitions for document versioning system.
 * 
 * @module lib/types/versioning
 */

// ============================================================================
// DOCUMENT VERSION
// ============================================================================

export type VersionStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'superseded'
  | 'archived'

export interface DocumentVersion {
  id: string
  
  // Document reference
  document_id: string
  version_number: number
  
  // Content
  content: string
  content_hash: string
  
  // Status
  status: VersionStatus
  
  // Versioning
  parent_version_id?: string
  is_current: boolean
  
  // Generation metadata
  generation_params?: Record<string, any>
  model_used?: string
  tokens_consumed?: number
  generation_duration_ms?: number
  
  // Approval workflow
  approved_by?: string
  approved_at?: string
  approval_notes?: string
  
  // Metadata
  metadata?: Record<string, any>
  
  // Audit
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateDocumentVersionInput {
  document_id: string
  content: string
  generation_params?: Record<string, any>
  model_used?: string
  tokens_consumed?: number
  generation_duration_ms?: number
  metadata?: Record<string, any>
}

export interface UpdateDocumentVersionInput {
  status?: VersionStatus
  approval_notes?: string
  metadata?: Record<string, any>
}

// ============================================================================
// VERSION DIFF
// ============================================================================

export type DiffType = 'content' | 'structure' | 'metadata'

export interface VersionDiff {
  id: string
  
  // Version references
  from_version_id: string
  to_version_id: string
  
  // Diff type
  diff_type: DiffType
  
  // Diff data (JSON Patch format: RFC 6902)
  diff_data: any[]
  
  // Statistics
  additions_count: number
  deletions_count: number
  modifications_count: number
  
  // Metadata
  metadata?: Record<string, any>
  
  // Audit
  created_at: string
}

export interface CreateVersionDiffInput {
  from_version_id: string
  to_version_id: string
  diff_type: DiffType
  diff_data: any[]
  additions_count?: number
  deletions_count?: number
  modifications_count?: number
  metadata?: Record<string, any>
}

// ============================================================================
// REVIEW COMMENT
// ============================================================================

export type CommentType =
  | 'general'
  | 'suggestion'
  | 'question'
  | 'issue'
  | 'approval'

export type CommentPriority = 'low' | 'medium' | 'high' | 'critical'

export type CommentStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'deferred'

export interface ReviewComment {
  id: string
  
  // Document and version reference
  document_id: string
  version_id: string
  
  // Section reference
  section_id?: string
  section_path?: string
  
  // Comment details
  comment_text: string
  comment_type: CommentType
  
  // Priority
  priority: CommentPriority
  
  // Status
  status: CommentStatus
  
  // Resolution
  resolved_by?: string
  resolved_at?: string
  resolution_notes?: string
  
  // Thread support
  parent_comment_id?: string
  thread_depth: number
  
  // Metadata
  metadata?: Record<string, any>
  
  // Audit
  author_id: string
  created_at: string
  updated_at: string
}

export interface CreateReviewCommentInput {
  document_id: string
  version_id: string
  section_id?: string
  section_path?: string
  comment_text: string
  comment_type?: CommentType
  priority?: CommentPriority
  parent_comment_id?: string
  metadata?: Record<string, any>
}

export interface UpdateReviewCommentInput {
  comment_text?: string
  comment_type?: CommentType
  priority?: CommentPriority
  status?: CommentStatus
  resolution_notes?: string
  metadata?: Record<string, any>
}

// ============================================================================
// VERSION HISTORY
// ============================================================================

export interface VersionHistory {
  versions: DocumentVersion[]
  current_version?: DocumentVersion
  total: number
}

export interface VersionComparison {
  from_version: DocumentVersion
  to_version: DocumentVersion
  diffs: VersionDiff[]
  summary: {
    total_changes: number
    additions: number
    deletions: number
    modifications: number
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get version status display
 */
export function getVersionStatusDisplay(status: VersionStatus): {
  text: string
  color: string
  icon: string
} {
  const displays: Record<VersionStatus, { text: string; color: string; icon: string }> = {
    draft: { text: 'Draft', color: 'gray', icon: '📝' },
    review: { text: 'In Review', color: 'blue', icon: '👀' },
    approved: { text: 'Approved', color: 'green', icon: '✅' },
    superseded: { text: 'Superseded', color: 'yellow', icon: '🔄' },
    archived: { text: 'Archived', color: 'gray', icon: '📦' },
  }
  return displays[status]
}

/**
 * Get comment type display
 */
export function getCommentTypeDisplay(type: CommentType): {
  text: string
  color: string
  icon: string
} {
  const displays: Record<CommentType, { text: string; color: string; icon: string }> = {
    general: { text: 'General', color: 'gray', icon: '💬' },
    suggestion: { text: 'Suggestion', color: 'blue', icon: '💡' },
    question: { text: 'Question', color: 'purple', icon: '❓' },
    issue: { text: 'Issue', color: 'red', icon: '⚠️' },
    approval: { text: 'Approval', color: 'green', icon: '✅' },
  }
  return displays[type]
}

/**
 * Get comment priority color
 */
export function getCommentPriorityColor(priority: CommentPriority): string {
  const colors: Record<CommentPriority, string> = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    critical: 'red',
  }
  return colors[priority]
}

/**
 * Get comment status display
 */
export function getCommentStatusDisplay(status: CommentStatus): {
  text: string
  color: string
  icon: string
} {
  const displays: Record<CommentStatus, { text: string; color: string; icon: string }> = {
    open: { text: 'Open', color: 'blue', icon: '🔵' },
    in_progress: { text: 'In Progress', color: 'yellow', icon: '🟡' },
    resolved: { text: 'Resolved', color: 'green', icon: '🟢' },
    rejected: { text: 'Rejected', color: 'red', icon: '🔴' },
    deferred: { text: 'Deferred', color: 'gray', icon: '⚪' },
  }
  return displays[status]
}

/**
 * Format version number
 */
export function formatVersionNumber(version: number): string {
  return `v${version}`
}

/**
 * Calculate diff summary
 */
export function calculateDiffSummary(diffs: VersionDiff[]): {
  total_changes: number
  additions: number
  deletions: number
  modifications: number
} {
  return diffs.reduce(
    (acc, diff) => ({
      total_changes: acc.total_changes + diff.additions_count + diff.deletions_count + diff.modifications_count,
      additions: acc.additions + diff.additions_count,
      deletions: acc.deletions + diff.deletions_count,
      modifications: acc.modifications + diff.modifications_count,
    }),
    { total_changes: 0, additions: 0, deletions: 0, modifications: 0 }
  )
}

/**
 * Check if version can be approved
 */
export function canApproveVersion(version: DocumentVersion): boolean {
  return version.status === 'review' && version.is_current
}

/**
 * Check if version can be edited
 */
export function canEditVersion(version: DocumentVersion): boolean {
  return version.status === 'draft' && version.is_current
}

/**
 * Get version age in days
 */
export function getVersionAge(version: DocumentVersion): number {
  const created = new Date(version.created_at)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Format version metadata
 */
export function formatVersionMetadata(version: DocumentVersion): string[] {
  const metadata: string[] = []
  
  if (version.model_used) {
    metadata.push(`Model: ${version.model_used}`)
  }
  
  if (version.tokens_consumed) {
    metadata.push(`Tokens: ${version.tokens_consumed.toLocaleString()}`)
  }
  
  if (version.generation_duration_ms) {
    const seconds = (version.generation_duration_ms / 1000).toFixed(1)
    metadata.push(`Duration: ${seconds}s`)
  }
  
  return metadata
}

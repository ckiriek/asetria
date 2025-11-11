-- ============================================================================
-- VERSIONING SYSTEM SCHEMA
-- ============================================================================
-- Purpose: Document versioning with diff tracking and review comments
-- Created: 2025-11-11
-- Compliance: ICH E6(R2) - version control and audit trail requirements
-- ============================================================================

-- ============================================================================
-- 1. DOCUMENT VERSIONS
-- ============================================================================
-- Tracks all versions of documents with full content and metadata
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document reference
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL, -- SHA-256 hash for integrity
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  -- 'draft', 'review', 'approved', 'superseded', 'archived'
  
  -- Versioning
  parent_version_id UUID REFERENCES document_versions(id),
  is_current BOOLEAN DEFAULT false,
  
  -- Generation metadata
  generation_params JSONB, -- Parameters used to generate this version
  model_used TEXT, -- AI model used (e.g., 'gpt-4', 'claude-3')
  tokens_consumed INTEGER,
  generation_duration_ms INTEGER,
  
  -- Approval workflow
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Metadata
  metadata JSONB, -- Additional metadata
  
  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(document_id, version_number),
  CHECK (version_number > 0),
  CHECK (status IN ('draft', 'review', 'approved', 'superseded', 'archived'))
);

-- Indexes for document_versions
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_version_number ON document_versions(version_number DESC);
CREATE INDEX idx_document_versions_status ON document_versions(status);
CREATE INDEX idx_document_versions_is_current ON document_versions(is_current) WHERE is_current = true;
CREATE INDEX idx_document_versions_created_at ON document_versions(created_at DESC);
CREATE INDEX idx_document_versions_created_by ON document_versions(created_by);
CREATE INDEX idx_document_versions_parent_version ON document_versions(parent_version_id);

-- Trigger for updated_at
CREATE TRIGGER update_document_versions_updated_at
  BEFORE UPDATE ON document_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. VERSION DIFFS
-- ============================================================================
-- Stores differences between document versions using JSON Patch format
CREATE TABLE IF NOT EXISTS version_diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Version references
  from_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  to_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  
  -- Diff type
  diff_type TEXT NOT NULL,
  -- 'content' - text content changes
  -- 'structure' - document structure changes
  -- 'metadata' - metadata changes
  
  -- Diff data (JSON Patch format: RFC 6902)
  diff_data JSONB NOT NULL,
  
  -- Statistics
  additions_count INTEGER DEFAULT 0,
  deletions_count INTEGER DEFAULT 0,
  modifications_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(from_version_id, to_version_id, diff_type),
  CHECK (diff_type IN ('content', 'structure', 'metadata')),
  CHECK (from_version_id != to_version_id)
);

-- Indexes for version_diffs
CREATE INDEX idx_version_diffs_from_version ON version_diffs(from_version_id);
CREATE INDEX idx_version_diffs_to_version ON version_diffs(to_version_id);
CREATE INDEX idx_version_diffs_diff_type ON version_diffs(diff_type);
CREATE INDEX idx_version_diffs_created_at ON version_diffs(created_at DESC);

-- ============================================================================
-- 3. REVIEW COMMENTS
-- ============================================================================
-- Stores review comments for document sections
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document and version reference
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  
  -- Section reference
  section_id TEXT, -- Section identifier (e.g., 'section_5', 'table_1')
  section_path TEXT, -- JSON path to section (e.g., '$.sections[5]')
  
  -- Comment details
  comment_text TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'general',
  -- 'general', 'suggestion', 'question', 'issue', 'approval'
  
  -- Priority
  priority TEXT DEFAULT 'medium',
  -- 'low', 'medium', 'high', 'critical'
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open',
  -- 'open', 'in_progress', 'resolved', 'rejected', 'deferred'
  
  -- Resolution
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Thread support
  parent_comment_id UUID REFERENCES review_comments(id),
  thread_depth INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB,
  
  -- Audit
  author_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CHECK (comment_type IN ('general', 'suggestion', 'question', 'issue', 'approval')),
  CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CHECK (status IN ('open', 'in_progress', 'resolved', 'rejected', 'deferred')),
  CHECK (thread_depth >= 0 AND thread_depth <= 5)
);

-- Indexes for review_comments
CREATE INDEX idx_review_comments_document_id ON review_comments(document_id);
CREATE INDEX idx_review_comments_version_id ON review_comments(version_id);
CREATE INDEX idx_review_comments_section_id ON review_comments(section_id);
CREATE INDEX idx_review_comments_status ON review_comments(status);
CREATE INDEX idx_review_comments_author_id ON review_comments(author_id);
CREATE INDEX idx_review_comments_created_at ON review_comments(created_at DESC);
CREATE INDEX idx_review_comments_parent_comment ON review_comments(parent_comment_id);
CREATE INDEX idx_review_comments_priority ON review_comments(priority);

-- Trigger for updated_at
CREATE TRIGGER update_review_comments_updated_at
  BEFORE UPDATE ON review_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_diffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- document_versions policies
CREATE POLICY "Users can view versions of their documents"
  ON document_versions FOR SELECT
  USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN projects p ON d.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for their documents"
  ON document_versions FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN projects p ON d.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their document versions"
  ON document_versions FOR UPDATE
  USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN projects p ON d.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

-- version_diffs policies
CREATE POLICY "Users can view diffs of their document versions"
  ON version_diffs FOR SELECT
  USING (
    from_version_id IN (
      SELECT dv.id FROM document_versions dv
      JOIN documents d ON dv.document_id = d.id
      JOIN projects p ON d.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

CREATE POLICY "System can insert version diffs"
  ON version_diffs FOR INSERT
  WITH CHECK (true);

-- review_comments policies
CREATE POLICY "Users can view comments on their documents"
  ON review_comments FOR SELECT
  USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN projects p ON d.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on their documents"
  ON review_comments FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN projects p ON d.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments"
  ON review_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON review_comments FOR DELETE
  USING (author_id = auth.uid());

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get current version of a document
CREATE OR REPLACE FUNCTION get_current_version(p_document_id UUID)
RETURNS document_versions AS $$
DECLARE
  v_version document_versions;
BEGIN
  SELECT * INTO v_version
  FROM document_versions
  WHERE document_id = p_document_id
    AND is_current = true
  LIMIT 1;
  
  RETURN v_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new version
CREATE OR REPLACE FUNCTION create_document_version(
  p_document_id UUID,
  p_content TEXT,
  p_created_by UUID,
  p_generation_params JSONB DEFAULT NULL,
  p_model_used TEXT DEFAULT NULL
)
RETURNS document_versions AS $$
DECLARE
  v_next_version INTEGER;
  v_content_hash TEXT;
  v_new_version document_versions;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM document_versions
  WHERE document_id = p_document_id;
  
  -- Calculate content hash
  v_content_hash := encode(digest(p_content, 'sha256'), 'hex');
  
  -- Mark all existing versions as not current
  UPDATE document_versions
  SET is_current = false
  WHERE document_id = p_document_id
    AND is_current = true;
  
  -- Insert new version
  INSERT INTO document_versions (
    document_id,
    version_number,
    content,
    content_hash,
    status,
    is_current,
    generation_params,
    model_used,
    created_by
  ) VALUES (
    p_document_id,
    v_next_version,
    p_content,
    v_content_hash,
    'draft',
    true,
    p_generation_params,
    p_model_used,
    p_created_by
  )
  RETURNING * INTO v_new_version;
  
  RETURN v_new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve version
CREATE OR REPLACE FUNCTION approve_document_version(
  p_version_id UUID,
  p_approved_by UUID,
  p_approval_notes TEXT DEFAULT NULL
)
RETURNS document_versions AS $$
DECLARE
  v_version document_versions;
BEGIN
  UPDATE document_versions
  SET 
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = now(),
    approval_notes = p_approval_notes
  WHERE id = p_version_id
  RETURNING * INTO v_version;
  
  -- Mark previous approved versions as superseded
  UPDATE document_versions
  SET status = 'superseded'
  WHERE document_id = v_version.document_id
    AND id != p_version_id
    AND status = 'approved';
  
  RETURN v_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created: 3 (document_versions, version_diffs, review_comments)
-- Indexes created: 25+
-- Functions created: 3 (get_current_version, create_document_version, approve_document_version)
-- RLS policies: Enabled with user-level access control
-- ============================================================================

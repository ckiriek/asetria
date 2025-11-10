-- Row Level Security (RLS) Policies for Asetria
-- Ensures users can only access data within their organization

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities_corpus ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_ontology ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's org_id
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION auth.user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = required_role
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = auth.user_org_id());

CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (id = auth.user_org_id() AND auth.user_has_role('admin'));

-- Users policies
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (org_id = auth.user_org_id());

CREATE POLICY "Admins can manage users in their organization"
  ON users FOR ALL
  USING (org_id = auth.user_org_id() AND auth.user_has_role('admin'));

-- Projects policies
CREATE POLICY "Users can view projects in their organization"
  ON projects FOR SELECT
  USING (org_id = auth.user_org_id());

CREATE POLICY "Medical writers and admins can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    org_id = auth.user_org_id() 
    AND (auth.user_has_role('admin') OR auth.user_has_role('medical_writer'))
  );

CREATE POLICY "Medical writers and admins can update projects"
  ON projects FOR UPDATE
  USING (
    org_id = auth.user_org_id() 
    AND (auth.user_has_role('admin') OR auth.user_has_role('medical_writer'))
  );

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (org_id = auth.user_org_id() AND auth.user_has_role('admin'));

-- Documents policies
CREATE POLICY "Users can view documents in their org projects"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = documents.project_id 
      AND projects.org_id = auth.user_org_id()
    )
  );

CREATE POLICY "Medical writers can create documents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = documents.project_id 
      AND projects.org_id = auth.user_org_id()
    )
    AND (auth.user_has_role('admin') OR auth.user_has_role('medical_writer'))
  );

CREATE POLICY "Medical writers and reviewers can update documents"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = documents.project_id 
      AND projects.org_id = auth.user_org_id()
    )
    AND (
      auth.user_has_role('admin') 
      OR auth.user_has_role('medical_writer')
      OR auth.user_has_role('reviewer')
    )
  );

-- Evidence sources policies
CREATE POLICY "Users can view evidence in their org projects"
  ON evidence_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = evidence_sources.project_id 
      AND projects.org_id = auth.user_org_id()
    )
  );

CREATE POLICY "Medical writers can manage evidence"
  ON evidence_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = evidence_sources.project_id 
      AND projects.org_id = auth.user_org_id()
    )
    AND (auth.user_has_role('admin') OR auth.user_has_role('medical_writer'))
  );

-- Audit log policies (read-only for compliance)
CREATE POLICY "Users can view audit logs in their org projects"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = audit_log.project_id 
      AND projects.org_id = auth.user_org_id()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (true);

-- Integrations policies
CREATE POLICY "Users can view their org integrations"
  ON integrations FOR SELECT
  USING (org_id = auth.user_org_id());

CREATE POLICY "Admins can manage integrations"
  ON integrations FOR ALL
  USING (org_id = auth.user_org_id() AND auth.user_has_role('admin'));

-- Entities corpus policies
CREATE POLICY "Users can view entities in their org projects"
  ON entities_corpus FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = entities_corpus.project_id 
      AND projects.org_id = auth.user_org_id()
    )
  );

CREATE POLICY "Medical writers can manage entities"
  ON entities_corpus FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = entities_corpus.project_id 
      AND projects.org_id = auth.user_org_id()
    )
    AND (auth.user_has_role('admin') OR auth.user_has_role('medical_writer'))
  );

-- Document links policies
CREATE POLICY "Users can view document links in their org"
  ON document_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN projects p ON d.project_id = p.id
      WHERE d.id = document_links.source_doc_id 
      AND p.org_id = auth.user_org_id()
    )
  );

CREATE POLICY "Medical writers can manage document links"
  ON document_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN projects p ON d.project_id = p.id
      WHERE d.id = document_links.source_doc_id 
      AND p.org_id = auth.user_org_id()
    )
    AND (auth.user_has_role('admin') OR auth.user_has_role('medical_writer'))
  );

-- Validation rules policies (read-only for most users)
CREATE POLICY "All authenticated users can view validation rules"
  ON validation_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage validation rules"
  ON validation_rules FOR ALL
  USING (auth.user_has_role('admin'));

-- Term ontology policies (read-only for all)
CREATE POLICY "All authenticated users can view term ontology"
  ON term_ontology FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage term ontology"
  ON term_ontology FOR ALL
  USING (auth.user_has_role('admin'));

COMMENT ON POLICY "Users can view their own organization" ON organizations IS 'Users can only see their own organization';
COMMENT ON POLICY "Users can view projects in their organization" ON projects IS 'Organization-scoped project access';
COMMENT ON POLICY "Medical writers can create documents" ON documents IS 'Only medical writers and admins can create documents';

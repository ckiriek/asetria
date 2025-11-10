-- Asetria Initial Schema Migration
-- Based on DB_SCHEMA.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    billing_plan TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'medical_writer', 'reviewer', 'viewer')),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    phase TEXT,
    indication TEXT,
    countries TEXT[],
    design_json JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('IB', 'Protocol', 'ICF', 'Synopsis')),
    version INT DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'outdated')),
    path TEXT,
    checksum TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence sources table
CREATE TABLE evidence_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('ClinicalTrials.gov', 'PubMed', 'openFDA', 'WHO_ICTRP', 'manual')),
    external_id TEXT,
    payload_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table (immutable)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    diff_json JSONB,
    actor_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations table
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    api_type TEXT NOT NULL CHECK (api_type IN ('openFDA', 'Azure_OpenAI', 'EMA_SPOR')),
    api_key_meta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entities corpus table (single source of truth)
CREATE TABLE entities_corpus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_key TEXT NOT NULL,
    entity_value JSONB NOT NULL,
    source_document TEXT,
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    modified_by UUID REFERENCES users(id),
    UNIQUE(project_id, entity_type, entity_key)
);

-- Document links table (dependencies between documents)
CREATE TABLE document_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    target_doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    linked_entities TEXT[],
    sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_doc_id, target_doc_id)
);

-- Validation rules table
CREATE TABLE validation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    section_ref TEXT,
    check_type TEXT CHECK (check_type IN ('required', 'format', 'completeness', 'consistency')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Term ontology table (openFDA + MedDRA subset)
CREATE TABLE term_ontology (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('openFDA', 'MedDRA', 'WHODrug')),
    code TEXT,
    parent_code TEXT,
    level INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source, code)
);

-- Indexes for performance
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_org ON projects(org_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_evidence_project ON evidence_sources(project_id);
CREATE INDEX idx_audit_project ON audit_log(project_id);
CREATE INDEX idx_audit_document ON audit_log(document_id);
CREATE INDEX idx_entities_project ON entities_corpus(project_id);
CREATE INDEX idx_entities_type_key ON entities_corpus(entity_type, entity_key);
CREATE INDEX idx_term_ontology_source_code ON term_ontology(source, code);
CREATE INDEX idx_term_ontology_term ON term_ontology(term);

-- Trigger function to update documents.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger function to mark dependent documents as outdated when entities change
CREATE OR REPLACE FUNCTION mark_dependent_docs_outdated()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark all documents in the same project as outdated
    UPDATE documents
    SET status = 'outdated'
    WHERE project_id = NEW.project_id
    AND status = 'approved';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_entity_update
    AFTER INSERT OR UPDATE ON entities_corpus
    FOR EACH ROW
    EXECUTE FUNCTION mark_dependent_docs_outdated();

-- Insert default validation rules for IB (Investigator's Brochure)
INSERT INTO validation_rules (document_type, rule_name, rule_description, section_ref, check_type) VALUES
('IB', 'Title Page Required', 'IB must have a title page with product name and version', '1.0', 'required'),
('IB', 'Table of Contents Required', 'IB must include table of contents', '2.0', 'required'),
('IB', 'Summary Required', 'IB must have a summary section', '3.0', 'required'),
('IB', 'Introduction Required', 'IB must have introduction with chemical/pharmaceutical info', '4.0', 'required'),
('IB', 'Physical Chemical Properties', 'Physical, chemical, and pharmaceutical properties must be documented', '4.1', 'completeness'),
('IB', 'Formulation Required', 'Formulation details must be provided', '4.2', 'required'),
('IB', 'Nonclinical Studies Required', 'Nonclinical studies section required', '5.0', 'required'),
('IB', 'Pharmacology Required', 'Nonclinical pharmacology must be documented', '5.1', 'completeness'),
('IB', 'Toxicology Required', 'Toxicology studies must be documented', '5.2', 'completeness'),
('IB', 'Clinical Studies Required', 'Clinical studies and experience section required', '6.0', 'required'),
('IB', 'Pharmacokinetics Required', 'Clinical pharmacokinetics data required', '6.1', 'completeness'),
('IB', 'Efficacy Data Required', 'Clinical efficacy data must be provided', '6.2', 'completeness'),
('IB', 'Safety Data Required', 'Clinical safety data and adverse events required', '6.3', 'required'),
('IB', 'References Required', 'References section must be included', '7.0', 'required');

COMMENT ON TABLE organizations IS 'Organizations using the platform';
COMMENT ON TABLE users IS 'Users with role-based access';
COMMENT ON TABLE projects IS 'Clinical trial projects';
COMMENT ON TABLE documents IS 'Generated regulatory documents with versioning';
COMMENT ON TABLE evidence_sources IS 'External data sources for evidence';
COMMENT ON TABLE audit_log IS 'Immutable audit trail for compliance';
COMMENT ON TABLE integrations IS 'API integrations per organization';
COMMENT ON TABLE entities_corpus IS 'Single source of truth for all extracted entities';
COMMENT ON TABLE document_links IS 'Dependencies between documents for linked updates';
COMMENT ON TABLE validation_rules IS 'ICH/FDA validation rules';
COMMENT ON TABLE term_ontology IS 'Medical terminology ontology (MedDRA, openFDA, WHODrug)';

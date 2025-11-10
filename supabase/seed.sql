-- Seed data for Asetria development and testing

-- Create demo organization
INSERT INTO organizations (id, name, billing_plan) VALUES
('00000000-0000-0000-0000-000000000001', 'Demo CRO', 'enterprise');

-- Create demo users
INSERT INTO users (id, email, name, role, org_id) VALUES
('00000000-0000-0000-0000-000000000011', 'admin@democro.com', 'Admin User', 'admin', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000012', 'writer@democro.com', 'Medical Writer', 'medical_writer', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000013', 'reviewer@democro.com', 'Reviewer User', 'reviewer', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000014', 'viewer@democro.com', 'Viewer User', 'viewer', '00000000-0000-0000-0000-000000000001');

-- Create demo project
INSERT INTO projects (id, org_id, title, phase, indication, countries, design_json, created_by) VALUES
(
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000001',
  'AST-101 Phase 2 Trial',
  'Phase 2',
  'Type 2 Diabetes',
  ARRAY['USA', 'Germany', 'Japan'],
  '{"design_type": "randomized", "blinding": "double-blind", "arms": 3, "duration_weeks": 24, "primary_endpoint": "HbA1c reduction"}'::jsonb,
  '00000000-0000-0000-0000-000000000012'
);

-- Create sample entities
INSERT INTO entities_corpus (project_id, entity_type, entity_key, entity_value, source_document, modified_by) VALUES
(
  '00000000-0000-0000-0000-000000000021',
  'compound',
  'AST-101',
  '{"name": "AST-101", "class": "GLP-1 agonist", "molecular_weight": 3297.7, "formula": "C149H226N40O45"}'::jsonb,
  'protocol_v1.pdf',
  '00000000-0000-0000-0000-000000000012'
),
(
  '00000000-0000-0000-0000-000000000021',
  'indication',
  'type_2_diabetes',
  '{"name": "Type 2 Diabetes Mellitus", "icd10": "E11", "population": "adults_18_75"}'::jsonb,
  'protocol_v1.pdf',
  '00000000-0000-0000-0000-000000000012'
),
(
  '00000000-0000-0000-0000-000000000021',
  'endpoint',
  'primary',
  '{"type": "primary", "measure": "Change in HbA1c from baseline", "timepoint": "Week 24"}'::jsonb,
  'protocol_v1.pdf',
  '00000000-0000-0000-0000-000000000012'
);

-- Create sample document
INSERT INTO documents (id, project_id, type, version, status, created_by) VALUES
(
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000021',
  'IB',
  1,
  'draft',
  '00000000-0000-0000-0000-000000000012'
);

-- Create sample evidence sources
INSERT INTO evidence_sources (project_id, source, external_id, payload_json) VALUES
(
  '00000000-0000-0000-0000-000000000021',
  'ClinicalTrials.gov',
  'NCT04567890',
  '{"title": "Similar GLP-1 Study", "phase": "Phase 2", "status": "Completed", "results_available": true}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000021',
  'PubMed',
  '34567890',
  '{"title": "Efficacy of GLP-1 agonists in T2DM", "authors": "Smith J et al", "year": 2023, "journal": "Diabetes Care"}'::jsonb
);

-- Add sample term ontology entries (MedDRA subset)
INSERT INTO term_ontology (term, source, code, parent_code, level) VALUES
('Hypoglycemia', 'MedDRA', '10020993', '10020772', 4),
('Blood glucose decreased', 'MedDRA', '10005557', '10020772', 4),
('Nausea', 'MedDRA', '10028813', '10017947', 4),
('Vomiting', 'MedDRA', '10047700', '10017947', 4),
('Diarrhea', 'MedDRA', '10012735', '10017947', 4),
('Headache', 'MedDRA', '10019211', '10028395', 4);

-- Add sample audit log entry
INSERT INTO audit_log (project_id, document_id, action, diff_json, actor_user_id) VALUES
(
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000031',
  'document_created',
  '{"type": "IB", "version": 1}'::jsonb,
  '00000000-0000-0000-0000-000000000012'
);

COMMENT ON TABLE organizations IS 'Demo organization for testing';
COMMENT ON TABLE users IS 'Demo users with different roles';
COMMENT ON TABLE projects IS 'Demo project AST-101';

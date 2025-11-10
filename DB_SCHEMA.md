# Database Schema - Supabase

## users
id uuid pk, email text unique, name text, role text, org_id uuid fk, created_at timestamptz

## organizations
id uuid pk, name text, billing_plan text, created_at timestamptz

## projects
id uuid pk, org_id uuid fk, title text, phase text, indication text, countries text[],
design_json jsonb, created_by uuid fk, created_at timestamptz

## documents
id uuid pk, project_id uuid fk, type text, version int, status text,
path text, checksum text, created_by uuid fk, created_at timestamptz, updated_at timestamptz

## evidence_sources
id uuid pk, project_id uuid fk, source text, external_id text, payload_json jsonb, created_at timestamptz

## audit_log
id uuid pk, project_id uuid fk, document_id uuid fk, action text, diff_json jsonb,
actor_user_id uuid fk, created_at timestamptz

## integrations
id uuid pk, org_id uuid fk, api_type text, api_key_meta jsonb, created_at timestamptz

## entities_corpus  - единый источник данных
id uuid pk, project_id uuid fk, entity_type text, entity_key text, entity_value jsonb,
source_document text, last_modified timestamptz, modified_by uuid fk

## document_links - зависимости между документами
id uuid pk, source_doc_id uuid fk, target_doc_id uuid fk, linked_entities text[], sync_enabled bool, created_at timestamptz

## validation_rules - правила валидации
id uuid pk, document_type text, rule_name text, rule_description text,
section_ref text, check_type text, is_active bool, created_at timestamptz

## term_ontology - онтология терминов (openFDA + MedDRA subset)
id uuid pk, term text, source text, code text, parent_code text, level int, created_at timestamptz

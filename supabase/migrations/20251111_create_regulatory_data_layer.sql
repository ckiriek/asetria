-- Migration: Create Regulatory Data Layer
-- Date: 2025-11-11
-- Purpose: Tables for storing normalized regulatory data from external sources (FDA, EMA, PubMed, etc.)
-- Part of: Regulatory Data Agent implementation

-- ============================================================================
-- COMPOUNDS TABLE
-- Canonical compound information (chemical structure, mechanism, properties)
-- ============================================================================
CREATE TABLE compounds (
    inchikey TEXT PRIMARY KEY, -- Canonical identifier from PubChem
    name TEXT NOT NULL,
    synonyms TEXT[], -- Alternative names
    mechanism_of_action TEXT,
    atc_codes TEXT[], -- Anatomical Therapeutic Chemical codes
    molecular_weight NUMERIC,
    molecular_formula TEXT,
    smiles TEXT, -- Simplified molecular-input line-entry system
    chemical_structure_url TEXT,
    
    -- Provenance
    source TEXT NOT NULL, -- 'PubChem', 'ChEMBL', 'DrugBank'
    source_id TEXT, -- External ID (e.g., CID from PubChem)
    source_url TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRODUCTS TABLE
-- Approved drug products (brands, generics) linked to compounds
-- ============================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inchikey TEXT REFERENCES compounds(inchikey) ON DELETE CASCADE,
    
    -- Product identification
    brand_name TEXT NOT NULL,
    generic_name TEXT,
    dosage_form TEXT, -- 'tablet', 'capsule', 'injection'
    strength TEXT, -- '500mg', '1000mg'
    route TEXT, -- 'oral', 'IV', 'subcutaneous'
    
    -- Regulatory information
    region TEXT NOT NULL CHECK (region IN ('US', 'EU', 'UK', 'JP', 'CA')),
    application_number TEXT, -- NDA/ANDA/BLA number (US) or EPAR number (EU)
    approval_date DATE,
    approval_status TEXT CHECK (approval_status IN ('approved', 'withdrawn', 'suspended')),
    
    -- RLD information (for generics)
    is_rld BOOLEAN DEFAULT false, -- Is this a Reference Listed Drug?
    te_code TEXT, -- Therapeutic Equivalence code (AB, AP, etc.)
    
    -- Manufacturer
    manufacturer TEXT,
    
    -- Provenance
    source TEXT NOT NULL, -- 'Drugs@FDA', 'Orange Book', 'EMA EPAR', 'DailyMed'
    source_url TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(application_number, region)
);

-- ============================================================================
-- LABELS TABLE
-- Regulatory labels (FDA SPL, EMA SmPC) with structured sections
-- ============================================================================
CREATE TABLE labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Label metadata
    label_type TEXT CHECK (label_type IN ('FDA_SPL', 'EMA_SmPC', 'MHRA_SmPC')),
    effective_date DATE,
    version TEXT,
    
    -- Structured sections (JSONB for flexibility)
    sections JSONB NOT NULL, -- {indications, dosage, contraindications, warnings, adverse_reactions, clinical_pharmacology, etc.}
    
    -- Full text (for search)
    full_text TEXT,
    
    -- Provenance
    source TEXT NOT NULL, -- 'DailyMed', 'openFDA', 'EMA EPAR'
    source_url TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')) DEFAULT 'high',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NONCLINICAL_SUMMARIES TABLE
-- Nonclinical data (PK, PD, Tox, Genotox, Carcinogenicity, Repro)
-- ============================================================================
CREATE TABLE nonclinical_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inchikey TEXT REFERENCES compounds(inchikey) ON DELETE CASCADE,
    
    -- Nonclinical data (JSONB for structured storage)
    pharmacology JSONB, -- {mechanism, receptor_binding, in_vitro_studies}
    pharmacokinetics JSONB, -- {absorption, distribution, metabolism, excretion, species}
    toxicology JSONB, -- {acute_tox, repeat_dose_tox, noael, species}
    genotoxicity JSONB, -- {ames_test, micronucleus, chromosome_aberration}
    carcinogenicity JSONB, -- {species, duration, findings}
    reproductive_toxicity JSONB, -- {fertility, embryo_fetal, pre_postnatal}
    
    -- Provenance
    source TEXT NOT NULL, -- 'FDA Review', 'EMA EPAR', 'Literature'
    source_document TEXT, -- Document name/ID
    source_url TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CLINICAL_SUMMARIES TABLE
-- Clinical data (efficacy, safety, PK/PD in humans)
-- ============================================================================
CREATE TABLE clinical_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inchikey TEXT REFERENCES compounds(inchikey) ON DELETE CASCADE,
    
    -- Clinical data (JSONB for structured storage)
    pharmacokinetics JSONB, -- {bioavailability, tmax, t_half, cmax, auc, vss, clearance}
    pharmacodynamics JSONB, -- {dose_response, emax, ed50}
    efficacy JSONB, -- [{endpoint, delta, ci, p_value, study_id}]
    safety JSONB, -- [{ae_type, incidence, severity, study_id}]
    drug_interactions JSONB, -- [{drug, effect, mechanism}]
    special_populations JSONB, -- {elderly, pediatric, renal_impairment, hepatic_impairment}
    
    -- Provenance
    source TEXT NOT NULL, -- 'FDA Review', 'EMA EPAR', 'ClinicalTrials.gov', 'Literature'
    source_document TEXT,
    source_url TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRIALS TABLE
-- Clinical trial information from ClinicalTrials.gov, EudraCT
-- ============================================================================
CREATE TABLE trials (
    nct_id TEXT PRIMARY KEY, -- NCT number or EudraCT number
    inchikey TEXT REFERENCES compounds(inchikey) ON DELETE CASCADE,
    
    -- Trial metadata
    title TEXT,
    phase TEXT,
    status TEXT,
    enrollment INT,
    start_date DATE,
    completion_date DATE,
    
    -- Study design (JSONB)
    design JSONB, -- {allocation, intervention_model, masking, primary_purpose}
    
    -- Arms and interventions
    arms JSONB, -- [{arm_label, arm_type, description, intervention}]
    
    -- Outcomes
    outcomes_primary JSONB, -- [{measure, time_frame, description}]
    outcomes_secondary JSONB,
    
    -- Results (if available)
    results JSONB, -- {participant_flow, baseline, outcome_measures, adverse_events}
    
    -- Provenance
    source TEXT NOT NULL, -- 'ClinicalTrials.gov', 'EudraCT'
    source_url TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADVERSE_EVENTS TABLE
-- Adverse events data (MedDRA normalized)
-- ============================================================================
CREATE TABLE adverse_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inchikey TEXT REFERENCES compounds(inchikey) ON DELETE CASCADE,
    
    -- Study/population context
    study_id TEXT, -- NCT ID or internal study ID
    population_description TEXT,
    arm TEXT, -- Treatment arm
    n INT, -- Number of subjects in arm
    
    -- MedDRA coding
    soc TEXT, -- System Organ Class
    soc_code TEXT,
    pt TEXT NOT NULL, -- Preferred Term
    pt_code TEXT,
    
    -- Event data
    incidence_n INT, -- Number of events
    incidence_pct NUMERIC, -- Percentage
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life-threatening', 'fatal')),
    serious BOOLEAN,
    related BOOLEAN, -- Related to study drug
    
    -- Statistical comparison
    control_arm TEXT,
    control_n INT,
    control_incidence_pct NUMERIC,
    risk_ratio NUMERIC,
    ci_95_lower NUMERIC,
    ci_95_upper NUMERIC,
    p_value NUMERIC,
    
    -- Provenance
    source TEXT NOT NULL, -- 'FDA Label', 'EMA EPAR', 'ClinicalTrials.gov', 'FAERS'
    source_url TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LITERATURE TABLE
-- PubMed articles and references
-- ============================================================================
CREATE TABLE literature (
    pmid TEXT PRIMARY KEY, -- PubMed ID
    inchikey TEXT REFERENCES compounds(inchikey) ON DELETE CASCADE,
    
    -- Article metadata
    title TEXT NOT NULL,
    authors TEXT[],
    journal TEXT,
    publication_date DATE,
    volume TEXT,
    issue TEXT,
    pages TEXT,
    doi TEXT,
    
    -- Content
    abstract TEXT,
    keywords TEXT[],
    mesh_terms TEXT[], -- Medical Subject Headings
    
    -- Relevance
    relevance_score NUMERIC, -- 0-1 score from search
    
    -- Provenance
    source TEXT NOT NULL DEFAULT 'PubMed',
    source_url TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INGESTION_LOGS TABLE
-- Audit trail for Regulatory Data Agent operations
-- ============================================================================
CREATE TABLE ingestion_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Operation metadata
    operation_type TEXT NOT NULL, -- 'enrich', 'update', 'resolve'
    inchikey TEXT, -- Target compound
    source_adapter TEXT NOT NULL, -- 'openFDA', 'PubChem', 'ClinicalTrials', etc.
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'partial')),
    error_code TEXT, -- E101_ENRICH_TIMEOUT, E301_IDENTITY_UNRESOLVED, etc.
    error_message TEXT,
    
    -- Metrics
    records_fetched INT,
    records_inserted INT,
    records_updated INT,
    duration_ms INT,
    
    -- Provenance
    triggered_by TEXT, -- 'user', 'scheduler', 'api'
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Compounds
CREATE INDEX idx_compounds_name ON compounds(name);
CREATE INDEX idx_compounds_atc ON compounds USING GIN(atc_codes);
CREATE INDEX idx_compounds_updated ON compounds(updated_at);

-- Products
CREATE INDEX idx_products_inchikey ON products(inchikey);
CREATE INDEX idx_products_brand_name ON products(brand_name);
CREATE INDEX idx_products_application_number ON products(application_number);
CREATE INDEX idx_products_region ON products(region);
CREATE INDEX idx_products_is_rld ON products(is_rld) WHERE is_rld = true;

-- Labels
CREATE INDEX idx_labels_product ON labels(product_id);
CREATE INDEX idx_labels_effective_date ON labels(effective_date DESC);
CREATE INDEX idx_labels_sections ON labels USING GIN(sections);
CREATE INDEX idx_labels_full_text ON labels USING GIN(to_tsvector('english', full_text));

-- Nonclinical summaries
CREATE INDEX idx_nonclinical_inchikey ON nonclinical_summaries(inchikey);

-- Clinical summaries
CREATE INDEX idx_clinical_inchikey ON clinical_summaries(inchikey);

-- Trials
CREATE INDEX idx_trials_inchikey ON trials(inchikey);
CREATE INDEX idx_trials_phase ON trials(phase);
CREATE INDEX idx_trials_status ON trials(status);

-- Adverse events
CREATE INDEX idx_ae_inchikey ON adverse_events(inchikey);
CREATE INDEX idx_ae_soc ON adverse_events(soc);
CREATE INDEX idx_ae_pt ON adverse_events(pt);
CREATE INDEX idx_ae_study ON adverse_events(study_id);

-- Literature
CREATE INDEX idx_literature_inchikey ON literature(inchikey);
CREATE INDEX idx_literature_date ON literature(publication_date DESC);
CREATE INDEX idx_literature_relevance ON literature(relevance_score DESC);

-- Ingestion logs
CREATE INDEX idx_ingestion_inchikey ON ingestion_logs(inchikey);
CREATE INDEX idx_ingestion_status ON ingestion_logs(status);
CREATE INDEX idx_ingestion_created ON ingestion_logs(created_at DESC);
CREATE INDEX idx_ingestion_project ON ingestion_logs(project_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at on compounds
CREATE TRIGGER update_compounds_updated_at
    BEFORE UPDATE ON compounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on labels
CREATE TRIGGER update_labels_updated_at
    BEFORE UPDATE ON labels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on nonclinical_summaries
CREATE TRIGGER update_nonclinical_updated_at
    BEFORE UPDATE ON nonclinical_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on clinical_summaries
CREATE TRIGGER update_clinical_updated_at
    BEFORE UPDATE ON clinical_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on trials
CREATE TRIGGER update_trials_updated_at
    BEFORE UPDATE ON trials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on adverse_events
CREATE TRIGGER update_adverse_events_updated_at
    BEFORE UPDATE ON adverse_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on literature
CREATE TRIGGER update_literature_updated_at
    BEFORE UPDATE ON literature
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE compounds IS 'Canonical compound information with chemical structure and mechanism';
COMMENT ON TABLE products IS 'Approved drug products (brands, generics) with regulatory information';
COMMENT ON TABLE labels IS 'Regulatory labels (FDA SPL, EMA SmPC) with structured sections';
COMMENT ON TABLE nonclinical_summaries IS 'Nonclinical data: pharmacology, PK, toxicology, genotoxicity, carcinogenicity';
COMMENT ON TABLE clinical_summaries IS 'Clinical data: PK/PD, efficacy, safety, drug interactions';
COMMENT ON TABLE trials IS 'Clinical trial information from ClinicalTrials.gov, EudraCT';
COMMENT ON TABLE adverse_events IS 'Adverse events data with MedDRA coding';
COMMENT ON TABLE literature IS 'PubMed articles and references';
COMMENT ON TABLE ingestion_logs IS 'Audit trail for Regulatory Data Agent operations';

COMMENT ON COLUMN compounds.inchikey IS 'InChIKey - canonical chemical identifier (primary key)';
COMMENT ON COLUMN products.is_rld IS 'Is this a Reference Listed Drug (for generic comparison)?';
COMMENT ON COLUMN products.te_code IS 'Therapeutic Equivalence code from FDA Orange Book';
COMMENT ON COLUMN adverse_events.soc IS 'MedDRA System Organ Class';
COMMENT ON COLUMN adverse_events.pt IS 'MedDRA Preferred Term';

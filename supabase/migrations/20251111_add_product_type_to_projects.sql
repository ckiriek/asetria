-- Migration: Add Product Type and RLD fields to projects table
-- Date: 2025-11-11
-- Purpose: Support Innovator/Generic/Hybrid modes in Asetria Writer

-- Add product_type column
ALTER TABLE projects
ADD COLUMN product_type TEXT NOT NULL DEFAULT 'innovator'
CHECK (product_type IN ('innovator', 'generic', 'hybrid'));

-- Add compound_name column
ALTER TABLE projects
ADD COLUMN compound_name TEXT;

-- Add RLD (Reference Listed Drug) fields for Generic mode
ALTER TABLE projects
ADD COLUMN rld_brand_name TEXT,
ADD COLUMN rld_application_number TEXT,
ADD COLUMN te_code TEXT;

-- Add inchikey for compound identification (canonical identifier)
ALTER TABLE projects
ADD COLUMN inchikey TEXT;

-- Add enrichment status tracking
ALTER TABLE projects
ADD COLUMN enrichment_status TEXT DEFAULT 'pending'
CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped'));

ALTER TABLE projects
ADD COLUMN enrichment_completed_at TIMESTAMPTZ;

-- Add metadata for enriched data
ALTER TABLE projects
ADD COLUMN enrichment_metadata JSONB;

-- Create index for product_type queries
CREATE INDEX idx_projects_product_type ON projects(product_type);

-- Create index for enrichment_status queries
CREATE INDEX idx_projects_enrichment_status ON projects(enrichment_status);

-- Create index for inchikey lookups
CREATE INDEX idx_projects_inchikey ON projects(inchikey) WHERE inchikey IS NOT NULL;

-- Add comments
COMMENT ON COLUMN projects.product_type IS 'Type of product: innovator (new drug), generic (based on RLD), or hybrid (combination/modified release)';
COMMENT ON COLUMN projects.compound_name IS 'Name of the compound or drug (e.g., Metformin Hydrochloride, AST-256)';
COMMENT ON COLUMN projects.rld_brand_name IS 'Reference Listed Drug brand name (for generic products)';
COMMENT ON COLUMN projects.rld_application_number IS 'FDA/EMA application number for RLD (e.g., NDA020357)';
COMMENT ON COLUMN projects.te_code IS 'Therapeutic Equivalence code from FDA Orange Book (e.g., AB)';
COMMENT ON COLUMN projects.inchikey IS 'InChIKey - canonical chemical identifier from PubChem';
COMMENT ON COLUMN projects.enrichment_status IS 'Status of Regulatory Data Agent enrichment process';
COMMENT ON COLUMN projects.enrichment_completed_at IS 'Timestamp when enrichment was completed';
COMMENT ON COLUMN projects.enrichment_metadata IS 'Metadata about enrichment: sources used, coverage scores, errors';

-- Add drug_class field to projects table for better openFDA search
-- This allows users to specify the drug class or active ingredient
-- which will be used for safety data search in openFDA

ALTER TABLE projects
ADD COLUMN drug_class TEXT;

COMMENT ON COLUMN projects.drug_class IS 'Drug class or active ingredient for safety data search (e.g., "DPP-4 inhibitor", "metformin", "SGLT2 inhibitor")';

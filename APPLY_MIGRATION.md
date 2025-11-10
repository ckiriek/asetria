# 🔧 Apply Migration: Add drug_class field

## Quick Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/qtlpjxjlwrjindgybsfd
   - Navigate to: **SQL Editor**

2. **Run Migration**
   - Click "New Query"
   - Copy-paste this SQL:

```sql
-- Add drug_class field to projects table
ALTER TABLE projects
ADD COLUMN drug_class TEXT;

COMMENT ON COLUMN projects.drug_class IS 'Drug class or active ingredient for safety data search (e.g., "DPP-4 inhibitor", "metformin", "SGLT2 inhibitor")';
```

3. **Execute**
   - Click "Run" (or press Cmd+Enter)
   - ✅ Should see: "Success. No rows returned"

4. **Verify**
   - Go to: **Table Editor** → **projects**
   - Check that `drug_class` column exists

---

### Option 2: Supabase CLI

```bash
# Link to project (if not already linked)
supabase link --project-ref qtlpjxjlwrjindgybsfd

# Push migration
supabase db push

# Or apply specific migration
supabase db push --include-all
```

---

## Verification

### Check column exists:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'drug_class';
```

**Expected result:**
```
column_name | data_type | is_nullable
------------|-----------|------------
drug_class  | text      | YES
```

### Test insert:
```sql
-- Test that new projects can have drug_class
INSERT INTO projects (title, phase, indication, drug_class, org_id)
VALUES ('Test Project', 'Phase 2', 'Test Indication', 'metformin', 
        (SELECT id FROM organizations LIMIT 1))
RETURNING *;
```

---

## Rollback (if needed)

```sql
-- Remove drug_class column
ALTER TABLE projects
DROP COLUMN drug_class;
```

---

## Status

- ✅ Migration file created: `supabase/migrations/00004_add_drug_class_to_projects.sql`
- ✅ Code updated to use `drug_class`
- ✅ UI form updated
- ⏳ **Need to apply migration to database**

---

## After Migration

1. ✅ Create new project with drug_class field
2. ✅ Test "Fetch External Data" with drug_class specified
3. ✅ Verify openFDA returns results
4. ✅ Check IB generation includes safety data

---

**Ready to apply? Go to Supabase Dashboard → SQL Editor!** 🚀

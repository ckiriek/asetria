# 📅 Week 1 Action Plan - Asetria Writer Foundation

**Week:** November 11-17, 2025  
**Phase:** 0 - Foundation & Architecture Setup  
**Goal:** Make critical technical decisions and start implementation

---

## 🎯 Week Objectives

1. ✅ Finalize architecture decisions
2. ✅ Add product type selection to UI
3. ✅ Create first database migrations
4. ✅ Build prototype Intake Agent
5. ✅ Test template engine approach

---

## Monday: Architecture Decisions

### Morning: Technical Stack Review

**Decision 1: Agent Implementation Strategy**

**Options:**
- A) Pure Edge Functions (all agents as Supabase Functions)
- B) Pure API Routes (Next.js API routes)
- C) Hybrid (orchestration in API routes, heavy processing in Edge Functions)

**Recommendation:** **C) Hybrid**

**Rationale:**
```
API Routes (Next.js):
✅ Easy to debug
✅ Fast iteration
✅ Access to Node.js ecosystem
✅ Good for orchestration
❌ Cold starts
❌ Limited execution time

Edge Functions (Supabase):
✅ Scalable
✅ Isolated execution
✅ Long-running tasks
✅ Direct DB access
❌ Deno runtime (different from Node)
❌ Harder to debug

Hybrid Approach:
✅ Best of both worlds
✅ API Routes = orchestration, quick responses
✅ Edge Functions = heavy LLM calls, data processing
✅ Clear separation of concerns
```

**Implementation:**
```
/api/v1/intake → API Route (validates, creates project, triggers agents)
/api/v1/generate → API Route (orchestrates)
  └─> calls Edge Function: generate-document
/api/v1/enrich → API Route (orchestrates)
  └─> calls Edge Function: enrich-data
/api/v1/validate → API Route (orchestrates)
  └─> calls Edge Function: validate-document (already exists!)
```

---

**Decision 2: Template Engine**

**Options:**
- A) Handlebars
- B) Mustache
- C) Custom (string interpolation)
- D) React Server Components

**Recommendation:** **A) Handlebars**

**Rationale:**
```
Handlebars:
✅ Logic-less templates
✅ Helpers for formatting
✅ Partials for reuse
✅ Well-documented
✅ Works in both Node and Deno
✅ {{#if}}, {{#each}} for conditionals

Example:
{{#if generic_mode}}
  No new nonclinical studies were conducted.
{{else}}
  {{#each nonclinical.studies}}
    Study {{this.id}}: {{this.findings}}
  {{/each}}
{{/if}}
```

**Test Implementation:**
```typescript
import Handlebars from 'handlebars'

const template = Handlebars.compile(`
## 5 NONCLINICAL STUDIES
{{#if generic_mode}}
No new nonclinical studies were conducted for {{compound.name}}.
{{else}}
### 5.1 Pharmacology
{{#each nonclinical.pharmacology}}
In {{this.species}}, {{compound.name}} demonstrated {{this.effect}}.
{{/each}}
{{/if}}
`)

const output = template({
  generic_mode: false,
  compound: { name: 'AST-256' },
  nonclinical: {
    pharmacology: [
      { species: 'rat', effect: 'dose-dependent glucose reduction' }
    ]
  }
})
```

---

**Decision 3: Data Storage Strategy**

**Recommendation:** **Postgres (Supabase) + Redis Cache**

```
Postgres (Supabase):
- All structured data (compounds, products, labels, trials)
- JSONB for flexible fields
- Full-text search
- RLS for security

Redis (Upstash or Supabase Redis):
- API response cache (TTL: 7-30 days)
- Agent job queue
- Rate limiting counters

S3-compatible (Supabase Storage):
- PDF/DOCX files
- Uploaded reports
- Generated documents
```

---

### Afternoon: Database Schema Design

**Task:** Create migration for new tables

**Priority 1: Core Tables (This Week)**
```sql
-- compounds.sql
CREATE TABLE compounds (
  inchikey TEXT PRIMARY KEY,
  preferred_name TEXT NOT NULL,
  synonyms TEXT[],
  mechanism TEXT,
  atc_codes TEXT[],
  molecular_formula TEXT,
  mw FLOAT,
  smiles TEXT,
  cas TEXT,
  pubchem_cid TEXT,
  chembl_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  provenance JSONB
);

CREATE INDEX idx_compounds_name ON compounds(preferred_name);
CREATE INDEX idx_compounds_cas ON compounds(cas);

-- products.sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inchikey TEXT REFERENCES compounds(inchikey),
  brand_name TEXT,
  dosage_forms TEXT[],
  route TEXT[],
  strengths TEXT[],
  application_number TEXT,
  rld BOOLEAN DEFAULT FALSE,
  te_code TEXT,
  manufacturer TEXT,
  region TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  provenance JSONB
);

CREATE INDEX idx_products_application_number ON products(application_number);
CREATE INDEX idx_products_brand_name ON products(brand_name);

-- Add to projects table
ALTER TABLE projects ADD COLUMN product_type TEXT DEFAULT 'innovator';
ALTER TABLE projects ADD COLUMN rld_application_number TEXT;
ALTER TABLE projects ADD COLUMN te_code TEXT;
ALTER TABLE projects ADD COLUMN inchikey TEXT REFERENCES compounds(inchikey);
```

**Priority 2: Enrichment Tables (Next Week)**
```sql
-- labels.sql
-- nonclinical_summaries.sql
-- clinical_summaries.sql
-- trials.sql
-- literature.sql
-- adverse_events.sql
```

---

## Tuesday: UI - Product Type Selection

### Task: Add Product Type to Project Creation

**File:** `/app/dashboard/projects/new/page.tsx`

**Changes:**
```typescript
// Add to form state
const [productType, setProductType] = useState<'innovator' | 'generic' | 'hybrid'>('innovator')
const [rldInfo, setRldInfo] = useState({ brandName: '', applicationNumber: '', teCode: '' })

// Add to form UI
<div className="space-y-4">
  <Label>Product Type</Label>
  <RadioGroup value={productType} onValueChange={setProductType}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="innovator" id="innovator" />
      <Label htmlFor="innovator">
        Innovator / Original Compound
        <p className="text-sm text-gray-500">New drug with full nonclinical and clinical data</p>
      </Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="generic" id="generic" />
      <Label htmlFor="generic">
        Generic Drug
        <p className="text-sm text-gray-500">Based on existing approved product (RLD)</p>
      </Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="hybrid" id="hybrid" />
      <Label htmlFor="hybrid">
        Hybrid / Combination Product
        <p className="text-sm text-gray-500">Modified release or fixed-dose combination</p>
      </Label>
    </div>
  </RadioGroup>

  {/* Conditional fields for Generic */}
  {productType === 'generic' && (
    <Card className="p-4 bg-blue-50">
      <h3 className="font-semibold mb-2">Reference Listed Drug (RLD) Information</h3>
      <div className="space-y-2">
        <Input
          placeholder="Brand Name (e.g., GLUCOPHAGE)"
          value={rldInfo.brandName}
          onChange={(e) => setRldInfo({...rldInfo, brandName: e.target.value})}
        />
        <Input
          placeholder="Application Number (e.g., NDA020357)"
          value={rldInfo.applicationNumber}
          onChange={(e) => setRldInfo({...rldInfo, applicationNumber: e.target.value})}
        />
        <Input
          placeholder="TE Code (e.g., AB) - Optional"
          value={rldInfo.teCode}
          onChange={(e) => setRldInfo({...rldInfo, teCode: e.target.value})}
        />
        <p className="text-xs text-gray-600">
          💡 We'll automatically fetch data from FDA/EMA for this reference product
        </p>
      </div>
    </Card>
  )}
</div>
```

**API Update:** `/app/api/projects/route.ts`
```typescript
// Add to POST handler
const { product_type, rld_application_number, te_code } = await request.json()

const { data: project } = await supabase
  .from('projects')
  .insert({
    ...existingFields,
    product_type,
    rld_application_number,
    te_code
  })
```

---

## Wednesday: First Migration & Seeding

### Morning: Run Migrations

**Task:** Create and apply first migrations

```bash
# Create migration files
supabase/migrations/20251111_add_compounds_table.sql
supabase/migrations/20251111_add_products_table.sql
supabase/migrations/20251111_add_product_type_to_projects.sql
```

**Apply locally:**
```bash
npx supabase db reset
npx supabase db push
```

**Verify:**
```sql
SELECT * FROM compounds LIMIT 1;
SELECT * FROM products LIMIT 1;
SELECT product_type FROM projects LIMIT 1;
```

---

### Afternoon: Seed Test Data

**File:** `scripts/seed-test-compounds.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const testCompounds = [
  {
    inchikey: 'XZWYZXLIPXDOLR-UHFFFAOYSA-N',
    preferred_name: 'Metformin Hydrochloride',
    synonyms: ['Metformin HCl', 'Glucophage'],
    mechanism: 'AMPK activator; reduces hepatic gluconeogenesis',
    atc_codes: ['A10BA02'],
    molecular_formula: 'C4H11N5',
    mw: 129.16,
    cas: '1115-70-4',
    pubchem_cid: '14219',
    provenance: { source: 'manual_seed', date: new Date().toISOString() }
  },
  {
    inchikey: 'ZZVUWRFHKOJYTH-UHFFFAOYSA-N',
    preferred_name: 'Aspirin',
    synonyms: ['Acetylsalicylic acid', 'ASA'],
    mechanism: 'COX-1/COX-2 inhibitor',
    atc_codes: ['N02BA01', 'B01AC06'],
    molecular_formula: 'C9H8O4',
    mw: 180.16,
    cas: '50-78-2',
    pubchem_cid: '2244',
    provenance: { source: 'manual_seed', date: new Date().toISOString() }
  }
]

const testProducts = [
  {
    inchikey: 'XZWYZXLIPXDOLR-UHFFFAOYSA-N',
    brand_name: 'GLUCOPHAGE',
    dosage_forms: ['TABLET'],
    route: ['ORAL'],
    strengths: ['500 MG', '850 MG', '1000 MG'],
    application_number: 'NDA020357',
    rld: true,
    te_code: 'AB',
    manufacturer: 'Bristol-Myers Squibb',
    region: 'US',
    status: 'approved',
    provenance: { source: 'fda_orangebook', date: new Date().toISOString() }
  }
]

async function seed() {
  // Insert compounds
  const { error: compoundsError } = await supabase
    .from('compounds')
    .insert(testCompounds)
  
  if (compoundsError) console.error('Compounds error:', compoundsError)
  else console.log('✅ Seeded', testCompounds.length, 'compounds')

  // Insert products
  const { error: productsError } = await supabase
    .from('products')
    .insert(testProducts)
  
  if (productsError) console.error('Products error:', productsError)
  else console.log('✅ Seeded', testProducts.length, 'products')
}

seed()
```

**Run:**
```bash
npx tsx scripts/seed-test-compounds.ts
```

---

## Thursday: Intake Agent Prototype

### Task: Build First Agent

**File:** `supabase/functions/intake-agent/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IntakePayload {
  project_name: string
  product_type: 'innovator' | 'generic' | 'hybrid'
  region: string
  doc_types: string[]
  compound: {
    name: string
    indication?: string
  }
  rld?: {
    brand_name: string
    application_number: string
    te_code?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const payload: IntakePayload = await req.json()

    // 1. Validate payload
    const validation = validateIntake(payload)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. Determine enabled agents based on product type
    const enabledAgents = determineAgents(payload.product_type)

    // 3. Check if compound exists, if not create placeholder
    let inchikey: string | null = null
    if (payload.product_type === 'generic' && payload.rld) {
      // For generic, we'll enrich later
      inchikey = null
    }

    // 4. Create project
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .insert({
        title: payload.project_name,
        product_type: payload.product_type,
        rld_application_number: payload.rld?.application_number,
        te_code: payload.rld?.te_code,
        indication: payload.compound.indication,
        inchikey,
        created_by: req.headers.get('x-user-id'), // from auth
      })
      .select()
      .single()

    if (projectError) throw projectError

    // 5. If generic, trigger enrichment
    if (payload.product_type === 'generic') {
      await supabaseClient.functions.invoke('enrich-data', {
        body: {
          project_id: project.id,
          compound_name: payload.compound.name,
          rld_application_number: payload.rld?.application_number,
        }
      })
    }

    return new Response(
      JSON.stringify({
        project_id: project.id,
        status: 'intake_validated',
        enabled_agents: enabledAgents,
        message: `Project created. ${payload.product_type === 'generic' ? 'Data enrichment started.' : 'Ready for document generation.'}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function validateIntake(payload: IntakePayload): { valid: boolean; errors?: string[] } {
  const errors: string[] = []

  if (!payload.project_name) errors.push('project_name is required')
  if (!payload.product_type) errors.push('product_type is required')
  if (!payload.region) errors.push('region is required')
  if (!payload.compound?.name) errors.push('compound.name is required')

  if (payload.product_type === 'generic') {
    if (!payload.rld?.brand_name) errors.push('rld.brand_name is required for generic')
    if (!payload.rld?.application_number) errors.push('rld.application_number is required for generic')
  }

  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined }
}

function determineAgents(productType: string): string[] {
  switch (productType) {
    case 'innovator':
      return ['Intake', 'Composer', 'Writer', 'Validator', 'Assembler']
    case 'generic':
      return ['Intake', 'DataEnrichment', 'Composer_Generic', 'Writer_Generic', 'Validator_Generic', 'Assembler']
    case 'hybrid':
      return ['Intake', 'DataEnrichment', 'Composer_Hybrid', 'Writer_Hybrid', 'Validator_Hybrid', 'Assembler']
    default:
      return ['Intake', 'Composer', 'Writer', 'Validator', 'Assembler']
  }
}
```

**Deploy:**
```bash
npx supabase functions deploy intake-agent --project-ref qtlpjxjlwrjindgybsfd
```

**Test:**
```bash
curl -X POST https://qtlpjxjlwrjindgybsfd.supabase.co/functions/v1/intake-agent \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "METFORMIN_GENERIC_TEST",
    "product_type": "generic",
    "region": "US",
    "doc_types": ["IB"],
    "compound": {
      "name": "Metformin Hydrochloride",
      "indication": "Type 2 Diabetes Mellitus"
    },
    "rld": {
      "brand_name": "GLUCOPHAGE",
      "application_number": "NDA020357",
      "te_code": "AB"
    }
  }'
```

---

## Friday: Template Engine Test

### Task: Create First Template

**File:** `lib/templates/ib-generic-section-6.hbs`

```handlebars
## 6 NONCLINICAL STUDIES

No new nonclinical studies were conducted for {{compound.name}} Generic. The pharmacological and toxicological properties of {{compound.name}} are well established and have been previously described in the Investigator's Brochure of the reference product ({{rld.brand_name}}, {{rld.manufacturer}}, {{rld.year}}) and in published literature {{#each references.nonclinical}}[{{this.id}}]{{#unless @last}}, {{/unless}}{{/each}}.

### 6.1 Summary from Literature

**Pharmacology**

{{compound.name}} is a {{compound.mechanism}}. {{#if nonclinical.pharmacology.summary}}{{nonclinical.pharmacology.summary}}{{else}}The primary pharmacodynamic effects have been well characterized in preclinical models.{{/if}}

**Pharmacokinetics**

{{#if nonclinical.pk.summary}}
{{nonclinical.pk.summary}}
{{else}}
Preclinical pharmacokinetic studies demonstrated {{compound.name}} is absorbed following oral administration with bioavailability of approximately {{nonclinical.pk.bioavailability_pct}}%.
{{/if}}

**Toxicology**

{{#if nonclinical.tox.summary}}
{{nonclinical.tox.summary}}
{{else}}
Repeat-dose toxicity studies in rodents and non-rodents showed no significant findings at clinically relevant exposures. {{compound.name}} was negative in genotoxicity assays and showed no carcinogenic potential in long-term studies.
{{/if}}

### 6.2 References

The nonclinical profile of {{compound.name}} is supported by the following key references:

{{#each references.nonclinical}}
{{this.id}}. {{this.citation}}
{{/each}}

For detailed nonclinical data, refer to the {{rld.brand_name}} Investigator's Brochure ({{rld.ib_reference}}) and the European Public Assessment Report (EPAR) for {{rld.brand_name}} ({{rld.epar_reference}}).
```

**Test Renderer:** `scripts/test-template.ts`

```typescript
import Handlebars from 'handlebars'
import fs from 'fs'

const templateSource = fs.readFileSync('lib/templates/ib-generic-section-6.hbs', 'utf-8')
const template = Handlebars.compile(templateSource)

const testData = {
  compound: {
    name: 'Metformin Hydrochloride',
    mechanism: 'biguanide antihyperglycemic agent that improves glucose tolerance by decreasing hepatic glucose production and increasing peripheral glucose uptake'
  },
  rld: {
    brand_name: 'GLUCOPHAGE',
    manufacturer: 'Bristol-Myers Squibb',
    year: '2019',
    ib_reference: 'GLUCOPHAGE IB v5.0, 2019',
    epar_reference: 'EMA/CHMP/123456/2019'
  },
  nonclinical: {
    pharmacology: {
      summary: 'In vitro and in vivo studies demonstrate that metformin decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization.'
    },
    pk: {
      bioavailability_pct: '50-60',
      summary: 'Following oral administration, metformin is absorbed with peak plasma concentrations occurring within 2-3 hours. The drug is not bound to plasma proteins and is excreted unchanged in urine.'
    },
    tox: {
      summary: 'In repeat-dose toxicity studies up to 900 mg/kg/day in rats and 300 mg/kg/day in dogs, no treatment-related adverse findings were observed. Metformin was negative in the Ames test, mouse lymphoma assay, and in vivo micronucleus test. No evidence of carcinogenicity was found in 2-year studies in rats and mice.'
    }
  },
  references: {
    nonclinical: [
      {
        id: '1',
        citation: 'Bailey CJ, Turner RC. Metformin. N Engl J Med. 1996;334(9):574-579.'
      },
      {
        id: '2',
        citation: 'European Medicines Agency. EPAR for metformin. EMA/CHMP/123456/2019.'
      },
      {
        id: '3',
        citation: 'FDA. Metformin hydrochloride NDA 020357 Review. 1994.'
      }
    ]
  }
}

const output = template(testData)
console.log(output)

// Save to file
fs.writeFileSync('test-output-section-6.md', output)
console.log('✅ Template rendered successfully to test-output-section-6.md')
```

**Run:**
```bash
npx tsx scripts/test-template.ts
```

**Expected Output:** `test-output-section-6.md`
```markdown
## 6 NONCLINICAL STUDIES

No new nonclinical studies were conducted for Metformin Hydrochloride Generic. The pharmacological and toxicological properties of Metformin Hydrochloride are well established and have been previously described in the Investigator's Brochure of the reference product (GLUCOPHAGE, Bristol-Myers Squibb, 2019) and in published literature [1], [2], [3].

### 6.1 Summary from Literature

**Pharmacology**

Metformin Hydrochloride is a biguanide antihyperglycemic agent that improves glucose tolerance by decreasing hepatic glucose production and increasing peripheral glucose uptake. In vitro and in vivo studies demonstrate that metformin decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization.

...
```

---

## Weekend: Documentation & Review

### Saturday: Document Decisions

**Task:** Update architecture docs with decisions made

**Files to update:**
- `ASETRIA_WRITER_IMPLEMENTATION_PLAN.md` (add decision log)
- `README.md` (add new architecture section)
- `ARCHITECTURE.md` (create new file with diagrams)

---

### Sunday: Week Review & Planning

**Review Checklist:**
- [ ] All architecture decisions documented
- [ ] Product type selection UI working
- [ ] First migrations applied
- [ ] Test data seeded
- [ ] Intake Agent deployed and tested
- [ ] Template engine validated

**Prepare for Week 2:**
- [ ] Plan remaining migrations (labels, trials, etc.)
- [ ] Design first API adapter (openFDA)
- [ ] Sketch Composer Agent logic
- [ ] Review template structure for all doc types

---

## 📊 Success Metrics (Week 1)

- ✅ 3 architecture decisions finalized
- ✅ Product type selection in UI (functional)
- ✅ 3 new database tables created
- ✅ 2 test compounds seeded
- ✅ Intake Agent deployed (basic version)
- ✅ Template engine tested (1 section)
- ✅ 0 blockers

---

## 🚧 Potential Blockers

1. **Supabase Edge Functions quota**
   - Mitigation: Monitor usage, upgrade plan if needed

2. **Template complexity**
   - Mitigation: Start simple, iterate

3. **Migration conflicts**
   - Mitigation: Test locally first, backup before prod

---

## 📞 Team Sync Points

- **Monday 10am:** Architecture decisions meeting
- **Wednesday 2pm:** Migration review
- **Friday 4pm:** Week retrospective

---

**Status:** 📋 Ready to Execute

**Owner:** Backend + ML Engineer

**Next Review:** Friday EOD

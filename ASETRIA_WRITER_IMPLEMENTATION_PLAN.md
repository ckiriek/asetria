# 🏗️ Asetria Writer - Implementation Roadmap

**Last Updated:** 2025-11-10 22:40 UTC  
**Status:** Planning Phase (Updated with Regulatory Data Agent)  
**Target MVP:** 20 weeks (5 months)

---

## 🎯 Executive Summary

Asetria Writer transforms from a simple document generator into a **production-grade regulatory document factory** with:

- **Multi-agent architecture** (7 specialized agents, including dedicated Regulatory Data Agent)
- **Dual-mode operation** (Innovator vs Generic)
- **External data enrichment** (FDA, EMA, PubMed, ClinicalTrials.gov via Regulatory Data Agent)
- **Template-driven generation** (ICH/FDA compliant)
- **Quality validation** (automated compliance checks)
- **Professional export** (DOCX/PDF with house style)

---

## 📊 Current State vs Target State

### Current (As-Is)
```
User Input → Single LLM → Basic Document → Manual Review
```
- ✅ Basic document generation (IB, Protocol, ICF, Synopsis)
- ✅ Project management
- ✅ External data fetching (ClinicalTrials, PubMed, openFDA)
- ✅ Validation rules framework
- ⚠️ Single-pass generation (no specialization)
- ⚠️ No data normalization
- ⚠️ No template system
- ⚠️ No multi-agent coordination

### Target (To-Be)
```
User Input → Intake Agent → Regulatory Data Agent → Composer → Writer → Validator → Assembler → Export
```
- ✅ Multi-agent specialized pipeline (7 agents)
- ✅ **Regulatory Data Agent** (dedicated external data enrichment microservice)
- ✅ Normalized data layer (compounds, products, labels, trials)
- ✅ Template-driven generation (10-15 sections per doc)
- ✅ Dual-mode (Innovator/Generic)
- ✅ External API enrichment (automatic via Regulatory Data Agent)
- ✅ Quality validation (ICH/FDA checklists)
- ✅ Professional export (DOCX/PDF)
- ✅ Audit trail & versioning with provenance tracking

---

## 🗺️ Implementation Phases

## **Phase 0: Foundation & Architecture Setup**
**Duration:** Week 1-2  
**Goal:** Establish technical foundation and decision points

### Key Decisions
1. **Product Type Selection**
   - Add `product_type` field to projects table
   - Values: `innovator`, `generic`, `hybrid`
   - UI: Radio buttons at project creation
   - Default: `innovator` for backward compatibility

2. **Database Schema Evolution**
   ```sql
   -- New tables
   CREATE TABLE compounds (...)
   CREATE TABLE products (...)
   CREATE TABLE labels (...)
   CREATE TABLE nonclinical_summaries (...)
   CREATE TABLE clinical_summaries (...)
   CREATE TABLE trials (...)
   CREATE TABLE literature (...)
   CREATE TABLE adverse_events (...)
   ```

3. **Agent Architecture**
   - Edge Functions vs API Routes?
   - **Decision:** Hybrid approach
     - Heavy processing: Edge Functions (Composer, Writer, Validator)
     - Orchestration: API Routes
     - Data enrichment: Background jobs (Supabase Functions + Cron)

### Deliverables
- [ ] Architecture decision document
- [ ] Database migration plan (v2.0 schema)
- [ ] Agent communication protocol (JSON contracts)
- [ ] Project type selection UI mockup
- [ ] Technical stack confirmation

---

## **Phase 1: Data Layer & Schema Implementation**
**Duration:** Week 2-4  
**Goal:** Build normalized data foundation

### 1.1 Database Schema
```sql
-- Core entities
compounds (inchikey PK, name, mechanism, molecular data)
products (id PK, inchikey FK, brand_name, dosage_forms, application_number)
labels (id PK, product_id FK, sections JSONB, effective_date)
nonclinical_summaries (id PK, inchikey FK, pk/tox/genotox JSONB)
clinical_summaries (id PK, inchikey FK, efficacy/safety JSONB)
trials (nct_id PK, inchikey FK, design/outcomes JSONB)
literature (pmid PK, title, abstract, journal)
adverse_events (id PK, inchikey FK, soc, pt, incidence)

-- Linking
project_compounds (project_id, inchikey)
project_trials (project_id, nct_id)
project_literature (project_id, pmid)
```

### 1.2 Intake Schema
- JSON Schema for project intake form
- Validation rules per product type
- Required fields matrix

### 1.3 Migrations
- Create all new tables
- Add `product_type` to projects
- Add `rld_application_number` to projects
- Add `te_code` to projects
- Preserve existing data

### Deliverables
- [ ] SQL migration files (20+ tables)
- [ ] Zod schemas for TypeScript validation
- [ ] Intake form JSON Schema
- [ ] Data seeding scripts (test compounds)
- [ ] Migration testing checklist

---

## **Phase 2: External API Integration & Enrichment**
**Duration:** Week 4-6  
**Goal:** Build Data Enrichment Agent

### 2.1 API Adapters
Each adapter returns normalized JSON:

**openFDA Adapter**
```typescript
interface OpenFDAAdapter {
  fetchLabel(applicationNumber: string): Promise<Label>
  fetchAdverseEvents(substance: string): Promise<AdverseEvent[]>
}
```

**EMA EPAR Adapter**
```typescript
interface EPARAdapter {
  fetchAssessment(eparId: string): Promise<{
    nonclinical: NonclinicalSummary
    clinical: ClinicalSummary
    references: Reference[]
  }>
}
```

**ClinicalTrials.gov Adapter**
```typescript
interface ClinicalTrialsAdapter {
  searchTrials(substance: string, indication: string): Promise<Trial[]>
  fetchTrialDetails(nctId: string): Promise<TrialDetail>
}
```

**PubMed Adapter**
```typescript
interface PubMedAdapter {
  searchLiterature(query: string, limit: number): Promise<Literature[]>
}
```

**PubChem/ChEMBL Adapter**
```typescript
interface ChemicalAdapter {
  fetchCompoundData(name: string): Promise<Compound>
}
```

### 2.2 Data Enrichment Agent
```typescript
class DataEnrichmentAgent {
  async enrich(projectId: string): Promise<EnrichmentResult> {
    // 1. Identify compound
    // 2. Fetch from all sources in parallel
    // 3. Normalize and deduplicate
    // 4. Store in database
    // 5. Return summary
  }
}
```

### 2.3 Caching Strategy
- Redis cache for API responses (TTL: 7-30 days)
- Postgres materialized views for aggregations
- Nightly sync jobs for updates

### Deliverables
- [ ] 5 API adapter implementations
- [ ] Data Enrichment Agent (Edge Function)
- [ ] Caching layer (Redis + Postgres)
- [ ] Rate limiting & retry logic
- [ ] API integration tests
- [ ] Enrichment dashboard UI

---

## **Phase 3: Multi-Agent System Core**
**Duration:** Week 6-10  
**Goal:** Build 6 specialized agents

### 3.1 Agent 1: Intake Agent
**Purpose:** Validate input, determine mode, activate pipeline

```typescript
interface IntakeAgent {
  validate(payload: ProjectIntake): ValidationResult
  determineMode(productType: string): AgentPipeline
  createProject(payload: ProjectIntake): Project
}
```

**Logic:**
- Validate against JSON Schema
- Check required fields per product type
- Activate appropriate agent pipeline
- Return project_id and enabled_agents

### 3.2 Agent 2: Composer Agent
**Purpose:** Build document structure, determine data needs

```typescript
interface ComposerAgent {
  composeStructure(
    docType: DocumentType,
    productType: ProductType,
    region: Region
  ): DocumentOutline
}

interface DocumentOutline {
  sections: Section[]
  tables: TableSpec[]
  figures: FigureSpec[]
  placeholders: Placeholder[]
}
```

**Templates:**
- IB_Innovator_Template (12 sections)
- IB_Generic_Template (8 sections, bridge mode)
- Protocol_Template (16 sections)
- ICF_Template (12 sections)
- Synopsis_Template (10 sections)

### 3.3 Agent 3: Writer Agent
**Purpose:** Generate narrative text per section

```typescript
interface WriterAgent {
  writeSection(
    section: Section,
    data: NormalizedData,
    style: WritingStyle
  ): string
}

interface WritingStyle {
  tone: 'formal' | 'patient-friendly'
  targetWords: number
  includeReferences: boolean
  crossReferences: boolean
}
```

**Modes:**
- Writer_Innovator: Full narrative from sponsor data
- Writer_Generic: Literature-based with references
- Writer_ICF: Patient-friendly language (6-8th grade)

### 3.4 Agent 4: Validator Agent
**Purpose:** Check compliance and consistency

```typescript
interface ValidatorAgent {
  validate(
    document: Document,
    rules: ValidationRule[]
  ): ValidationReport
}

interface ValidationReport {
  score: number
  passed: string[]
  warnings: Warning[]
  errors: Error[]
  suggestions: Suggestion[]
}
```

**Checks:**
- ICH structure compliance
- Data consistency (doses, populations, units)
- Reference completeness
- Cross-reference integrity
- Regulatory requirements (per region)
- For Generic: RLD/TE-code validation

### 3.5 Agent 5: Assembler Agent
**Purpose:** Combine sections, generate TOC, numbering

```typescript
interface AssemblerAgent {
  assemble(
    sections: Section[],
    tables: Table[],
    figures: Figure[],
    references: Reference[]
  ): AssembledDocument
}
```

**Tasks:**
- Merge sections in order
- Generate Table of Contents
- Auto-number tables/figures
- Resolve cross-references
- Generate abbreviations list
- Format references (numbered)

### 3.6 Agent 6: Reviewer Agent (Human-in-Loop)
**Purpose:** Log human feedback, trigger regeneration

```typescript
interface ReviewerAgent {
  logReview(
    documentId: string,
    comments: Comment[]
  ): ReviewLog
  
  triggerRegeneration(
    documentId: string,
    changes: Change[]
  ): RegenerationJob
}
```

### Deliverables
- [ ] 6 Agent implementations (Edge Functions)
- [ ] Agent orchestration API
- [ ] Template system (Handlebars/Mustache)
- [ ] Agent communication protocol
- [ ] Agent testing framework
- [ ] Agent monitoring dashboard

---

## **Phase 4: Document Templates & Generation**
**Duration:** Week 10-14  
**Goal:** Create production-ready templates

### 4.1 Template Structure
Each template is a Handlebars file with:
- Section headers with numbering
- Data placeholders `{{compound.name}}`
- Conditional blocks `{{#if generic_mode}}`
- Table specifications
- Reference markers

### 4.2 IB Templates

**IB_Innovator_Template.hbs**
```handlebars
## 1 TITLE PAGE
{{project.title}}
Protocol: {{project.code}}

## 2 TABLE OF CONTENTS
[Auto-generated]

## 3 SUMMARY
{{compound.name}} is a {{compound.mechanism}}...

## 5 PHYSICAL, CHEMICAL, AND PHARMACEUTICAL PROPERTIES
### 5.1 Physical and Chemical Properties
Molecular Formula: {{compound.molecular_formula}}
Molecular Weight: {{compound.mw}}
...

## 6 NONCLINICAL STUDIES
### 6.1 Nonclinical Pharmacology
#### 6.1.1 Primary Pharmacodynamics
{{#each nonclinical.pharmacology}}
In {{this.species}}, {{compound.name}} demonstrated...
{{/each}}

[Table 6.1-1: Nonclinical Pharmacology Summary]
...
```

**IB_Generic_Template.hbs**
```handlebars
## 6 NONCLINICAL STUDIES
No new nonclinical studies were conducted for {{compound.name}} Generic.
The pharmacological and toxicological properties are well established
and have been described in {{#each references.epar}}[{{this.id}}]{{/each}}.

### 6.1 Summary from Literature
{{nonclinical.summary_text}}

[References: {{references.epar}}, {{references.fda_label}}]
```

### 4.3 Protocol Template
16 sections with:
- Study design schema
- Schedule of Activities table
- Statistical analysis plan
- Endpoint definitions

### 4.4 ICF Template
12 sections with:
- Patient-friendly language
- Risk/benefit tables
- Signature blocks
- Contact information

### 4.5 Synopsis Template
10 sections with:
- Tabular synopsis header
- Results tables
- Statistical summaries

### Deliverables
- [ ] 15+ template files (.hbs)
- [ ] Template rendering engine
- [ ] Template testing suite
- [ ] Sample outputs (PDF)
- [ ] Template documentation

---

## **Phase 5: Validation & Quality Control**
**Duration:** Week 14-16  
**Goal:** Automated compliance checking

### 5.1 Validation Rules Database
```sql
CREATE TABLE validation_rules (
  id uuid PRIMARY KEY,
  doc_type text,
  product_type text,
  region text,
  rule_type text, -- structure, data, reference, style
  rule_name text,
  check_logic jsonb,
  severity text, -- error, warning, suggestion
  auto_fix boolean
);
```

### 5.2 Validation Checklists

**IB Innovator Checklist:**
- [ ] All 9 main sections present
- [ ] Nonclinical: PK, PD, Tox, Genotox, Carc, Repro
- [ ] Clinical: PK, PD, Efficacy, Safety
- [ ] At least 1 table per major section
- [ ] References ≥ 15 entries
- [ ] Cross-references valid
- [ ] Study IDs present
- [ ] No contradictions in doses/populations

**IB Generic Checklist:**
- [ ] RLD identified and referenced
- [ ] TE-code present (if FDA)
- [ ] Literature references ≥ 10
- [ ] Bioequivalence section present
- [ ] No claim of original efficacy data
- [ ] Proper attribution to RLD

**Protocol Checklist:**
- [ ] All 16 sections present
- [ ] Primary endpoint defined
- [ ] Sample size justified
- [ ] Statistical plan complete
- [ ] Schedule of Activities table
- [ ] ICF reference present

### 5.3 Auto-Fix Logic
```typescript
interface AutoFix {
  issue: string
  fix: () => void
  confidence: number
}

// Example: Missing cross-reference
{
  issue: "Section 7.3 references Table 5.2-1 which doesn't exist",
  fix: () => createTable("5.2-1", "PK Parameters"),
  confidence: 0.8
}
```

### Deliverables
- [ ] Validation rules database (100+ rules)
- [ ] Validator Agent v2 (with auto-fix)
- [ ] Validation report UI
- [ ] Compliance dashboard
- [ ] Auto-fix testing

---

## **Phase 6: Export & Assembly Pipeline**
**Duration:** Week 16-18  
**Goal:** Professional DOCX/PDF output

### 6.1 Export Formats

**DOCX Export**
- Use `docxtpl` or `python-docx`
- House style template (Asetria brand)
- Styles: Heading 1-4, Body, Table, Caption
- Auto-numbering for sections/tables/figures
- Header/footer with version info

**PDF Export**
- From DOCX via LibreOffice headless
- Or direct render via Puppeteer/WeasyPrint
- Bookmarks for navigation
- Hyperlinked TOC and cross-references

### 6.2 Bundle Structure
```
AST-256_IB_v1.0/
├── AST-256_IB_v1.0.docx
├── AST-256_IB_v1.0.pdf
├── sources.json          # All data sources used
├── manifest.yaml         # Metadata, versions, checksums
├── tables/
│   ├── table_5.2-1.csv
│   └── table_6.1-1.csv
├── figures/
│   └── figure_7.1-1.png
└── references.bib        # Bibliography
```

### 6.3 Manifest Format
```yaml
document:
  type: IB
  version: v1.0
  product_type: generic
  region: US
  generated_at: 2025-11-10T22:00:00Z
  pages: 86
  word_count: 32500

agents:
  - name: Composer_Generic
    version: 1.2.0
  - name: Writer_Generic
    version: 1.1.0
  - name: Validator_Generic
    version: 1.0.0

templates:
  - IB_Generic_Template.hbs v2.1

data_sources:
  - openFDA: NDA020357
  - EMA_EPAR: EU/1/00/000
  - PubMed: 15 articles
  - ClinicalTrials.gov: 3 trials

checksums:
  docx: sha256:abc123...
  pdf: sha256:def456...
```

### Deliverables
- [ ] DOCX export engine
- [ ] PDF export engine
- [ ] Bundle assembler
- [ ] Manifest generator
- [ ] House style template
- [ ] Export testing

---

## **Phase 7: MVP Testing & Refinement**
**Duration:** Week 18-20  
**Goal:** End-to-end validation

### 7.1 Test Cases

**Test Case 1: Generic Metformin IB**
- Input: Compound name, RLD
- Expected: 60-80 page IB, bridge mode, 10+ references
- Validation: ICH compliant, TE-code verified

**Test Case 2: Innovator Phase 3 Protocol**
- Input: Full study design, endpoints, stats plan
- Expected: 100-120 page Protocol
- Validation: All 16 sections, SAP complete

**Test Case 3: ICF for Pediatric Study**
- Input: Study info, risks, procedures
- Expected: 15-20 page ICF, 6th grade reading level
- Validation: FDA 21 CFR 50 compliant

### 7.2 Quality Metrics
- **Coverage:** % of required sections filled
- **Factuality:** % of data from database vs LLM
- **Compliance Score:** Validator score ≥ 90
- **Time-to-Draft:** < 30 minutes per document
- **First-Pass Acceptance:** ≥ 80% (minimal edits needed)

### 7.3 User Acceptance Testing
- 3 internal reviewers (med writers)
- 2 external CRO consultants
- Feedback loop: 2 iterations

### Deliverables
- [ ] 10 test cases executed
- [ ] Quality metrics dashboard
- [ ] UAT feedback incorporated
- [ ] Performance benchmarks
- [ ] MVP release candidate

---

## 🎯 Success Criteria (MVP)

### Technical
- ✅ All 6 agents operational
- ✅ Dual-mode (Innovator/Generic) working
- ✅ External API enrichment functional
- ✅ Template system with 15+ templates
- ✅ DOCX/PDF export working
- ✅ Validation score ≥ 90 on test cases

### Business
- ✅ Generate IB in < 30 minutes
- ✅ 60-90 pages for IB (proper length)
- ✅ ICH/FDA compliant structure
- ✅ References auto-generated
- ✅ First-pass acceptance ≥ 80%

### User Experience
- ✅ Simple project creation (5 fields)
- ✅ Auto-enrichment (no manual data entry for generics)
- ✅ Progress tracking (agent status)
- ✅ Review interface (comments, edits)
- ✅ One-click export (DOCX + PDF)

---

## 📋 API Endpoints (Summary)

```
POST   /api/v1/intake              # Create project
POST   /api/v1/enrich              # Trigger data enrichment
POST   /api/v1/generate            # Generate document
POST   /api/v1/validate            # Run validation
POST   /api/v1/assemble            # Assemble final doc
POST   /api/v1/review              # Log human feedback
POST   /api/v1/regenerate          # Create new version
GET    /api/v1/projects/:id/status # Project status
GET    /api/v1/references/:id      # Get references
GET    /api/v1/documents/:id       # Get document
```

---

## 🗄️ Database Schema (High-Level)

```
Projects (existing)
  + product_type (innovator/generic/hybrid)
  + rld_application_number
  + te_code

Compounds (new)
  - inchikey, name, mechanism, molecular data

Products (new)
  - brand_name, dosage_forms, application_number

Labels (new)
  - sections JSONB, effective_date

Nonclinical_Summaries (new)
  - pk, tox, genotox JSONB

Clinical_Summaries (new)
  - efficacy, safety JSONB

Trials (new)
  - nct_id, design, outcomes JSONB

Literature (new)
  - pmid, title, abstract

Adverse_Events (new)
  - soc, pt, incidence

Agent_Jobs (new)
  - agent_name, status, input, output

Document_Versions (new)
  - version, changes, reviewer
```

---

## 🚀 Next Immediate Actions

### This Week (Week 1)
1. **Architecture Decision Meeting**
   - Edge Functions vs API Routes
   - Database schema review
   - Agent communication protocol

2. **UI Mockup: Product Type Selection**
   - Radio buttons: Innovator / Generic / Hybrid
   - Conditional fields based on selection
   - RLD lookup for generics

3. **Database Migration Plan**
   - Create migration files for new tables
   - Plan data seeding strategy
   - Backward compatibility check

4. **Technical Spike: Template Engine**
   - Evaluate Handlebars vs Mustache vs custom
   - Test with sample IB section
   - Performance benchmarks

### Next Week (Week 2)
1. **Implement Intake Schema**
   - JSON Schema definition
   - Zod validation
   - TypeScript types

2. **Create First Migration**
   - `compounds` table
   - `products` table
   - Test with sample data

3. **Build First Adapter**
   - openFDA Label adapter
   - Test with Metformin
   - Cache implementation

4. **Agent 1: Intake Agent (Prototype)**
   - Validate project intake
   - Determine mode
   - Return enabled agents

---

## 📊 Resource Requirements

### Development Team
- **Backend Engineer:** API, agents, database (full-time)
- **ML/AI Engineer:** LLM prompts, agent logic (full-time)
- **Frontend Engineer:** UI, dashboards (half-time)
- **Medical Writer:** Templates, validation rules (consultant)
- **QA Engineer:** Testing, compliance checks (half-time)

### Infrastructure
- **Supabase:** Database, Edge Functions, Storage
- **Redis:** Caching layer
- **Azure OpenAI:** LLM API (GPT-4)
- **External APIs:** FDA, EMA, PubMed (free tier + paid)

### Budget Estimate
- Development: 20 weeks × team cost
- Infrastructure: $500-1000/month
- External APIs: $200-500/month
- Testing & QA: $5000

---

## 🎓 Key Learnings & Principles

1. **Data First, AI Second**
   - Normalized data layer is foundation
   - LLM writes narrative around facts
   - No hallucinations if data is structured

2. **Template-Driven Generation**
   - Templates ensure consistency
   - AI fills in the blanks
   - Regulatory compliance by design

3. **Dual-Mode Architecture**
   - Generic mode = 80% less data input
   - External enrichment = competitive advantage
   - Same pipeline, different templates

4. **Quality by Validation**
   - Automated compliance checks
   - Human review for final 10%
   - Continuous improvement via feedback

5. **Audit Trail Everything**
   - Every agent action logged
   - Every data source tracked
   - Every version preserved

---

## 📚 Documentation Deliverables

- [ ] Architecture Blueprint (this document)
- [ ] API Specification (OpenAPI/Swagger)
- [ ] Database Schema Documentation
- [ ] Agent Communication Protocol
- [ ] Template Developer Guide
- [ ] Validation Rules Catalog
- [ ] User Guide (Project Creation)
- [ ] Deployment Guide
- [ ] Testing Strategy
- [ ] Compliance Checklist

---

## ✅ Definition of Done (MVP)

**A project is "MVP Complete" when:**

1. User can create Generic project with 5 fields
2. System auto-enriches data from FDA/EMA/PubMed
3. System generates 60-80 page IB in < 30 min
4. IB passes ICH validation (score ≥ 90)
5. User can export DOCX + PDF with one click
6. References are auto-generated and formatted
7. Document has proper numbering and TOC
8. Human reviewer can add comments
9. System can regenerate v1.1 with edits
10. All agents are monitored and logged

---

**Status:** 📋 Planning Complete → Ready for Phase 0 Kickoff

**Next Review:** Week 2 (Architecture Decisions Finalized)

**Questions/Blockers:** None currently

---

*This is a living document. Update weekly with progress, blockers, and learnings.*

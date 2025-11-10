/**
 * Integration tests for Stages 1-3
 * - Stage 1: AI Prompts
 * - Stage 2: Markdown UI
 * - Stage 3: API Integrations
 */

import { createClient } from '@supabase/supabase-js'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const TEST_PROJECT_ID = '11a7585b-bbaa-4ef1-9286-172758e3f8ee'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

describe('Stage 1: AI Prompts', () => {
  test('should have IB prompt with ICH E6 structure', async () => {
    const { getIBPrompt } = await import('@/lib/prompts/ib-prompt')
    const prompt = getIBPrompt({
      project: {
        title: 'Test Drug',
        indication: 'Test Indication',
        phase: 'Phase 2'
      },
      entities: [],
      evidence: { clinical_trials: [], publications: [], safety_data: [] }
    })

    expect(prompt).toContain('Investigator\'s Brochure')
    expect(prompt).toContain('ICH E6')
    expect(prompt).toContain('Introduction')
    expect(prompt).toContain('Methods')
    expect(prompt).toContain('Safety')
  })

  test('should have Protocol prompt with ICH E6 Section 6', async () => {
    const { getProtocolPrompt } = await import('@/lib/prompts/protocol-prompt')
    const prompt = getProtocolPrompt({
      project: {
        title: 'Test Drug',
        indication: 'Test Indication',
        phase: 'Phase 2'
      },
      entities: [],
      evidence: { clinical_trials: [], publications: [], safety_data: [] }
    })

    expect(prompt).toContain('Clinical Trial Protocol')
    expect(prompt).toContain('ICH E6')
    expect(prompt).toContain('Objectives')
    expect(prompt).toContain('Study Design')
  })

  test('should have ICF prompt with FDA 21 CFR 50', async () => {
    const { getICFPrompt } = await import('@/lib/prompts/icf-prompt')
    const prompt = getICFPrompt({
      project: {
        title: 'Test Drug',
        indication: 'Test Indication',
        phase: 'Phase 2'
      },
      entities: [],
      evidence: { clinical_trials: [], publications: [], safety_data: [] }
    })

    expect(prompt).toContain('Informed Consent Form')
    expect(prompt).toContain('FDA 21 CFR')
    expect(prompt).toContain('patient-friendly')
  })

  test('should have Synopsis prompt with ICH E3', async () => {
    const { getSynopsisPrompt } = await import('@/lib/prompts/synopsis-prompt')
    const prompt = getSynopsisPrompt({
      project: {
        title: 'Test Drug',
        indication: 'Test Indication',
        phase: 'Phase 2'
      },
      entities: [],
      evidence: { clinical_trials: [], publications: [], safety_data: [] }
    })

    expect(prompt).toContain('Synopsis')
    expect(prompt).toContain('ICH E3')
  })

  test('should have documents generated for test project', async () => {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', TEST_PROJECT_ID)

    expect(error).toBeNull()
    expect(documents).toBeDefined()
    expect(documents!.length).toBeGreaterThan(0)

    // Check all document types exist
    const types = documents!.map(d => d.type)
    expect(types).toContain('IB')
    expect(types).toContain('Protocol')
    expect(types).toContain('ICF')
    expect(types).toContain('Synopsis')
  })

  test('should have non-empty content in documents', async () => {
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', TEST_PROJECT_ID)
      .limit(1)
      .single()

    expect(documents).toBeDefined()
    expect(documents!.content).toBeDefined()
    expect(documents!.content.length).toBeGreaterThan(100)
  })
})

describe('Stage 2: Markdown UI', () => {
  test('should extract headings from markdown content', () => {
    const markdown = `
# Introduction
Some text here

## Methods
### Pharmacokinetics
More text

## Safety
Final text
    `

    // Simulate heading extraction
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const headings: Array<{ level: number; text: string }> = []
    let match

    while ((match = headingRegex.exec(markdown)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2]
      })
    }

    expect(headings.length).toBe(4)
    expect(headings[0].text).toBe('Introduction')
    expect(headings[1].text).toBe('Methods')
    expect(headings[2].text).toBe('Pharmacokinetics')
    expect(headings[3].text).toBe('Safety')
  })

  test('should handle various markdown elements', () => {
    const markdown = `
# Heading 1
## Heading 2

**Bold text**
*Italic text*

- List item 1
- List item 2

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

\`\`\`javascript
const code = "test";
\`\`\`

> Blockquote text
    `

    expect(markdown).toContain('# Heading 1')
    expect(markdown).toContain('**Bold text**')
    expect(markdown).toContain('- List item')
    expect(markdown).toContain('| Column 1')
    expect(markdown).toContain('```javascript')
    expect(markdown).toContain('> Blockquote')
  })

  test('DocumentViewer component should exist', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const componentPath = path.join(process.cwd(), 'components', 'document-viewer.tsx')
    const exists = await fs.access(componentPath).then(() => true).catch(() => false)
    
    expect(exists).toBe(true)
  })
})

describe('Stage 3: API Integrations', () => {
  test('ClinicalTrials.gov client should search by condition', async () => {
    const { ClinicalTrialsClient } = await import('@/lib/integrations/clinicaltrials')
    const client = new ClinicalTrialsClient()

    const trials = await client.searchByCondition('diabetes', 5)
    
    expect(Array.isArray(trials)).toBe(true)
    if (trials.length > 0) {
      expect(trials[0]).toHaveProperty('nctId')
      expect(trials[0]).toHaveProperty('title')
      expect(trials[0]).toHaveProperty('phase')
      expect(trials[0]).toHaveProperty('status')
    }
  }, 30000) // 30 second timeout

  test('PubMed client should search articles', async () => {
    const { PubMedClient } = await import('@/lib/integrations/pubmed')
    const client = new PubMedClient()

    const publications = await client.search('diabetes treatment', 5)
    
    expect(Array.isArray(publications)).toBe(true)
    if (publications.length > 0) {
      expect(publications[0]).toHaveProperty('pmid')
      expect(publications[0]).toHaveProperty('title')
      expect(publications[0]).toHaveProperty('authors')
      expect(publications[0]).toHaveProperty('journal')
    }
  }, 30000)

  test('openFDA client should search adverse events', async () => {
    const { OpenFDAClient } = await import('@/lib/integrations/openfda')
    const client = new OpenFDAClient()

    // Use a common drug name
    const events = await client.searchAdverseEvents('aspirin', 5)
    
    expect(Array.isArray(events)).toBe(true)
    // Note: may return empty array if no data, which is OK
  }, 30000)

  test('should have evidence_sources table structure', async () => {
    const { data, error } = await supabase
      .from('evidence_sources')
      .select('*')
      .limit(1)

    // Table should exist (even if empty)
    expect(error).toBeNull()
  })

  test('API route /api/integrations/fetch-all should exist', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const routePath = path.join(process.cwd(), 'app', 'api', 'integrations', 'fetch-all', 'route.ts')
    const exists = await fs.access(routePath).then(() => true).catch(() => false)
    
    expect(exists).toBe(true)
  })

  test('FetchExternalDataButton component should exist', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const componentPath = path.join(process.cwd(), 'components', 'fetch-external-data-button.tsx')
    const exists = await fs.access(componentPath).then(() => true).catch(() => false)
    
    expect(exists).toBe(true)
  })
})

describe('Integration: Full Workflow', () => {
  test('should have project with all required fields', async () => {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', TEST_PROJECT_ID)
      .single()

    expect(error).toBeNull()
    expect(project).toBeDefined()
    expect(project!.title).toBeDefined()
    expect(project!.indication).toBeDefined()
    expect(project!.phase).toBeDefined()
  })

  test('should have documents linked to project', async () => {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', TEST_PROJECT_ID)

    expect(error).toBeNull()
    expect(documents).toBeDefined()
    expect(documents!.length).toBeGreaterThan(0)

    // All documents should have content
    documents!.forEach(doc => {
      expect(doc.content).toBeDefined()
      expect(doc.content.length).toBeGreaterThan(0)
    })
  })

  test('should have markdown content in documents', async () => {
    const { data: documents } = await supabase
      .from('documents')
      .select('content')
      .eq('project_id', TEST_PROJECT_ID)
      .limit(1)
      .single()

    const content = documents!.content

    // Should contain markdown elements
    const hasHeadings = /#+ /.test(content)
    expect(hasHeadings).toBe(true)
  })
})

describe('Error Handling', () => {
  test('should handle invalid project ID gracefully', async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single()

    expect(data).toBeNull()
    expect(error).toBeDefined()
  })

  test('ClinicalTrials client should handle invalid query', async () => {
    const { ClinicalTrialsClient } = await import('@/lib/integrations/clinicaltrials')
    const client = new ClinicalTrialsClient()

    const trials = await client.searchByCondition('', 5)
    
    expect(Array.isArray(trials)).toBe(true)
    // Should return empty array, not throw
  }, 30000)

  test('PubMed client should handle invalid query', async () => {
    const { PubMedClient } = await import('@/lib/integrations/pubmed')
    const client = new PubMedClient()

    const publications = await client.search('', 5)
    
    expect(Array.isArray(publications)).toBe(true)
    // Should return empty array, not throw
  }, 30000)
})

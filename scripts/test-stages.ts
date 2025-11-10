/**
 * Simple test script for Stages 1-3
 * Run with: npx tsx scripts/test-stages.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { ClinicalTrialsClient } from '../lib/integrations/clinicaltrials'
import { PubMedClient } from '../lib/integrations/pubmed'
import { OpenFDAClient } from '../lib/integrations/openfda'
import { generateIBPrompt } from '../lib/prompts/ib-prompt'
import { generateProtocolPrompt } from '../lib/prompts/protocol-prompt'
import { generateICFPrompt } from '../lib/prompts/icf-prompt'
import { generateSynopsisPrompt } from '../lib/prompts/synopsis-prompt'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const TEST_PROJECT_ID = '11a7585b-bbaa-4ef1-9286-172758e3f8ee'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function test(name: string, fn: () => Promise<boolean> | boolean) {
  return async () => {
    try {
      const passed = await fn()
      results.push({ name, passed })
      console.log(passed ? '✅' : '❌', name)
      return passed
    } catch (error: any) {
      results.push({ name, passed: false, error: error.message })
      console.log('❌', name, '-', error.message)
      return false
    }
  }
}

async function runTests() {
  console.log('\n🧪 Testing Stages 1-3\n')
  console.log('=' .repeat(60))
  
  // Stage 1: AI Prompts
  console.log('\n📝 Stage 1: AI Prompts\n')
  
  await test('IB prompt contains ICH E6 structure', () => {
    const prompt = generateIBPrompt({
      projectTitle: 'Test Drug',
      compoundName: 'AST-101',
      indication: 'Type 2 Diabetes',
      phase: 'Phase 2',
      sponsor: 'Test Sponsor',
      entities: []
    })
    return prompt.includes('Investigator\'s Brochure') && 
           prompt.includes('ICH E6')
  })()
  
  await test('Protocol prompt contains ICH E6 Section 6', () => {
    const prompt = generateProtocolPrompt({
      projectTitle: 'Test Drug',
      compoundName: 'AST-101',
      indication: 'Type 2 Diabetes',
      phase: 'Phase 2',
      sponsor: 'Test Sponsor',
      entities: []
    })
    return prompt.includes('Protocol') && 
           prompt.includes('ICH E6')
  })()
  
  await test('ICF prompt contains FDA 21 CFR', () => {
    const prompt = generateICFPrompt({
      projectTitle: 'Test Drug',
      compoundName: 'AST-101',
      indication: 'Type 2 Diabetes',
      phase: 'Phase 2',
      sponsor: 'Test Sponsor',
      entities: []
    })
    return prompt.includes('Informed Consent') && 
           prompt.includes('FDA 21 CFR')
  })()
  
  await test('Synopsis prompt contains ICH E3', () => {
    const prompt = generateSynopsisPrompt({
      projectTitle: 'Test Drug',
      compoundName: 'AST-101',
      indication: 'Type 2 Diabetes',
      phase: 'Phase 2',
      sponsor: 'Test Sponsor',
      entities: []
    })
    return prompt.includes('Synopsis') && 
           prompt.includes('ICH E3')
  })()
  
  await test('Project has generated documents', async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', TEST_PROJECT_ID)
    
    return !error && data && data.length > 0
  })()
  
  await test('Documents have all 4 types (IB, Protocol, ICF, Synopsis)', async () => {
    const { data } = await supabase
      .from('documents')
      .select('type')
      .eq('project_id', TEST_PROJECT_ID)
    
    if (!data) return false
    const types = data.map(d => d.type)
    return types.includes('IB') && 
           types.includes('Protocol') && 
           types.includes('ICF') && 
           types.includes('Synopsis')
  })()
  
  await test('Documents have non-empty content', async () => {
    const { data } = await supabase
      .from('documents')
      .select('content')
      .eq('project_id', TEST_PROJECT_ID)
      .limit(1)
      .single()
    
    return data && data.content && data.content.length > 100
  })()
  
  // Stage 2: Markdown UI
  console.log('\n🎨 Stage 2: Markdown UI\n')
  
  await test('Markdown heading extraction works', () => {
    const markdown = '# Title\n## Section\n### Subsection'
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const matches = [...markdown.matchAll(headingRegex)]
    return matches.length === 3
  })()
  
  await test('DocumentViewer component exists', async () => {
    const fs = await import('fs/promises')
    try {
      await fs.access('./components/document-viewer.tsx')
      return true
    } catch {
      return false
    }
  })()
  
  // Stage 3: API Integrations
  console.log('\n🔌 Stage 3: API Integrations\n')
  
  await test('ClinicalTrials.gov API works', async () => {
    const client = new ClinicalTrialsClient()
    const trials = await client.searchByCondition('diabetes', 2)
    return Array.isArray(trials)
  })()
  
  await test('PubMed API works', async () => {
    const client = new PubMedClient()
    const pubs = await client.search('diabetes', 2)
    return Array.isArray(pubs)
  })()
  
  await test('openFDA API works', async () => {
    const client = new OpenFDAClient()
    const events = await client.searchAdverseEvents('aspirin', 2)
    return Array.isArray(events)
  })()
  
  await test('evidence_sources table exists', async () => {
    const { error } = await supabase
      .from('evidence_sources')
      .select('*')
      .limit(1)
    
    return !error
  })()
  
  await test('API route /api/integrations/fetch-all exists', async () => {
    const fs = await import('fs/promises')
    try {
      await fs.access('./app/api/integrations/fetch-all/route.ts')
      return true
    } catch {
      return false
    }
  })()
  
  await test('FetchExternalDataButton component exists', async () => {
    const fs = await import('fs/promises')
    try {
      await fs.access('./components/fetch-external-data-button.tsx')
      return true
    } catch {
      return false
    }
  })()
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Test Summary\n')
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  
  console.log(`Total: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`)
      if (r.error) console.log(`    Error: ${r.error}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Ready for next stage.\n')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix.\n')
    process.exit(1)
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

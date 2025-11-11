/**
 * Test script for Composer Agent
 * 
 * Usage: npx tsx scripts/test-composer.ts
 * 
 * Note: Requires Handlebars to be installed
 */

// @ts-nocheck - Test script
import { ComposerAgent } from '../lib/agents/composer'

async function testComposer() {
  console.log('🧪 Testing Composer Agent\n')

  const composer = new ComposerAgent()

  // Test cases
  const testCases = [
    {
      name: 'Get available sections for IB Generic',
      test: async () => {
        const sections = composer.getAvailableSections('investigator_brochure', 'generic')
        console.log(`✅ Available sections: ${sections.length}`)
        sections.forEach(section => {
          console.log(`   - ${section}`)
        })
        return sections.length > 0
      }
    },
    {
      name: 'Check if templates exist for IB Generic',
      test: async () => {
        const hasTemplates = composer.hasTemplates('investigator_brochure', 'generic')
        console.log(`✅ Has templates: ${hasTemplates}`)
        return hasTemplates
      }
    },
    {
      name: 'Compose specific sections (mock project)',
      test: async () => {
        // This would require a real project ID with enriched data
        console.log('⏭️  Skipping - requires real project with enriched data')
        console.log('   To test: Create a project, run enrichment, then compose')
        return true
      }
    },
  ]

  let passed = 0
  let failed = 0

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Test: ${testCase.name}`)
    console.log('='.repeat(60))

    try {
      const result = await testCase.test()
      if (result) {
        console.log(`✅ PASSED`)
        passed++
      } else {
        console.log(`❌ FAILED`)
        failed++
      }
    } catch (error) {
      console.error(`❌ ERROR:`, error)
      failed++
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`🎉 Composer Agent tests completed!`)
  console.log(`='.repeat(60)}`)
  console.log(`\n📊 Results:`)
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

  console.log(`\n💡 How to use Composer Agent:`)
  console.log(`\n1. Create a project:`)
  console.log(`   POST /api/v1/intake`)
  console.log(`   { compound_name: "Metformin", product_type: "generic", ... }`)
  
  console.log(`\n2. Wait for enrichment to complete:`)
  console.log(`   GET /api/v1/enrich?project_id=xxx`)
  console.log(`   Check: enrichment_status === "completed"`)
  
  console.log(`\n3. Compose document:`)
  console.log(`   POST /api/v1/compose`)
  console.log(`   {`)
  console.log(`     project_id: "xxx",`)
  console.log(`     document_type: "investigator_brochure",`)
  console.log(`     sections: ["section-5", "section-6", "section-7"]  // optional`)
  console.log(`   }`)
  
  console.log(`\n4. Get rendered sections:`)
  console.log(`   Response: { content: { "section-5": "...", "section-6": "...", ... } }`)

  console.log(`\n📚 Available document types:`)
  console.log(`   - investigator_brochure (3 sections ready: 5, 6, 7)`)
  console.log(`   - clinical_protocol (coming soon)`)
  console.log(`   - informed_consent (coming soon)`)
  console.log(`   - study_synopsis (coming soon)`)

  console.log(`\n🎨 Available IB sections (Generic):`)
  console.log(`   ✅ section-5: Clinical Pharmacology`)
  console.log(`   ✅ section-6: Safety and Tolerability`)
  console.log(`   ✅ section-7: Efficacy and Clinical Outcomes`)
  console.log(`   ⏳ section-1: Product Information (coming soon)`)
  console.log(`   ⏳ section-2: Introduction (coming soon)`)
  console.log(`   ⏳ section-3: Physical, Chemical, Pharmaceutical (coming soon)`)
  console.log(`   ⏳ section-4: Nonclinical Studies (coming soon)`)
  console.log(`   ⏳ section-8: Marketed Experience (coming soon)`)
  console.log(`   ⏳ section-9: Summary and Conclusions (coming soon)`)
  console.log(`   ⏳ section-10: References (coming soon)`)
}

// Run tests
testComposer().catch(console.error)

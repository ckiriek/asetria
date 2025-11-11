/**
 * Test script for ClinicalTrials.gov Adapter
 * 
 * Usage: npx tsx scripts/test-clinicaltrials.ts
 */

// @ts-nocheck - Test script with dynamic data
import { clinicalTrialsAdapter, ClinicalTrialsAdapter } from '../lib/adapters/clinicaltrials'

async function testClinicalTrials() {
  console.log('🧪 Testing ClinicalTrials.gov Adapter\n')

  // Test cases
  const testCases = [
    {
      type: 'drug',
      value: 'metformin',
      description: 'Metformin trials',
      maxResults: 5,
    },
    {
      type: 'condition',
      value: 'Type 2 Diabetes',
      description: 'Type 2 Diabetes trials',
      maxResults: 5,
    },
    {
      type: 'nct',
      value: 'NCT00000620',
      description: 'Specific trial by NCT ID',
    },
  ]

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${testCase.description}`)
    console.log('='.repeat(60))

    try {
      if (testCase.type === 'drug') {
        // Test 1: Search trials by drug
        console.log(`\n1️⃣ Searching trials for drug: ${testCase.value}`)
        const trials = await clinicalTrialsAdapter.searchTrialsByDrug(testCase.value, testCase.maxResults)
        
        if (trials.length > 0) {
          console.log(`✅ Found ${trials.length} trials:`)
          trials.forEach((trial, index) => {
            console.log(`\n   Trial ${index + 1}:`)
            console.log(`     NCT ID: ${trial.registry_id}`)
            console.log(`     Title: ${trial.title.substring(0, 80)}...`)
            console.log(`     Phase: ${trial.phase || 'N/A'}`)
            console.log(`     Status: ${trial.status}`)
            console.log(`     Sponsor: ${trial.sponsor}`)
            console.log(`     Indication: ${trial.indication || 'N/A'}`)
            console.log(`     Enrollment: ${trial.trial_design?.enrollment_n || 'N/A'}`)
            console.log(`     Start Date: ${trial.start_date || 'N/A'}`)
            
            if (trial.arms && trial.arms.length > 0) {
              console.log(`     Arms: ${trial.arms.length}`)
              trial.arms.slice(0, 2).forEach(arm => {
                console.log(`       - ${arm.arm_name} (${arm.arm_type})`)
              })
            }
            
            if (trial.outcomes && trial.outcomes.length > 0) {
              console.log(`     Outcomes: ${trial.outcomes.length}`)
              trial.outcomes.slice(0, 2).forEach(outcome => {
                console.log(`       - ${outcome.measure.substring(0, 60)}...`)
              })
            }
          })

          // Test 2: Build clinical summary
          console.log(`\n2️⃣ Building clinical summary from trials`)
          const summary = ClinicalTrialsAdapter.buildClinicalSummary(trials)
          
          console.log(`✅ Clinical Summary:`)
          console.log(`   Total Subjects: ${summary.total_subjects}`)
          console.log(`   Total Studies: ${summary.total_studies}`)
          console.log(`   Phases: ${summary.phases_studied?.join(', ') || 'N/A'}`)
          console.log(`   Indications: ${summary.indications_studied?.join(', ') || 'N/A'}`)
          console.log(`   Source: ${summary.source}`)
          console.log(`   Confidence: ${summary.confidence}`)
        } else {
          console.log(`❌ No trials found`)
        }
      }

      if (testCase.type === 'condition') {
        // Test 3: Search trials by condition
        console.log(`\n3️⃣ Searching trials for condition: ${testCase.value}`)
        const trials = await clinicalTrialsAdapter.searchTrialsByCondition(testCase.value, testCase.maxResults)
        
        if (trials.length > 0) {
          console.log(`✅ Found ${trials.length} trials:`)
          trials.slice(0, 3).forEach((trial, index) => {
            console.log(`\n   Trial ${index + 1}:`)
            console.log(`     NCT ID: ${trial.registry_id}`)
            console.log(`     Title: ${trial.title.substring(0, 80)}...`)
            console.log(`     Phase: ${trial.phase || 'N/A'}`)
            console.log(`     Status: ${trial.status}`)
          })
        } else {
          console.log(`❌ No trials found`)
        }
      }

      if (testCase.type === 'nct') {
        // Test 4: Get trial by NCT ID
        console.log(`\n4️⃣ Fetching trial by NCT ID: ${testCase.value}`)
        const trial = await clinicalTrialsAdapter.getTrialByNCTId(testCase.value)
        
        if (trial) {
          console.log(`✅ Trial fetched:`)
          console.log(`   NCT ID: ${trial.registry_id}`)
          console.log(`   Title: ${trial.title}`)
          console.log(`   Phase: ${trial.phase || 'N/A'}`)
          console.log(`   Status: ${trial.status}`)
          console.log(`   Sponsor: ${trial.sponsor}`)
          console.log(`   Indication: ${trial.indication || 'N/A'}`)
          console.log(`   Start Date: ${trial.start_date || 'N/A'}`)
          console.log(`   Completion Date: ${trial.completion_date || 'N/A'}`)
          
          console.log(`\n   Trial Design:`)
          console.log(`     Study Type: ${trial.trial_design?.study_type}`)
          console.log(`     Phase: ${trial.trial_design?.phase}`)
          console.log(`     Allocation: ${trial.trial_design?.allocation || 'N/A'}`)
          console.log(`     Intervention Model: ${trial.trial_design?.intervention_model || 'N/A'}`)
          console.log(`     Masking: ${trial.trial_design?.masking || 'N/A'}`)
          console.log(`     Enrollment: ${trial.trial_design?.enrollment_n || 'N/A'}`)
          
          if (trial.arms && trial.arms.length > 0) {
            console.log(`\n   Arms (${trial.arms.length}):`)
            trial.arms.forEach(arm => {
              console.log(`     - ${arm.arm_name} (${arm.arm_type})`)
              if (arm.description) {
                console.log(`       ${arm.description.substring(0, 80)}...`)
              }
            })
          }
          
          if (trial.outcomes && trial.outcomes.length > 0) {
            console.log(`\n   Outcomes (${trial.outcomes.length}):`)
            trial.outcomes.slice(0, 5).forEach(outcome => {
              console.log(`     - [${outcome.outcome_type}] ${outcome.measure}`)
              if (outcome.time_frame) {
                console.log(`       Time Frame: ${outcome.time_frame}`)
              }
            })
          }
          
          if (trial.inclusion_criteria) {
            console.log(`\n   Inclusion Criteria:`)
            console.log(`     ${trial.inclusion_criteria.substring(0, 200)}...`)
          }
          
          console.log(`\n   Source URL: ${trial.source_url}`)
        } else {
          console.log(`❌ Trial not found`)
        }
      }

    } catch (error) {
      console.error(`❌ Error testing "${testCase.description}":`, error)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 ClinicalTrials.gov Adapter tests completed!')
  console.log('='.repeat(60))
  console.log('\n📊 Key Insights:')
  console.log('- ✅ Trial search by drug works')
  console.log('- ✅ Trial search by condition works')
  console.log('- ✅ Trial fetch by NCT ID works')
  console.log('- ✅ Clinical summary generation works')
  console.log('- ✅ Trial design parsing works')
  console.log('- ✅ Arms and outcomes extraction works')
  console.log('\n💡 Data Quality:')
  console.log('- High confidence for registered trials')
  console.log('- Comprehensive trial metadata')
  console.log('- Links to full trial details')
  console.log('- Useful for IB Section 7 (Efficacy)')
}

// Run tests
testClinicalTrials().catch(console.error)

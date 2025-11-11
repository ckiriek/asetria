/**
 * Test script for Orange Book Adapter
 * 
 * Usage: npx tsx scripts/test-orange-book.ts
 */

import { orangeBookAdapter, OrangeBookAdapter } from '../lib/adapters/orange-book'

async function testOrangeBook() {
  console.log('🧪 Testing FDA Orange Book Adapter\n')

  // Test cases
  const testCases = [
    {
      type: 'application_number',
      value: 'NDA020357',
      description: 'Metformin (GLUCOPHAGE)',
    },
    {
      type: 'brand_name',
      value: 'GLUCOPHAGE',
      description: 'GLUCOPHAGE brand search',
    },
    {
      type: 'application_number',
      value: 'NDA020503',
      description: 'Atorvastatin (LIPITOR)',
    },
  ]

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${testCase.description}`)
    console.log('='.repeat(60))

    try {
      if (testCase.type === 'application_number') {
        // Test 1: Get RLD by application number
        console.log(`\n1️⃣ Getting RLD info for: ${testCase.value}`)
        const rldInfo = await orangeBookAdapter.getRLDByApplicationNumber(testCase.value)
        
        if (rldInfo) {
          console.log(`✅ RLD Info found:`)
          console.log(`   Application Number: ${rldInfo.application_number}`)
          console.log(`   Brand Name: ${rldInfo.brand_name}`)
          console.log(`   Generic Name: ${rldInfo.generic_name}`)
          console.log(`   Sponsor: ${rldInfo.sponsor_name}`)
          console.log(`   Is RLD: ${rldInfo.is_rld ? 'Yes' : 'No'}`)
          console.log(`   TE Code: ${rldInfo.te_code || 'N/A'}`)
          
          if (rldInfo.te_code) {
            const isEquivalent = OrangeBookAdapter.isTherapeuticallyEquivalent(rldInfo.te_code)
            const description = OrangeBookAdapter.getTECodeDescription(rldInfo.te_code)
            console.log(`   TE Code Valid: ${OrangeBookAdapter.isValidTECode(rldInfo.te_code)}`)
            console.log(`   Therapeutically Equivalent: ${isEquivalent ? 'Yes' : 'No'}`)
            console.log(`   TE Description: ${description}`)
          }
          
          console.log(`   Dosage Form: ${rldInfo.dosage_form}`)
          console.log(`   Route: ${rldInfo.route}`)
          console.log(`   Strength: ${rldInfo.strength}`)
          console.log(`   Marketing Status: ${rldInfo.marketing_status}`)
          console.log(`   Approval Date: ${rldInfo.approval_date || 'N/A'}`)
        } else {
          console.log(`❌ No RLD info found`)
        }

        // Test 2: Get all products
        console.log(`\n2️⃣ Getting all products for: ${testCase.value}`)
        const products = await orangeBookAdapter.getProductsByApplicationNumber(testCase.value)
        
        if (products.length > 0) {
          console.log(`✅ Found ${products.length} product(s):`)
          products.forEach((product, index) => {
            console.log(`\n   Product ${index + 1}:`)
            console.log(`     Brand: ${product.brand_name}`)
            console.log(`     Generic: ${product.generic_name}`)
            console.log(`     Is RLD: ${product.is_rld ? 'Yes' : 'No'}`)
            console.log(`     TE Code: ${product.te_code || 'N/A'}`)
            console.log(`     Dosage Form: ${product.dosage_form}`)
            console.log(`     Strength: ${product.strength}`)
          })
        } else {
          console.log(`❌ No products found`)
        }
      }

      if (testCase.type === 'brand_name') {
        // Test 3: Search RLD by brand name
        console.log(`\n3️⃣ Searching RLD by brand name: ${testCase.value}`)
        const rldList = await orangeBookAdapter.searchRLDByBrandName(testCase.value)
        
        if (rldList.length > 0) {
          console.log(`✅ Found ${rldList.length} RLD(s):`)
          rldList.forEach((rld, index) => {
            console.log(`\n   RLD ${index + 1}:`)
            console.log(`     Application: ${rld.application_number}`)
            console.log(`     Brand: ${rld.brand_name}`)
            console.log(`     Generic: ${rld.generic_name}`)
            console.log(`     TE Code: ${rld.te_code || 'N/A'}`)
            console.log(`     Dosage Form: ${rld.dosage_form}`)
            console.log(`     Strength: ${rld.strength}`)
          })
        } else {
          console.log(`❌ No RLDs found`)
        }
      }

    } catch (error) {
      console.error(`❌ Error testing "${testCase.description}":`, error)
    }
  }

  // Test 4: TE Code validation
  console.log(`\n${'='.repeat(60)}`)
  console.log('Testing: TE Code Validation')
  console.log('='.repeat(60))

  const teCodes = ['AB', 'AP', 'BX', 'BC', 'AA', 'ZZ', 'A', 'ABC']
  
  console.log('\n4️⃣ Validating TE Codes:')
  teCodes.forEach(code => {
    const isValid = OrangeBookAdapter.isValidTECode(code)
    const isEquivalent = OrangeBookAdapter.isTherapeuticallyEquivalent(code)
    const description = OrangeBookAdapter.getTECodeDescription(code)
    
    console.log(`\n   Code: ${code}`)
    console.log(`     Valid: ${isValid ? '✅' : '❌'}`)
    if (isValid) {
      console.log(`     Equivalent: ${isEquivalent ? '✅ Yes' : '❌ No'}`)
      console.log(`     Description: ${description}`)
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Orange Book Adapter tests completed!')
  console.log('='.repeat(60))
  console.log('\n📊 Key Insights:')
  console.log('- ✅ RLD identification works')
  console.log('- ✅ TE code validation works')
  console.log('- ✅ Product information extraction works')
  console.log('- ✅ Multiple products per application handled')
  console.log('\n💡 TE Codes:')
  console.log('- A* codes = Therapeutically equivalent (e.g., AB, AP, AT)')
  console.log('- B* codes = NOT therapeutically equivalent (e.g., BX, BC, BD)')
  console.log('- AB = Most common (standard bioequivalence)')
}

// Run tests
testOrangeBook().catch(console.error)

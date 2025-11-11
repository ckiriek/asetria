/**
 * Autocomplete API for Indications
 * 
 * Searches existing projects and ClinicalTrials.gov for indications
 * 
 * GET /api/v1/autocomplete/indications?q=diabetes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, validateRequiredFields } from '@/lib/middleware/error-handler'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    validateRequiredFields(
      { q: query },
      ['q'],
      'AutocompleteAPI',
      'indications'
    )

    // Minimum 3 characters for search
    if (query!.length < 3) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Query too short (minimum 3 characters)'
      })
    }

    const results: Array<{
      indication: string
      source: 'projects' | 'clinicaltrials'
      count?: number
    }> = []

    // Search existing projects
    const supabase = await createClient()
    const { data: projects } = await supabase
      .from('projects')
      .select('indication')
      .ilike('indication', `%${query}%`)
      .not('indication', 'is', null)
      .limit(limit)

    if (projects) {
      // Group by indication and count
      const indicationCounts = new Map<string, number>()
      for (const project of projects) {
        const indication = project.indication
        indicationCounts.set(indication, (indicationCounts.get(indication) || 0) + 1)
      }

      // Add to results
      for (const [indication, count] of indicationCounts.entries()) {
        results.push({
          indication,
          source: 'projects',
          count
        })
      }
    }

    // Search ClinicalTrials.gov for real conditions
    try {
      // Direct API call to get conditions
      const ctResponse = await fetch(
        `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(query!)}&pageSize=20&fields=ProtocolSection/ConditionsModule/Conditions`
      )
      
      if (ctResponse.ok) {
        const ctData = await ctResponse.json()
        const conditionsSet = new Set<string>()
        
        // Extract conditions from studies
        if (ctData.studies && Array.isArray(ctData.studies)) {
          for (const study of ctData.studies) {
            const conditions = study.protocolSection?.conditionsModule?.conditions
            if (conditions && Array.isArray(conditions)) {
              for (const condition of conditions) {
                // Only add if it matches the query
                if (condition.toLowerCase().includes(query!.toLowerCase())) {
                  conditionsSet.add(condition)
                }
              }
            }
          }
        }
        
        // Add to results
        for (const condition of conditionsSet) {
          if (!results.find(r => r.indication.toLowerCase() === condition.toLowerCase())) {
            results.push({
              indication: condition,
              source: 'clinicaltrials'
            })
          }
        }
      }
    } catch (error) {
      console.error('ClinicalTrials.gov search error:', error)
    }

    // Sort by count (projects first) and limit
    const sortedResults = results
      .sort((a, b) => {
        if (a.source === 'projects' && b.source === 'clinicaltrials') return -1
        if (a.source === 'clinicaltrials' && b.source === 'projects') return 1
        return (b.count || 0) - (a.count || 0)
      })
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: sortedResults,
      query,
      total: sortedResults.length
    })
  } catch (error) {
    return handleApiError(error, 'AutocompleteAPI', 'indications')
  }
}

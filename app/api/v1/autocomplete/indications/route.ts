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
import { ClinicalTrialsAdapter } from '@/lib/adapters/clinicaltrials'

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

    // Search ClinicalTrials.gov for common indications
    // Note: For autocomplete, we'll just use the query as a suggestion
    // since ClinicalTrials.gov API doesn't provide direct condition autocomplete
    // In a production system, you'd maintain a curated list of common indications
    try {
      const ctAdapter = new ClinicalTrialsAdapter()
      const trials = await ctAdapter.searchTrialsByCondition(query!, 3)
      
      // If we found trials, add the query as a valid indication
      if (trials.length > 0 && !results.find(r => r.indication.toLowerCase() === query!.toLowerCase())) {
        results.push({
          indication: query!,
          source: 'clinicaltrials'
        })
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

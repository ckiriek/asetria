/**
 * Autocomplete API for Countries
 * 
 * Returns list of countries commonly used in clinical trials
 * 
 * GET /api/v1/autocomplete/countries?q=united
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, validateRequiredFields } from '@/lib/middleware/error-handler'

// Common countries for clinical trials
const COMMON_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Austria',
  'Sweden',
  'Denmark',
  'Norway',
  'Finland',
  'Poland',
  'Czech Republic',
  'Hungary',
  'Romania',
  'Bulgaria',
  'Canada',
  'Mexico',
  'Brazil',
  'Argentina',
  'Chile',
  'Colombia',
  'Peru',
  'Japan',
  'China',
  'South Korea',
  'Taiwan',
  'Singapore',
  'Hong Kong',
  'India',
  'Thailand',
  'Malaysia',
  'Philippines',
  'Indonesia',
  'Australia',
  'New Zealand',
  'South Africa',
  'Egypt',
  'Israel',
  'Turkey',
  'Russia',
  'Ukraine'
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    validateRequiredFields(
      { q: query },
      ['q'],
      'AutocompleteAPI',
      'countries'
    )

    // Minimum 2 characters for search
    if (query!.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Query too short (minimum 2 characters)'
      })
    }

    // Filter countries by query
    const results = COMMON_COUNTRIES
      .filter(country => country.toLowerCase().includes(query!.toLowerCase()))
      .slice(0, limit)
      .map(country => ({ country }))

    return NextResponse.json({
      success: true,
      data: results,
      query,
      total: results.length
    })
  } catch (error) {
    return handleApiError(error, 'AutocompleteAPI', 'countries')
  }
}

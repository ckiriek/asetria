import { NextResponse } from 'next/server'
import { clinicalTrialsClient } from '@/lib/integrations/clinicaltrials'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const type = searchParams.get('type') || 'condition'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      )
    }

    let results
    if (type === 'intervention') {
      results = await clinicalTrialsClient.searchByIntervention(query, limit)
    } else {
      results = await clinicalTrialsClient.searchByCondition(query, limit)
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('ClinicalTrials API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

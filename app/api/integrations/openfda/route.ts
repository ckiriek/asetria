import { NextResponse } from 'next/server'
import { openFDAClient } from '@/lib/integrations/openfda'
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
    const drug = searchParams.get('drug')
    const type = searchParams.get('type') || 'events'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!drug) {
      return NextResponse.json(
        { error: 'Missing drug parameter' },
        { status: 400 }
      )
    }

    let results
    if (type === 'label') {
      results = await openFDAClient.getDrugLabel(drug)
    } else if (type === 'summary') {
      results = await openFDAClient.getSafetySummary(drug)
    } else {
      results = await openFDAClient.searchAdverseEvents(drug, limit)
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('openFDA API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

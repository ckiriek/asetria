import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { documentId, documentType, content } = body

    if (!documentId || !documentType || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, documentType, content' },
        { status: 400 }
      )
    }

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('validate-document', {
      body: {
        documentId,
        documentType,
        content,
      },
    })

    if (error) {
      console.error('Edge function error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

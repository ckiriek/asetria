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

    const { fileId, projectId } = await request.json()

    if (!fileId || !projectId) {
      return NextResponse.json(
        { error: 'File ID and Project ID are required' },
        { status: 400 }
      )
    }

    // Verify file exists and belongs to user's project
    const { data: file, error: fileError } = await supabase
      .from('project_files')
      .select('*, projects!inner(created_by)')
      .eq('id', fileId)
      .eq('project_id', projectId)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if user owns the project
    if ((file as any).projects.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if file has parsed content
    if (!file.parsed_content || file.parsed_content.length < 10) {
      return NextResponse.json(
        { error: 'File has no parsed content. Please ensure the file has been processed.' },
        { status: 400 }
      )
    }

    // Get session for Edge Function call
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('extract-entities', {
      body: { fileId, projectId },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    if (error) {
      console.error('Edge Function error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to extract entities' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Error extracting entities:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to extract entities' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Packer } from 'docx'
import { createDocxFromMarkdown } from '@/lib/export/markdown-to-docx'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*, projects!inner(created_by, title)')
      .eq('id', params.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check ownership
    if ((document as any).projects.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const content = (document as any).content || ''
    
    if (!content) {
      return NextResponse.json(
        { error: 'Document has no content' },
        { status: 400 }
      )
    }

    // Create DOCX document
    const title = `${(document as any).type} - ${(document as any).projects.title} - v${(document as any).version}`
    const doc = createDocxFromMarkdown(content, title)

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)

    // Log audit trail
    await supabase.from('audit_log').insert({
      project_id: (document as any).project_id,
      actor_user_id: user.id,
      action: 'document_exported',
      diff_json: {
        documentId: params.id,
        format: 'docx',
        type: (document as any).type
      }
    })

    // Return file
    const filename = `${(document as any).type}_v${(document as any).version}.docx`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })

  } catch (error: any) {
    console.error('Error exporting DOCX:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export DOCX' },
      { status: 500 }
    )
  }
}

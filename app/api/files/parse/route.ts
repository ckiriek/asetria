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

    const { projectId, filePath, fileName, mimeType } = await request.json()

    if (!projectId || !filePath) {
      return NextResponse.json(
        { error: 'Project ID and file path are required' },
        { status: 400 }
      )
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('project-files')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError)
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      )
    }

    let parsedContent = ''
    let metadata: any = {}

    // Parse based on MIME type
    if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      // Plain text - just read it
      parsedContent = await fileData.text()
      metadata = {
        lineCount: parsedContent.split('\n').length,
        charCount: parsedContent.length
      }
    } else if (mimeType === 'application/pdf') {
      // PDF parsing - placeholder for now
      // In production, use pdf-parse or similar library
      parsedContent = '[PDF content - parsing not yet implemented]'
      metadata = {
        type: 'pdf',
        size: fileData.size,
        note: 'PDF parsing will be implemented in next phase'
      }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      // DOCX/DOC parsing - placeholder for now
      // In production, use mammoth or similar library
      parsedContent = '[DOCX content - parsing not yet implemented]'
      metadata = {
        type: 'docx',
        size: fileData.size,
        note: 'DOCX parsing will be implemented in next phase'
      }
    }

    // Update database with parsed content
    const { error: updateError } = await supabase
      .from('project_files')
      .update({
        parsed_content: parsedContent,
        metadata: metadata
      })
      .eq('storage_path', filePath)
      .eq('project_id', projectId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update file metadata' },
        { status: 500 }
      )
    }

    // Log audit trail
    await supabase.from('audit_log').insert({
      project_id: projectId,
      actor_user_id: user.id,
      action: 'file_uploaded',
      diff_json: {
        fileName,
        filePath,
        mimeType,
        contentLength: parsedContent.length
      }
    })

    return NextResponse.json({
      success: true,
      parsedContent: parsedContent.substring(0, 500), // Return preview
      metadata
    })

  } catch (error: any) {
    console.error('Error parsing file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to parse file' },
      { status: 500 }
    )
  }
}

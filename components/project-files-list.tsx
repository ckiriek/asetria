'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { File, Download, Trash2, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ExtractEntitiesButton } from './extract-entities-button'

interface ProjectFile {
  id: string
  original_filename: string
  file_size: number
  mime_type: string
  uploaded_at: string
  storage_path: string
  parsed_content?: string
  metadata?: any
}

interface ProjectFilesListProps {
  projectId: string
  files: ProjectFile[]
}

export function ProjectFilesList({ projectId, files }: ProjectFilesListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-500" />
    } else if (mimeType.includes('text')) {
      return <FileText className="w-5 h-5 text-gray-500" />
    }
    return <File className="w-5 h-5 text-gray-400" />
  }

  const handleDownload = async (file: ProjectFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(file.storage_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.original_filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file')
    }
  }

  const handleDelete = async (file: ProjectFile) => {
    if (!confirm(`Are you sure you want to delete "${file.original_filename}"?`)) {
      return
    }

    setDeletingId(file.id)

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([file.storage_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file')
    } finally {
      setDeletingId(null)
    }
  }

  if (files.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploaded Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file.mime_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {file.original_filename}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>{formatDate(file.uploaded_at)}</span>
                    {file.parsed_content && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">✓ Parsed</span>
                      </>
                    )}
                    {file.metadata?.entities_extracted && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600">
                          ✓ {file.metadata.entities_count || 0} entities
                        </span>
                      </>
                    )}
                  </div>
                  {file.metadata?.note && (
                    <p className="text-xs text-amber-600 mt-1">
                      {file.metadata.note}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.parsed_content && (
                  <ExtractEntitiesButton
                    fileId={file.id}
                    projectId={projectId}
                    fileName={file.original_filename}
                    disabled={file.metadata?.entities_extracted}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(file)}
                  disabled={deletingId === file.id}
                  title="Delete"
                >
                  {deletingId === file.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

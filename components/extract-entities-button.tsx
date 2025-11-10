'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'

interface ExtractEntitiesButtonProps {
  fileId: string
  projectId: string
  fileName: string
  disabled?: boolean
}

export function ExtractEntitiesButton({ 
  fileId, 
  projectId, 
  fileName,
  disabled 
}: ExtractEntitiesButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleExtract = async () => {
    if (!confirm(`Extract entities from "${fileName}"?\n\nThis will use AI to identify compounds, indications, endpoints, and other clinical trial entities.`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/entities/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          projectId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to extract entities')
      }

      const data = await response.json()

      alert(`✅ Success!\n\nExtracted ${data.entitiesCount} entities from "${fileName}".\n\nEntities have been added to the project.`)
      router.refresh()
    } catch (error: any) {
      console.error('Extract error:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleExtract}
      disabled={loading || disabled}
      variant="outline"
      size="sm"
      title="Extract entities using AI"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Extracting...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Extract Entities
        </>
      )}
    </Button>
  )
}

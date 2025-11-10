'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Database, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FetchExternalDataButtonProps {
  projectId: string
}

export function FetchExternalDataButton({ projectId }: FetchExternalDataButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  const handleFetch = async () => {
    setLoading(true)
    setProgress('Fetching data from external sources...')

    try {
      const response = await fetch('/api/integrations/fetch-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch external data')
      }

      const data = await response.json()

      if (data.success) {
        const summary = [
          `✅ Fetched ${data.data.clinicalTrials} clinical trials from ClinicalTrials.gov`,
          `✅ Fetched ${data.data.publications} publications from PubMed`,
          `✅ Fetched ${data.data.safetyData} safety reports from openFDA`,
        ]

        if (data.data.errors && data.data.errors.length > 0) {
          summary.push('\n⚠️ Errors:')
          data.data.errors.forEach((error: string) => {
            summary.push(`  - ${error}`)
          })
        }

        alert(summary.join('\n'))
        router.refresh()
      } else {
        alert('Failed to fetch external data')
      }
    } catch (error) {
      console.error('Error fetching external data:', error)
      alert('Failed to fetch external data. Please try again.')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <Button 
      onClick={handleFetch} 
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {progress || 'Fetching...'}
        </>
      ) : (
        <>
          <Database className="w-4 h-4 mr-2" />
          Fetch External Data
        </>
      )}
    </Button>
  )
}

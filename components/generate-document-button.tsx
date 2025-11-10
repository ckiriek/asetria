'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function GenerateDocumentButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleGenerate = async (documentType: 'IB' | 'Protocol' | 'ICF' | 'Synopsis') => {
    setLoading(true)
    setShowMenu(false)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          documentType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate document')
      }

      const data = await response.json()
      
      if (data.success && data.document) {
        router.push(`/dashboard/documents/${data.document.id}`)
        router.refresh()
      } else {
        alert('Document generation failed')
      }
    } catch (error) {
      console.error('Error generating document:', error)
      alert('Failed to generate document. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button onClick={() => setShowMenu(!showMenu)} disabled={loading}>
        <Plus className="w-4 h-4 mr-2" />
        {loading ? 'Generating...' : 'Generate Document'}
      </Button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-10">
          <div className="py-1">
            <button
              onClick={() => handleGenerate('IB')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Investigator's Brochure (IB)
            </button>
            <button
              onClick={() => handleGenerate('Protocol')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Protocol
            </button>
            <button
              onClick={() => handleGenerate('ICF')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Informed Consent Form (ICF)
            </button>
            <button
              onClick={() => handleGenerate('Synopsis')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Protocol Synopsis
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Field Autocomplete Component
 * 
 * Specialized autocomplete for form fields with external API integration
 * Triggers search after 3 characters are entered
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'

interface FieldAutocompleteProps {
  value: string
  onChange: (value: string) => void
  endpoint: string // e.g., '/api/v1/autocomplete/compounds'
  placeholder?: string
  required?: boolean
  minChars?: number
  renderSuggestion?: (item: any) => React.ReactNode
  onSelect?: (item: any) => void
  className?: string
}

export function FieldAutocomplete({
  value,
  onChange,
  endpoint,
  placeholder,
  required = false,
  minChars = 3,
  renderSuggestion,
  onSelect,
  className = ''
}: FieldAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Debounced search
  const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < minChars) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${endpoint}?q=${encodeURIComponent(searchQuery)}&limit=10`
      )
      const data = await response.json()

      if (data.success && data.data) {
        setSuggestions(data.data)
        setIsOpen(data.data.length > 0)
      }
    } catch (error) {
      console.error('Autocomplete search failed:', error)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }, 300)

  useEffect(() => {
    debouncedSearch(value)
  }, [value, debouncedSearch])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSelect = (item: any) => {
    // Extract the primary value from the item
    let selectedValue = ''
    if (item.name) selectedValue = item.name
    else if (item.brand_name) selectedValue = item.brand_name
    else if (item.indication) selectedValue = item.indication
    else if (item.country) selectedValue = item.country
    else if (item.application_number) selectedValue = item.application_number

    onChange(selectedValue)
    onSelect?.(item)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const defaultRenderSuggestion = (item: any) => {
    // Compounds
    if (item.name && item.molecular_formula) {
      return (
        <div>
          <div className="font-medium text-sm">{item.name}</div>
          <div className="text-xs text-gray-500">
            {item.molecular_formula} • {item.source}
          </div>
        </div>
      )
    }

    // RLD
    if (item.brand_name && item.application_number) {
      return (
        <div>
          <div className="font-medium text-sm">{item.brand_name}</div>
          <div className="text-xs text-gray-500">
            {item.application_number} • {item.generic_name || 'RLD'}
            {item.te_code && ` • TE: ${item.te_code}`}
          </div>
        </div>
      )
    }

    // Indications
    if (item.indication) {
      return (
        <div>
          <div className="text-sm">{item.indication}</div>
          {item.count && (
            <div className="text-xs text-gray-500">
              {item.count} project{item.count > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )
    }

    // Countries
    if (item.country) {
      return <div className="text-sm">{item.country}</div>
    }

    // Fallback
    return <div className="text-sm">{JSON.stringify(item)}</div>
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(item)}
              className={`
                w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors
                ${selectedIndex === index ? 'bg-blue-50' : ''}
              `}
            >
              {renderSuggestion ? renderSuggestion(item) : defaultRenderSuggestion(item)}
            </button>
          ))}
        </div>
      )}

      {/* Hint */}
      {value.length > 0 && value.length < minChars && (
        <div className="text-xs text-gray-500 mt-1">
          Type at least {minChars} characters to search
        </div>
      )}
    </div>
  )
}

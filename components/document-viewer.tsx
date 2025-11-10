'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import { Card, CardContent } from '@/components/ui/card'
import 'highlight.js/styles/github.css'

interface DocumentViewerProps {
  content: string
  documentType?: string
}

interface TocItem {
  id: string
  text: string
  level: number
}

export function DocumentViewer({ content, documentType }: DocumentViewerProps) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeSection, setActiveSection] = useState<string>('')

  // Extract table of contents from markdown
  useEffect(() => {
    const headings: TocItem[] = []
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const text = match[2].trim()
        // Use same ID format as headings below (without index)
        const id = `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        headings.push({ id, text, level })
      }
    })
    
    setToc(headings)
  }, [content])

  // Scroll spy - highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = document.querySelectorAll('[data-heading-id]')
      let currentSection = ''

      headingElements.forEach((element) => {
        const rect = element.getBoundingClientRect()
        if (rect.top <= 100 && rect.bottom >= 0) {
          currentSection = element.getAttribute('data-heading-id') || ''
        }
      })

      setActiveSection(currentSection)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  const scrollToSection = (id: string) => {
    const element = document.querySelector(`[data-heading-id="${id}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex gap-6">
      {/* Table of Contents - Sidebar */}
      {toc.length > 0 && (
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 text-gray-900">
                  Table of Contents
                </h3>
                <nav className="space-y-1">
                  {toc.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`
                        block w-full text-left text-sm py-1.5 px-2 rounded transition-colors
                        ${item.level === 1 ? 'font-semibold' : ''}
                        ${item.level === 2 ? 'pl-4' : ''}
                        ${item.level === 3 ? 'pl-6 text-xs' : ''}
                        ${item.level >= 4 ? 'pl-8 text-xs' : ''}
                        ${
                          activeSection === item.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                components={{
                  // Add data-heading-id to all headings for scroll spy
                  h1: ({ node, children, ...props }) => {
                    const text = Array.isArray(children) ? children.join('') : String(children || '')
                    const id = `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                    return (
                      <h1 
                        data-heading-id={id} 
                        className="text-3xl font-bold mt-8 mb-4 text-gray-900 border-b pb-2"
                        {...props}
                      >
                        {children}
                      </h1>
                    )
                  },
                  h2: ({ node, children, ...props }) => {
                    const text = Array.isArray(children) ? children.join('') : String(children || '')
                    const id = `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                    return (
                      <h2 
                        data-heading-id={id} 
                        className="text-2xl font-semibold mt-6 mb-3 text-gray-900"
                        {...props}
                      >
                        {children}
                      </h2>
                    )
                  },
                  h3: ({ node, children, ...props }) => {
                    const text = Array.isArray(children) ? children.join('') : String(children || '')
                    const id = `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                    return (
                      <h3 
                        data-heading-id={id} 
                        className="text-xl font-semibold mt-5 mb-2 text-gray-800"
                        {...props}
                      >
                        {children}
                      </h3>
                    )
                  },
                  h4: ({ node, children, ...props }) => {
                    const text = Array.isArray(children) ? children.join('') : String(children || '')
                    const id = `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                    return (
                      <h4 
                        data-heading-id={id} 
                        className="text-lg font-semibold mt-4 mb-2 text-gray-800"
                        {...props}
                      >
                        {children}
                      </h4>
                    )
                  },
                  // Style tables
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-6">
                      <table className="min-w-full divide-y divide-gray-200 border" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-gray-50" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-4 py-3 text-sm text-gray-900 border-b" {...props} />
                  ),
                  // Style code blocks
                  code: ({ node, inline, className, children, ...props }: any) => {
                    if (inline) {
                      return (
                        <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      )
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  // Style blockquotes
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic" {...props} />
                  ),
                  // Style lists
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside my-4 space-y-2 text-gray-700" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside my-4 space-y-2 text-gray-700" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="ml-4" {...props} />
                  ),
                  // Style links
                  a: ({ node, ...props }) => (
                    <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
                  ),
                  // Style paragraphs
                  p: ({ node, ...props }) => (
                    <p className="my-4 text-gray-700 leading-relaxed" {...props} />
                  ),
                  // Style horizontal rules
                  hr: ({ node, ...props }) => (
                    <hr className="my-8 border-gray-300" {...props} />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

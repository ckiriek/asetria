/**
 * PubMed/NCBI Entrez API Client
 * API Documentation: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 */

export interface Publication {
  pmid: string
  title: string
  authors: string[]
  journal: string
  year: string
  abstract?: string
  doi?: string
  pubmedUrl: string
}

export class PubMedClient {
  private baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  private email = 'asetria@example.com' // Required by NCBI
  private tool = 'asetria'

  /**
   * Search PubMed articles
   */
  async search(query: string, limit: number = 10): Promise<Publication[]> {
    try {
      // Step 1: Search for PMIDs
      const searchParams = new URLSearchParams({
        db: 'pubmed',
        term: query,
        retmax: limit.toString(),
        retmode: 'json',
        email: this.email,
        tool: this.tool,
      })

      const searchResponse = await fetch(`${this.baseUrl}/esearch.fcgi?${searchParams}`)
      
      if (!searchResponse.ok) {
        throw new Error(`PubMed search error: ${searchResponse.statusText}`)
      }

      const searchData = await searchResponse.json()
      const pmids = searchData.esearchresult?.idlist || []

      if (pmids.length === 0) {
        return []
      }

      // Step 2: Fetch article details
      return await this.fetchArticles(pmids)
    } catch (error) {
      console.error('PubMed search error:', error)
      return []
    }
  }

  /**
   * Get article by PMID
   */
  async getArticle(pmid: string): Promise<Publication | null> {
    try {
      const articles = await this.fetchArticles([pmid])
      return articles[0] || null
    } catch (error) {
      console.error('PubMed get article error:', error)
      return null
    }
  }

  /**
   * Fetch article details by PMIDs
   */
  private async fetchArticles(pmids: string[]): Promise<Publication[]> {
    try {
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        id: pmids.join(','),
        retmode: 'xml',
        email: this.email,
        tool: this.tool,
      })

      const fetchResponse = await fetch(`${this.baseUrl}/efetch.fcgi?${fetchParams}`)
      
      if (!fetchResponse.ok) {
        throw new Error(`PubMed fetch error: ${fetchResponse.statusText}`)
      }

      const xmlText = await fetchResponse.text()
      return this.parseXML(xmlText)
    } catch (error) {
      console.error('PubMed fetch articles error:', error)
      return []
    }
  }

  /**
   * Parse PubMed XML response
   */
  private parseXML(xmlText: string): Publication[] {
    const publications: Publication[] = []
    
    // Simple XML parsing (in production, use a proper XML parser)
    const articleMatches = xmlText.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g)
    
    for (const match of articleMatches) {
      const articleXml = match[1]
      
      const pmid = this.extractTag(articleXml, 'PMID') || ''
      const title = this.extractTag(articleXml, 'ArticleTitle') || ''
      const journal = this.extractTag(articleXml, 'Title') || ''
      const year = this.extractTag(articleXml, 'Year') || ''
      const abstract = this.extractTag(articleXml, 'AbstractText') || undefined
      const doi = this.extractTag(articleXml, 'ELocationID', 'doi') || undefined
      
      // Extract authors
      const authors: string[] = []
      const authorMatches = articleXml.matchAll(/<Author[^>]*>([\s\S]*?)<\/Author>/g)
      for (const authorMatch of authorMatches) {
        const authorXml = authorMatch[1]
        const lastName = this.extractTag(authorXml, 'LastName')
        const foreName = this.extractTag(authorXml, 'ForeName')
        if (lastName) {
          authors.push(foreName ? `${lastName} ${foreName}` : lastName)
        }
      }
      
      publications.push({
        pmid,
        title,
        authors: authors.slice(0, 10), // Limit to first 10 authors
        journal,
        year,
        abstract,
        doi,
        pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      })
    }
    
    return publications
  }

  /**
   * Extract tag content from XML
   */
  private extractTag(xml: string, tag: string, type?: string): string | undefined {
    let pattern: RegExp
    
    if (type) {
      pattern = new RegExp(`<${tag}[^>]*EIdType="${type}"[^>]*>([^<]*)<\/${tag}>`, 'i')
    } else {
      pattern = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i')
    }
    
    const match = xml.match(pattern)
    return match ? match[1].trim() : undefined
  }
}

export const pubMedClient = new PubMedClient()

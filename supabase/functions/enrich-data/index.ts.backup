/**
 * Enrich Data Edge Function
 * 
 * Regulatory Data Agent - Step 1: PubChem Resolution
 * 
 * Process:
 * 1. Fetch project data
 * 2. Resolve compound name to InChIKey (PubChem)
 * 3. Fetch full compound data
 * 4. Store in compounds table
 * 5. Update project with inchikey and enrichment status
 * 6. Log operation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnrichRequest {
  project_id: string
}

interface PubChemCompoundResponse {
  PC_Compounds: Array<{
    id: {
      id: {
        cid: number
      }
    }
    props: Array<{
      urn: {
        label: string
        name?: string
      }
      value: {
        sval?: string
        fval?: number
        ival?: number
      }
    }>
  }>
}

/**
 * PubChem Adapter (simplified for Edge Function)
 */
class PubChemAdapter {
  private baseUrl = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug'
  private lastRequestTime = 0
  private minRequestInterval = 200

  private async rateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest))
    }
    this.lastRequestTime = Date.now()
  }

  async resolveToInChIKey(name: string): Promise<string | null> {
    try {
      await this.rateLimit()

      const searchUrl = `${this.baseUrl}/compound/name/${encodeURIComponent(name)}/cids/JSON`
      const searchResponse = await fetch(searchUrl)

      if (!searchResponse.ok) {
        if (searchResponse.status === 404) {
          console.warn(`PubChem: Compound "${name}" not found`)
          return null
        }
        throw new Error(`PubChem search failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const cid = searchData.IdentifierList?.CID?.[0]

      if (!cid) {
        return null
      }

      await this.rateLimit()
      const inchikeyUrl = `${this.baseUrl}/compound/cid/${cid}/property/InChIKey/JSON`
      const inchikeyResponse = await fetch(inchikeyUrl)

      if (!inchikeyResponse.ok) {
        throw new Error(`PubChem InChIKey fetch failed: ${inchikeyResponse.status}`)
      }

      const inchikeyData = await inchikeyResponse.json()
      const inchikey = inchikeyData.PropertyTable?.Properties?.[0]?.InChIKey

      console.log(`✅ PubChem: Resolved "${name}" → ${inchikey} (CID: ${cid})`)
      return inchikey || null

    } catch (error) {
      console.error(`PubChem resolveToInChIKey error:`, error)
      return null
    }
  }

  async fetchCompound(name: string): Promise<any | null> {
    try {
      await this.rateLimit()

      const searchUrl = `${this.baseUrl}/compound/name/${encodeURIComponent(name)}/cids/JSON`
      const searchResponse = await fetch(searchUrl)

      if (!searchResponse.ok) {
        return null
      }

      const searchData = await searchResponse.json()
      const cid = searchData.IdentifierList?.CID?.[0]

      if (!cid) {
        return null
      }

      await this.rateLimit()
      const compoundUrl = `${this.baseUrl}/compound/cid/${cid}/JSON`
      const compoundResponse = await fetch(compoundUrl)

      if (!compoundResponse.ok) {
        throw new Error(`PubChem compound fetch failed: ${compoundResponse.status}`)
      }

      const compoundData: PubChemCompoundResponse = await compoundResponse.json()
      const pcCompound = compoundData.PC_Compounds?.[0]

      if (!pcCompound) {
        return null
      }

      const props = pcCompound.props || []
      const getProp = (label: string): string | number | undefined => {
        const prop = props.find(p => p.urn.label === label || p.urn.name === label)
        return prop?.value?.sval || prop?.value?.fval || prop?.value?.ival
      }

      const inchikey = getProp('InChIKey') as string
      const iupacName = getProp('IUPAC Name') as string
      const molecularFormula = getProp('Molecular Formula') as string
      const molecularWeight = getProp('Molecular Weight') as number
      const smiles = getProp('SMILES') as string
      const synonyms = (getProp('Synonym') as string)?.split('\n') || []

      if (!inchikey) {
        return null
      }

      return {
        inchikey,
        name: iupacName || name,
        synonyms: synonyms.slice(0, 10),
        molecular_weight: molecularWeight,
        molecular_formula: molecularFormula,
        smiles,
        chemical_structure_url: `https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${cid}&t=l`,
        source: 'PubChem',
        source_id: cid.toString(),
        source_url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
        retrieved_at: new Date().toISOString(),
        confidence: 'high',
      }

    } catch (error) {
      console.error(`PubChem fetchCompound error:`, error)
      return null
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const { project_id }: EnrichRequest = await req.json()

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🚀 Starting enrichment for project: ${project_id}`)

    // 1. Fetch project
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      console.error('Project not found:', projectError)
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()
    const errors: Array<{ code: string; message: string; source: string; severity: string }> = []

    // 2. Resolve compound name to InChIKey
    console.log(`🔍 Resolving compound: ${project.compound_name}`)
    const pubchem = new PubChemAdapter()
    const inchikey = await pubchem.resolveToInChIKey(project.compound_name)

    if (!inchikey) {
      console.error(`❌ Failed to resolve InChIKey for: ${project.compound_name}`)
      
      // Log error
      errors.push({
        code: 'E301_IDENTITY_UNRESOLVED',
        message: `Could not resolve compound name "${project.compound_name}" to InChIKey`,
        source: 'PubChem',
        severity: 'error',
      })

      // Update project status to failed
      await supabaseClient
        .from('projects')
        .update({
          enrichment_status: 'failed',
          enrichment_completed_at: new Date().toISOString(),
          enrichment_metadata: {
            started_at: project.enrichment_metadata?.started_at,
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            errors,
            coverage: {
              compound_identity: 0,
              labels: 0,
              nonclinical: 0,
              clinical: 0,
              literature: 0,
            },
          },
        })
        .eq('id', project_id)

      // Log ingestion
      await supabaseClient
        .from('ingestion_logs')
        .insert({
          operation_type: 'enrich',
          inchikey: null,
          source_adapter: 'PubChem',
          status: 'failed',
          error_code: 'E301_IDENTITY_UNRESOLVED',
          error_message: `Could not resolve "${project.compound_name}"`,
          records_fetched: 0,
          records_inserted: 0,
          duration_ms: Date.now() - startTime,
          triggered_by: 'api',
          project_id,
        })

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to resolve compound identity',
          errors 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Fetch full compound data
    console.log(`📥 Fetching compound data for InChIKey: ${inchikey}`)
    const compoundData = await pubchem.fetchCompound(project.compound_name)

    if (compoundData) {
      // 4. Store in compounds table (upsert)
      const { error: insertError } = await supabaseClient
        .from('compounds')
        .upsert({
          ...compoundData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'inchikey',
        })

      if (insertError) {
        console.error('Failed to insert compound:', insertError)
        errors.push({
          code: 'E102_DATABASE_INSERT_FAILED',
          message: `Failed to store compound data: ${insertError.message}`,
          source: 'Database',
          severity: 'error',
        })
      } else {
        console.log(`✅ Stored compound data in database`)
      }
    }

    // 5. Update project with inchikey and status
    const duration = Date.now() - startTime
    await supabaseClient
      .from('projects')
      .update({
        inchikey,
        enrichment_status: 'completed',
        enrichment_completed_at: new Date().toISOString(),
        enrichment_metadata: {
          started_at: project.enrichment_metadata?.started_at,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          sources_used: ['PubChem'],
          coverage: {
            compound_identity: 1.0,
            labels: 0,
            nonclinical: 0,
            clinical: 0,
            literature: 0,
          },
          errors: errors.length > 0 ? errors : undefined,
          records_fetched: {
            labels: 0,
            trials: 0,
            literature: 0,
            adverse_events: 0,
          },
        },
      })
      .eq('id', project_id)

    // 6. Log ingestion
    await supabaseClient
      .from('ingestion_logs')
      .insert({
        operation_type: 'enrich',
        inchikey,
        source_adapter: 'PubChem',
        status: 'completed',
        records_fetched: 1,
        records_inserted: compoundData ? 1 : 0,
        duration_ms: duration,
        triggered_by: 'api',
        project_id,
      })

    console.log(`✅ Enrichment completed in ${duration}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        project_id,
        inchikey,
        duration_ms: duration,
        message: 'Enrichment completed successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Enrich Data Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

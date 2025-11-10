import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  projectId: string
  documentType: 'IB' | 'Protocol' | 'ICF' | 'Synopsis'
  userId: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { projectId, documentType, userId }: GenerateRequest = await req.json()

    // 1. Fetch project data
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError

    // 2. Fetch entities for this project
    const { data: entities, error: entitiesError } = await supabaseClient
      .from('entities_corpus')
      .select('*')
      .eq('project_id', projectId)

    if (entitiesError) throw entitiesError

    // 3. Fetch evidence sources
    const { data: evidence, error: evidenceError } = await supabaseClient
      .from('evidence_sources')
      .select('*')
      .eq('project_id', projectId)

    if (evidenceError) throw evidenceError

    // 4. Build context for AI generation
    const context = {
      project: {
        title: project.title,
        phase: project.phase,
        indication: project.indication,
        countries: project.countries,
        design: project.design_json,
      },
      entities: entities.reduce((acc, entity) => {
        if (!acc[entity.entity_type]) acc[entity.entity_type] = {}
        acc[entity.entity_type][entity.entity_key] = entity.entity_value
        return acc
      }, {} as Record<string, any>),
      evidence: {
        clinical_trials: evidence.filter(e => e.source === 'ClinicalTrials.gov'),
        publications: evidence.filter(e => e.source === 'PubMed'),
        safety_data: evidence.filter(e => e.source === 'openFDA'),
      },
    }

    // 5. Call Azure OpenAI (placeholder - will implement in next step)
    const generatedContent = await generateWithAI(documentType, context)

    // 6. Create document record with content
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .insert({
        project_id: projectId,
        type: documentType,
        version: 1,
        status: 'draft',
        created_by: userId,
        content: generatedContent,
      })
      .select()
      .single()

    if (docError) throw docError

    // 7. Log audit trail
    await supabaseClient.from('audit_log').insert({
      project_id: projectId,
      document_id: document.id,
      action: 'document_generated',
      diff_json: { document_type: documentType, version: 1 },
      actor_user_id: userId,
    })

    return new Response(
      JSON.stringify({
        success: true,
        document: document,
        content: generatedContent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

/**
 * Generate specialized prompt based on document type
 */
function generatePrompt(documentType: string, context: any): string {
  const promptContext = {
    projectTitle: context.project.title,
    compoundName: context.entities.compounds?.[0] || 'Investigational Compound',
    indication: context.project.indication,
    phase: context.project.phase,
    sponsor: 'Sponsor Name', // TODO: Add to project metadata
    design: context.project.design, // Include design_json with primary_endpoint
    entities: context.entities.all || [],
    clinicalTrials: context.evidence.clinical_trials || [],
    publications: context.evidence.publications || [],
    safetyData: context.evidence.safety_data || []
  }

  switch (documentType.toUpperCase()) {
    case 'IB':
      return `You are an expert medical writer specializing in regulatory documentation for clinical trials. Generate a comprehensive Investigator's Brochure (IB) that complies with ICH E6 (R2) Good Clinical Practice guidelines.

## CONTEXT
**Project:** ${promptContext.projectTitle}
**Compound:** ${promptContext.compoundName}
**Indication:** ${promptContext.indication}
**Phase:** ${promptContext.phase}

## STRUCTURE (ICH E6 Section 7)
1. Title Page
2. Table of Contents
3. Summary (1-2 pages)
4. Introduction
5. Physical, Chemical, and Pharmaceutical Properties
6. Nonclinical Studies
   - Pharmacology
   - Pharmacokinetics
   - Toxicology
7. Effects in Humans
   - Pharmacokinetics
   - Pharmacodynamics
   - Efficacy
   - Safety and Tolerability
8. Summary of Data and Guidance for Investigator
9. References

## REQUIREMENTS
- Formal, scientific tone
- ICH E6 compliant
- Comprehensive but concise
- Balanced presentation of benefits and risks
- Clear guidance for investigators

Generate the complete IB in markdown format.`

    case 'PROTOCOL':
      return `You are an expert clinical trial protocol writer. Generate a comprehensive Clinical Trial Protocol that complies with ICH E6 Section 6 requirements.

## CONTEXT
**Project:** ${promptContext.projectTitle}
**Compound:** ${promptContext.compoundName}
**Indication:** ${promptContext.indication}
**Phase:** ${promptContext.phase}

## STRUCTURE (ICH E6 Section 6)
1. Title Page & Synopsis
2. Introduction & Background
3. Study Objectives & Endpoints
4. Study Design
5. Study Population (Inclusion/Exclusion)
6. Study Treatments
7. Study Procedures & Assessments
8. Safety Monitoring
9. Statistical Considerations
10. Ethical & Regulatory Considerations

## REQUIREMENTS
- Clear, unambiguous instructions
- Operationally feasible
- Scientifically rigorous
- Ethically sound
- ICH E6 compliant

Generate the complete protocol in markdown format.`

    case 'ICF':
      return `You are an expert in creating patient-centered informed consent documents. Generate an Informed Consent Form (ICF) that complies with FDA 21 CFR Part 50 and ICH E6 requirements.

## CONTEXT
**Study:** ${promptContext.projectTitle}
**Drug:** ${promptContext.compoundName}
**Condition:** ${promptContext.indication}
**Phase:** ${promptContext.phase}

## STRUCTURE (FDA 21 CFR 50.25)
1. Introduction & Invitation
2. Why is this study being done?
3. What will happen if I take part?
4. What are the risks?
5. What are the benefits?
6. What other choices do I have?
7. Confidentiality
8. Costs & Payment
9. What if I am injured?
10. What are my rights?
11. Consent Signatures

## REQUIREMENTS
- 6th-8th grade reading level
- Patient-friendly language
- No medical jargon
- Clear explanation of risks/benefits
- Voluntary participation emphasized
- FDA 21 CFR 50 compliant

Generate the complete ICF in markdown format.`

    case 'SYNOPSIS':
      return `You are an expert medical writer specializing in clinical study reports. Generate a Clinical Study Synopsis that complies with ICH E3 Section 2 requirements.

## CONTEXT
**Study:** ${promptContext.projectTitle}
**Compound:** ${promptContext.compoundName}
**Indication:** ${promptContext.indication}
**Phase:** ${promptContext.phase}

## STRUCTURE (ICH E3 Section 2)
1. Synopsis Header (tabular)
2. Study Objectives
3. Study Design
4. Study Endpoints
5. Study Population
6. Statistical Methods
7. Efficacy Results
8. Safety Results
9. Pharmacokinetics (if applicable)
10. Conclusions

## REQUIREMENTS
- Concise (2-5 pages)
- Tabular format for key data
- Factual, no interpretation
- ICH E3 compliant
- Standalone summary

Generate the complete synopsis in markdown format.`

    default:
      return `Generate a ${documentType} document for ${promptContext.projectTitle} (${promptContext.compoundName} for ${promptContext.indication}).`
  }
}

/**
 * Generate document content using Azure OpenAI
 */
async function generateWithAI(documentType: string, context: any): Promise<string> {
  const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT')
  const azureKey = Deno.env.get('AZURE_OPENAI_API_KEY')
  
  if (!azureEndpoint || !azureKey) {
    // Return structured placeholder if Azure OpenAI not configured
    return generatePlaceholder(documentType, context)
  }
  
  try {
    // Call Azure OpenAI with specialized prompt
    const deployment = Deno.env.get('AZURE_OPENAI_DEPLOYMENT_NAME') || 'gpt-4.1'
    const apiVersion = Deno.env.get('AZURE_OPENAI_API_VERSION') || '2025-01-01-preview'
    
    const url = `${azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`
    
    const prompt = generatePrompt(documentType, context)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert medical writer specializing in regulatory-compliant clinical trial documentation. You follow ICH E6, ICH E3, FDA 21 CFR, and EMA guidelines. You write in a clear, precise, and scientifically rigorous style.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.3, // Lower temperature for more consistent, factual output
      }),
    })
    
    if (!response.ok) {
      console.error('Azure OpenAI error:', await response.text())
      return generatePlaceholder(documentType, context)
    }
    
    const data = await response.json()
    return data.choices[0]?.message?.content || generatePlaceholder(documentType, context)
    
  } catch (error) {
    console.error('Error calling Azure OpenAI:', error)
    return generatePlaceholder(documentType, context)
  }
}

function generatePlaceholder(documentType: string, context: any): string {
  return `# ${documentType} - ${context.project.title}

## Generated Document (Placeholder)

This document will be generated using Azure OpenAI with the following context:
- Project: ${context.project.title}
- Phase: ${context.project.phase}
- Indication: ${context.project.indication}

Entities available: ${Object.keys(context.entities).join(', ')}
Evidence sources: ${context.evidence.clinical_trials.length} clinical trials, ${context.evidence.publications.length} publications

Full AI generation will be implemented when Azure OpenAI credentials are configured.`
}

function getSystemPrompt(documentType: string): string {
  const prompts = {
    IB: `You are an expert medical writer. Generate an Investigator's Brochure strictly aligned to ICH E6 structure.
Include: Title Page, Table of Contents, Summary, Introduction (chemical/pharmaceutical properties), 
Nonclinical Studies (pharmacology, toxicology), Clinical Studies (pharmacokinetics, efficacy, safety), References.
Mark missing data clearly and cite all sources.`,
    
    Protocol: `You are an expert medical writer. Generate a Clinical Trial Protocol following ICH E6 guidelines.
Include: Synopsis, Introduction, Objectives, Study Design, Selection Criteria, Treatment Plan, 
Assessments, Statistics, Ethics, Data Management, References.`,
    
    ICF: `You are an expert medical writer. Generate an Informed Consent Form following ICH-GCP and local regulations.
Include: Study purpose, procedures, risks/benefits, alternatives, confidentiality, voluntary participation, contacts.
Use clear, non-technical language appropriate for patients.`,
    
    Synopsis: `You are an expert medical writer. Generate a Protocol Synopsis.
Include: Study title, phase, objectives, design, population, interventions, endpoints, sample size, duration.
Keep concise (2-3 pages maximum).`,
  }
  
  return prompts[documentType as keyof typeof prompts] || prompts.IB
}

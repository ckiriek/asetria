import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { fileId, projectId } = await req.json()

    if (!fileId || !projectId) {
      throw new Error('File ID and Project ID are required')
    }

    // Get file details
    const { data: file, error: fileError } = await supabaseClient
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .eq('project_id', projectId)
      .single()

    if (fileError || !file) {
      throw new Error('File not found')
    }

    // Get project details
    const { data: project } = await supabaseClient
      .from('projects')
      .select('title, indication')
      .eq('id', projectId)
      .single()

    const text = file.parsed_content || ''
    
    if (!text || text.length < 10) {
      throw new Error('No parsed content available. Please ensure the file has been parsed.')
    }

    // Generate entity extraction prompt
    const prompt = `You are an expert medical information extraction system specialized in clinical trial documentation. Your task is to extract structured entities from the provided text.

## CONTEXT
- File: ${file.original_filename}
${project?.title ? `- Project: ${project.title}` : ''}
${project?.indication ? `- Indication: ${project.indication}` : ''}

## TASK
Extract the following types of entities from the text:

1. COMPOUNDS / DRUGS (generic names, brand names, dosages)
2. INDICATIONS / CONDITIONS (diseases, medical conditions)
3. ENDPOINTS (primary, secondary, outcome measures)
4. DOSAGES (amounts, regimens, frequency)
5. POPULATIONS (inclusion/exclusion criteria, demographics)
6. STUDY DESIGN (type, blinding, randomization)
7. LOCATIONS (countries, sites)
8. DATES (start, end, milestones)
9. SPONSORS / ORGANIZATIONS
10. REGULATORY (agencies, approvals)

## OUTPUT FORMAT
Return a JSON array of entities:
[
  {
    "type": "compound|indication|endpoint|dosage|population|study_design|location|date|sponsor|regulatory",
    "value": "extracted value",
    "context": "surrounding text",
    "confidence": "high|medium|low"
  }
]

## TEXT TO ANALYZE
\`\`\`
${text.substring(0, 8000)}${text.length > 8000 ? '\n... (truncated for length)' : ''}
\`\`\`

Return ONLY a valid JSON array. No additional text.`

    // Call Azure OpenAI
    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT')
    const azureApiKey = Deno.env.get('AZURE_OPENAI_API_KEY')
    const deploymentName = Deno.env.get('AZURE_OPENAI_DEPLOYMENT_NAME')

    if (!azureEndpoint || !azureApiKey || !deploymentName) {
      throw new Error('Azure OpenAI configuration missing')
    }

    const response = await fetch(
      `${azureEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureApiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a medical entity extraction expert. Return only valid JSON arrays.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure OpenAI error: ${errorText}`)
    }

    const aiResponse = await response.json()
    const content = aiResponse.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from AI')
    }

    // Parse entities
    let entities = []
    try {
      const parsed = JSON.parse(content)
      entities = Array.isArray(parsed) ? parsed : parsed.entities || []
    } catch (e) {
      console.error('Failed to parse AI response:', content)
      throw new Error('Invalid JSON response from AI')
    }

    // Validate and save entities
    const validTypes = [
      'compound', 'indication', 'endpoint', 'dosage', 'population',
      'study_design', 'location', 'date', 'sponsor', 'regulatory'
    ]

    const savedEntities = []

    for (const entity of entities) {
      if (!entity.type || !entity.value || !validTypes.includes(entity.type)) {
        continue
      }

      const { data: savedEntity, error: saveError } = await supabaseClient
        .from('entities_corpus')
        .insert({
          project_id: projectId,
          entity_type: entity.type,
          entity_value: entity.value,
          context: entity.context || null,
          confidence: entity.confidence || 'medium',
          source: 'file_extraction',
          source_reference: file.original_filename,
        })
        .select()
        .single()

      if (!saveError && savedEntity) {
        savedEntities.push(savedEntity)
      }
    }

    // Update file metadata
    await supabaseClient
      .from('project_files')
      .update({
        metadata: {
          ...file.metadata,
          entities_extracted: true,
          entities_count: savedEntities.length,
          extracted_at: new Date().toISOString(),
        },
      })
      .eq('id', fileId)

    // Log audit trail
    await supabaseClient.from('audit_log').insert({
      project_id: projectId,
      actor_user_id: user.id,
      action: 'entities_extracted',
      diff_json: {
        fileId,
        fileName: file.original_filename,
        entitiesCount: savedEntities.length,
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        entitiesCount: savedEntities.length,
        entities: savedEntities,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

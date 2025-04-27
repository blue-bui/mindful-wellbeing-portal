
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Analyze responses function called')
    
    // Parse request body
    const requestData = await req.json()
    const { question_set_id, responses } = requestData

    if (!question_set_id || !responses || !Array.isArray(responses)) {
      console.error('Invalid request data:', requestData)
      throw new Error('Invalid request data: missing question_set_id or responses array')
    }

    console.log(`Processing analysis for question set ${question_set_id} with ${responses.length} responses`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      throw new Error('Server configuration error: missing Supabase credentials')
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Get the question set to retrieve employee_id and hr_id
    const { data: questionSet, error: questionSetError } = await supabaseClient
      .from('question_sets')
      .select('employee_id, hr_id')
      .eq('id', question_set_id)
      .single()

    if (questionSetError) {
      console.error('Error fetching question set:', questionSetError)
      throw new Error(`Failed to fetch question set: ${questionSetError.message}`)
    }

    if (!questionSet) {
      console.error('Question set not found:', question_set_id)
      throw new Error('Question set not found')
    }

    console.log('Question set data:', questionSet)

    // Get full questions data to include in the analysis
    const { data: questions, error: questionsError } = await supabaseClient
      .from('questions')
      .select('id, question_text, answer_text')
      .eq('question_set_id', question_set_id)

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      throw new Error(`Failed to fetch questions: ${questionsError.message}`)
    }

    // Match responses with full question data
    const fullResponses = responses.map(r => {
      const matchingQuestion = questions.find(q => q.id === r.id)
      if (!matchingQuestion) {
        console.warn(`No matching question found for response id ${r.id}`)
      }
      return {
        id: r.id,
        question_text: matchingQuestion?.question_text || 'Unknown question',
        answer_text: r.answer_text || matchingQuestion?.answer_text || 'No answer provided'
      }
    })

    console.log('Prepared responses for analysis:', JSON.stringify(fullResponses))

    // Check if GEMINI_API_KEY is set
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found in environment variables')
      throw new Error('Server configuration error: GEMINI_API_KEY is not set')
    }
    
    // Verify API key format - without revealing the key in logs
    if (!geminiApiKey || geminiApiKey.length < 20) {
      console.error('GEMINI_API_KEY appears to be invalid: too short or not set properly')
      throw new Error('Server configuration error: GEMINI_API_KEY is invalid')
    }

    console.log(`GEMINI_API_KEY verification: Length=${geminiApiKey.length}, Format check=${geminiApiKey.length > 20 ? "Passed" : "Failed"}`)

    // Format questions and answers for Gemini API
    const analysisPrompt = `You are a mental health assessment expert specializing in detecting suicidal tendencies. Given the following questions and answers, analyze each response and classify it as "low", "medium", or "high" risk in terms of suicidal tendencies. 

Respond ONLY in this exact JSON format:
{
  "responses": [
    {"question_id": "QUESTION_ID", "risk_level": "low/medium/high", "probability": 0.XX, "reasoning": "brief explanation"},
    // for all responses
  ],
  "overall_risk": "low/medium/high",
  "explanation": "brief explanation of overall assessment"
}

Base your assessment on these factors:
- Expression of hopelessness
- Signs of isolation
- Mentions of self-harm or death
- Emotional distress levels
- Support system presence
- Loss of motivation
- Disrupted sleep patterns
- Negative view of future
- Feeling of worthlessness

IMPORTANT: If EVEN ONE response indicates high risk, the overall_risk should be "high".

Questions and Answers to analyze:
${fullResponses.map((r, i) => `[${i+1}] Question ID: ${r.id}\nQ: ${r.question_text}\nA: ${r.answer_text}`).join('\n\n')}

Important: Return ONLY the JSON. Do not include any additional text before or after.`

    console.log('Sending analysis prompt to Gemini API - using model: gemini-1.5-pro')

    try {
      // Call Gemini API for analysis with proper error handling and authentication
      const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
      console.log(`Calling Gemini API at ${geminiUrl}`)
      
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey // This is the correct header format for Google APIs
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: analysisPrompt
            }]
          }]
        })
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text()
        console.error(`Gemini API error (${geminiResponse.status}):`, errorText)
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${geminiResponse.statusText}. Details: ${errorText}`)
      }

      const geminiData = await geminiResponse.json()
      console.log('Gemini API response received')

      // Extract and parse the JSON response
      let analysis
      try {
        const responseText = geminiData.candidates[0].content.parts[0].text
        console.log('Raw Gemini response:', responseText)
        
        // Clean and parse the JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const jsonText = jsonMatch[0]
          analysis = JSON.parse(jsonText)
          console.log('Parsed analysis:', JSON.stringify(analysis))
        } else {
          console.error('Could not find JSON in Gemini response')
          throw new Error('Invalid response format from Gemini API')
        }
      } catch (error) {
        console.error('Error parsing Gemini response:', error)
        throw new Error(`Failed to parse analysis results: ${error.message}`)
      }

      // Validate the analysis structure
      if (!analysis || !analysis.responses || !analysis.overall_risk) {
        console.error('Analysis result is missing required fields:', analysis)
        throw new Error('Invalid analysis result structure')
      }

      console.log('Updating question set status and risk level')
      
      // Update question set status and risk level
      const { error: updateSetError } = await supabaseClient
        .from('question_sets')
        .update({ 
          status: 'analyzed',
          risk_level: analysis.overall_risk,
          completed_at: new Date().toISOString()
        })
        .eq('id', question_set_id)

      if (updateSetError) {
        console.error('Error updating question set:', updateSetError)
        throw new Error(`Failed to update question set: ${updateSetError.message}`)
      }

      console.log('Updating individual questions with risk levels')
      
      // Update individual questions with their risk levels
      for (const result of analysis.responses) {
        const { error: updateError } = await supabaseClient
          .from('questions')
          .update({ 
            status: 'analyzed',
            risk_level: result.risk_level
          })
          .eq('id', result.question_id)

        if (updateError) {
          console.error(`Error updating question ${result.question_id}:`, updateError)
        }
      }

      console.log('Creating analysis history record')
      
      // Create analysis history record
      const { error: historyError } = await supabaseClient
        .from('question_history')
        .insert({
          question_set_id: question_set_id,
          employee_id: questionSet.employee_id,
          hr_id: questionSet.hr_id,
          overall_risk_level: analysis.overall_risk,
          completed_at: new Date().toISOString()
        })

      if (historyError) {
        console.error('Error creating history record:', historyError)
      }

      console.log('Analysis process completed successfully')
      
      return new Response(
        JSON.stringify({
          status: 'success',
          results: analysis.responses,
          overall_risk_level: analysis.overall_risk,
          explanation: analysis.explanation
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (apiError) {
      console.error('API request or processing error:', apiError)
      throw new Error(`API error: ${apiError.message}`)
    }
  } catch (error) {
    console.error('Error in analyze-responses function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

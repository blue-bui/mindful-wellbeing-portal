
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
    const { question_set_id, responses } = await req.json()

    if (!question_set_id || !responses || !Array.isArray(responses)) {
      throw new Error('Invalid request data')
    }

    console.log('Received data:', { question_set_id, responseCount: responses.length })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
      return {
        id: r.id,
        question_text: matchingQuestion?.question_text || 'Unknown question',
        answer_text: r.answer_text || matchingQuestion?.answer_text || 'No answer provided'
      }
    })

    console.log('Prepared responses for analysis:', fullResponses)

    // Format questions and answers for Gemini API
    const analysisPrompt = `You are a mental health assessment expert. Given the following questions and answers, analyze each response and classify it as "low", "medium", or "high" risk in terms of suicidal tendencies. 

Questions and Answers to analyze:
${fullResponses.map((r) => `Q: ${r.question_text}\nA: ${r.answer_text}\n`).join('\n')}

Please provide your analysis in this exact JSON format:
{
  "responses": [
    {"question_id": "${fullResponses[0]?.id || 'example-id'}", "risk_level": "low/medium/high", "probability": 0.XX},
    // ... for all responses
  ],
  "overall_risk": "low/medium/high",
  "explanation": "brief explanation of overall assessment"
}

Base your assessment on factors like:
- Expression of hopelessness
- Signs of isolation
- Mentions of self-harm
- Emotional distress levels
- Support system presence`

    console.log('Sending prompt to Gemini API')

    // Check if GEMINI_API_KEY is set
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables')
    }

    // Call Gemini API for analysis
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${geminiApiKey}`
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
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${geminiResponse.statusText}`)
    }

    const geminiData = await geminiResponse.json()
    console.log('Gemini API response received')

    let analysis
    try {
      // Extract the JSON response from Gemini's text output
      const responseText = geminiData.candidates[0].content.parts[0].text
      console.log('Raw Gemini response:', responseText)
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
        console.log('Parsed analysis:', analysis)
      } else {
        throw new Error('Could not parse JSON from Gemini response')
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error)
      throw new Error(`Failed to parse analysis results: ${error.message}`)
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

  } catch (error) {
    console.error('Error in analyze-responses function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

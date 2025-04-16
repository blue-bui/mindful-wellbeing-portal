
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables')
    }

    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Prompt is required and must be a non-empty string')
    }

    // Create context-aware prompt for generating psychological assessment questions
    const enhancedPrompt = `Based on this context about an employee: "${prompt}", generate 10 psychologically-informed questions that can help assess potential suicidal tendencies. The questions should be professional, empathetic, and indirect. Focus on emotional states, work-life balance, and mental well-being. Format the response as a JSON array of strings.`

    console.log(`Sending request to Gemini API with prompt: ${prompt.substring(0, 50)}...`)

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: enhancedPrompt
          }]
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error response:', errorText)
      throw new Error(`Gemini API returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini API response structure:', JSON.stringify(data))
      throw new Error('Invalid response structure from Gemini API')
    }

    // Extract questions from Gemini's response
    let questions
    try {
      // The response might be a JSON string within the text, so we need to parse it
      const responseText = data.candidates[0].content.parts[0].text
      console.log('Raw Gemini response:', responseText.substring(0, 100) + '...')
      
      // Find anything that looks like a JSON array in the response
      const jsonMatch = responseText.match(/\[.*\]/s)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0])
      } else {
        // If no JSON array is found, split by newlines and clean up
        questions = responseText
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(line => line.endsWith('?'))
      }
    } catch (error) {
      console.error('Error parsing questions:', error.message)
      console.error('Response text:', data.candidates[0].content.parts[0].text)
      throw new Error('Failed to parse questions from API response')
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('No valid questions generated, questions:', questions)
      throw new Error('No valid questions generated')
    }

    console.log(`Successfully generated ${questions.length} questions`)

    return new Response(
      JSON.stringify({ questions: questions.slice(0, 10) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-questions function:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

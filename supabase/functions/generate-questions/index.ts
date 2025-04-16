
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables')
    }

    const { prompt, employeeId } = await req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Prompt is required and must be a non-empty string')
    }

    if (!employeeId) {
      throw new Error('Employee ID is required')
    }

    console.log(`Generating questions for employee ${employeeId} with prompt: ${prompt.substring(0, 50)}...`)

    // Update the prompt to request JSON formatted questions
    const enhancedPrompt = `Based on this context about an employee: "${prompt}", generate 10 psychologically-informed questions that can help assess potential suicidal tendencies. The questions should be professional, empathetic, and indirect. Focus on emotional states, work-life balance, and mental well-being. Format the response as a JSON object where keys are Q1, Q2, etc., and values are the question texts. Example format: {"Q1": "How would you describe your current work-life balance?", "Q2": "What changes have you noticed in your daily routine recently?"}`

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
    let questions = []
    try {
      const responseText = data.candidates[0].content.parts[0].text
      console.log('Raw Gemini response:', responseText)
      
      // Find JSON object in the response
      const jsonMatch = responseText.match(/\{[^]*\}/s)
      if (jsonMatch) {
        const questionsObj = JSON.parse(jsonMatch[0])
        // Convert JSON object to array of questions
        questions = Object.values(questionsObj)
      } else {
        // Fallback if JSON parsing fails
        questions = responseText
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^(Q\d+:|"\w+":|[0-9]+\.)/, '').trim())
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

    // Limit to 10 questions and ensure they're all strings
    const finalQuestions = questions.slice(0, 10).map(q => String(q).trim())

    console.log(`Successfully generated ${finalQuestions.length} questions for employee ${employeeId}`)

    return new Response(
      JSON.stringify({ 
        questions: finalQuestions,
        employeeId: employeeId
      }),
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

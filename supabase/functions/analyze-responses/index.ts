
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

    if (questionSetError) throw questionSetError

    // Simple sentiment analysis function
    const analyzeSentiment = (text: string) => {
      const negativeWords = ['sad', 'depressed', 'hopeless', 'worthless', 'suicide', 'die', 'end', 'tired', 'exhausted', 'alone']
      const words = text.toLowerCase().split(/\W+/)
      const negativeCount = words.filter(word => negativeWords.includes(word)).length
      const riskScore = (negativeCount / words.length) * 100

      if (riskScore > 20) return { risk_level: 'high', probability: riskScore }
      if (riskScore > 10) return { risk_level: 'medium', probability: riskScore }
      return { risk_level: 'low', probability: riskScore }
    }

    // Analyze each response
    const results = responses.map(response => {
      const analysis = analyzeSentiment(response.answer_text)
      return {
        question_id: response.id,
        risk_level: analysis.risk_level,
        probability: analysis.probability
      }
    })

    // Calculate overall risk level
    const riskScores = { high: 3, medium: 2, low: 1 }
    const averageRisk = results.reduce((acc, curr) => 
      acc + riskScores[curr.risk_level as keyof typeof riskScores], 0) / results.length

    const overall_risk_level = 
      averageRisk > 2.5 ? 'high' :
      averageRisk > 1.5 ? 'medium' : 'low'

    // Update question set status and risk level
    const { error: updateSetError } = await supabaseClient
      .from('question_sets')
      .update({ 
        status: 'analyzed',
        risk_level: overall_risk_level,
        completed_at: new Date().toISOString()
      })
      .eq('id', question_set_id)

    if (updateSetError) throw updateSetError

    // Update individual questions with their risk levels
    for (const result of results) {
      const { error: updateError } = await supabaseClient
        .from('questions')
        .update({ 
          status: 'analyzed',
          risk_level: result.risk_level
        })
        .eq('id', result.question_id)

      if (updateError) throw updateError
    }

    // Create analysis history record
    const { error: historyError } = await supabaseClient
      .from('question_history')
      .insert({
        question_set_id: question_set_id,
        employee_id: questionSet.employee_id,
        hr_id: questionSet.hr_id,
        overall_risk_level: overall_risk_level,
        completed_at: new Date().toISOString()
      })

    if (historyError) throw historyError

    return new Response(
      JSON.stringify({
        status: 'success',
        results: results,
        overall_risk_level: overall_risk_level
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

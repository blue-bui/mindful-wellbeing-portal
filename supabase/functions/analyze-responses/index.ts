
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

// This would normally be connected to our trained ML model
// For now, we'll use a simplified approach to demonstrate the functionality

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mock suicide-related words/phrases for demonstration
const suicidalPhrases = [
  "want to die", "kill myself", "end my life", "no reason to live", 
  "better off dead", "can't go on", "give up", "tired of living",
  "hopeless", "worthless", "burden", "never get better",
  "trapped", "unbearable pain", "no future", "nothing to live for",
  "suicide", "disappear forever", "peaceful death"
];

// Negative sentiment words
const negativeWords = [
  "sad", "depressed", "anxious", "worried", "stressed", "overwhelmed",
  "lost", "alone", "isolated", "afraid", "fearful", "tired", "exhausted",
  "empty", "numb", "pain", "hurt", "suffer", "struggling", "difficulty",
  "problem", "trouble", "fail", "failure", "disappointed", "regret", "guilt",
  "ashamed", "worthless", "useless", "insignificant", "helpless", "hopeless"
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { question_set_id, responses } = await req.json()
    
    if (!question_set_id) {
      throw new Error('question_set_id is required')
    }
    
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      throw new Error('Responses array is required and cannot be empty')
    }
    
    console.log(`Analyzing responses for question set: ${question_set_id}`)
    console.log(`Number of responses to analyze: ${responses.length}`)
    
    // Process each response and calculate risk scores
    const results = responses.map(response => {
      const text = (response.answer_text || '').toLowerCase()
      
      // 1. Check for direct suicidal phrases (highest risk)
      const hasSuicidalPhrases = suicidalPhrases.some(phrase => text.includes(phrase.toLowerCase()))
      
      // 2. Count negative sentiment words
      const negativeWordCount = negativeWords.filter(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i')
        return regex.test(text)
      }).length
      
      // 3. Calculate raw score based on text length and negative word density
      const wordCount = text.split(/\s+/).length
      const negativeWordDensity = wordCount > 0 ? negativeWordCount / wordCount : 0
      
      // 4. Determine risk level
      let riskLevel = 'low'
      let probability = 0.1 + (negativeWordDensity * 0.5) // Base probability
      
      if (hasSuicidalPhrases) {
        riskLevel = 'high'
        probability = 0.8 + (Math.random() * 0.2) // 80-100%
      } else if (negativeWordDensity > 0.4) {
        riskLevel = 'high'
        probability = 0.7 + (Math.random() * 0.15) // 70-85%
      } else if (negativeWordDensity > 0.25) {
        riskLevel = 'medium'
        probability = 0.4 + (Math.random() * 0.3) // 40-70%
      } else if (negativeWordDensity > 0.15) {
        riskLevel = 'medium'
        probability = 0.3 + (Math.random() * 0.2) // 30-50%
      } else {
        probability = 0.1 + (Math.random() * 0.2) // 10-30%
      }
      
      // Round probability to 2 decimal places
      probability = Math.round(probability * 100) / 100
      
      console.log(`Analysis for response ${response.id}: Risk level = ${riskLevel}, Probability = ${probability}`)
      
      return {
        question_id: response.id,
        risk_level: riskLevel,
        probability: probability
      }
    })
    
    // Calculate overall risk level based on all responses
    const riskCounts = {
      low: results.filter(r => r.risk_level === 'low').length,
      medium: results.filter(r => r.risk_level === 'medium').length,
      high: results.filter(r => r.risk_level === 'high').length
    }
    
    let overallRiskLevel = 'low'
    if (riskCounts.high > 0) {
      overallRiskLevel = 'high'
    } else if (riskCounts.medium > riskCounts.low) {
      overallRiskLevel = 'medium'
    }
    
    console.log(`Overall risk assessment: ${overallRiskLevel} (Low: ${riskCounts.low}, Medium: ${riskCounts.medium}, High: ${riskCounts.high})`)
    
    return new Response(
      JSON.stringify({
        status: 'success',
        results: results,
        overall_risk_level: overallRiskLevel,
        risk_counts: riskCounts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in analyze-responses function:', error.message)
    
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

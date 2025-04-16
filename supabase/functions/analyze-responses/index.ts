
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple sentiment analysis function
function analyzeSentiment(text) {
  // These are common words/phrases that might indicate suicidal tendencies
  const negativePatterns = [
    'hopeless', 'worthless', 'useless', 'burden', 'no point', 'can\'t go on', 
    'better off without me', 'no reason', 'tired of living', 'don\'t want to be here',
    'escape', 'pain', 'alone', 'lonely', 'never get better', 'trapped', 'no future',
    'give up', 'end it all', 'suicide', 'kill myself', 'die', 'death', 'no hope',
    'can\'t take it', 'struggle', 'suffering', 'empty', 'numb', 'exhausted'
  ];
  
  const text_lower = text.toLowerCase();
  let matchCount = 0;
  
  for (const pattern of negativePatterns) {
    if (text_lower.includes(pattern)) {
      matchCount++;
    }
  }
  
  // Calculate a simple sentiment score
  const score = matchCount / negativePatterns.length;
  
  // Determine risk level based on score
  let riskLevel;
  if (score > 0.2) {
    riskLevel = 'high';
  } else if (score > 0.1) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }
  
  return {
    risk_level: riskLevel,
    probability: score,
    matches: matchCount
  };
}

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
    
    if (!responses || !Array.isArray(responses)) {
      throw new Error('responses is required and must be an array')
    }
    
    // Analyze each response
    const results = responses.map(response => {
      const analysis = analyzeSentiment(response.answer_text || '');
      return {
        question_id: response.id,
        ...analysis
      };
    });
    
    // Calculate overall risk level
    const riskScores = {
      'low': 0,
      'medium': 1,
      'high': 2
    };
    
    let totalScore = 0;
    results.forEach(result => {
      totalScore += riskScores[result.risk_level] || 0;
    });
    
    const avgScore = totalScore / results.length;
    let overallRiskLevel = 'low';
    
    if (avgScore > 1.5) {
      overallRiskLevel = 'high';
    } else if (avgScore > 0.5) {
      overallRiskLevel = 'medium';
    }
    
    return new Response(
      JSON.stringify({ 
        status: 'success',
        question_set_id,
        overall_risk_level: overallRiskLevel,
        results
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

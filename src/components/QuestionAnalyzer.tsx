
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../lib/authHelpers';

interface QuestionAnalyzerProps {
  questionSetId: string;
  onAnalysisComplete?: (overallRisk: string) => void;
}

const QuestionAnalyzer = ({ questionSetId, onAnalysisComplete }: QuestionAnalyzerProps) => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    overallRisk: string;
    explanation?: string;
    questionResults: {
      id: string;
      risk: string;
      probability?: number;
      reasoning?: string;
      question: string;
      answer: string;
    }[];
  } | null>(null);

  const analyzeResponses = async () => {
    if (!user) {
      toast.error('You must be logged in to analyze responses');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Fetch the answered questions for this set
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('question_set_id', questionSetId);
      
      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        throw new Error(`Failed to fetch questions: ${questionsError.message}`);
      }
      
      // Filter answered questions
      const answeredQuestions = questions.filter(q => q.answer_text && q.answer_text.trim() !== '');
      
      if (!answeredQuestions || answeredQuestions.length === 0) {
        toast.error('No answered questions found for analysis');
        setIsAnalyzing(false);
        return;
      }
      
      console.log('Questions to analyze:', answeredQuestions);
      
      // Prepare data for analysis
      const responses = answeredQuestions.map((q) => ({
        id: q.id,
        answer_text: q.answer_text || ''
      }));
      
      console.log('Sending to edge function:', { question_set_id: questionSetId, responses });
      
      // Call our edge function to analyze the responses
      const { data, error } = await supabase.functions.invoke('analyze-responses', {
        body: {
          question_set_id: questionSetId,
          responses
        },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      console.log('Analysis response:', data);
      
      if (!data || data.status !== 'success') {
        throw new Error('Analysis failed: ' + (data?.error || 'Unknown error'));
      }
      
      // Format the results for display
      const formattedResults = data.results.map((r: any) => ({
        id: r.question_id,
        risk: r.risk_level,
        probability: r.probability || 0,
        reasoning: r.reasoning || '',
        question: answeredQuestions.find(q => q.id === r.question_id)?.question_text || '',
        answer: answeredQuestions.find(q => q.id === r.question_id)?.answer_text || '',
      }));
      
      // Sort results to show high risk items first
      formattedResults.sort((a: any, b: any) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        return riskOrder[a.risk as keyof typeof riskOrder] - riskOrder[b.risk as keyof typeof riskOrder];
      });
      
      setAnalysisResult({
        overallRisk: data.overall_risk_level,
        explanation: data.explanation,
        questionResults: formattedResults,
      });
      
      // Call the completion callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(data.overall_risk_level);
      }
      
      toast.success('Analysis completed successfully');
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze responses');
      toast.error(error.message || 'Failed to analyze responses. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return '';
    }
  };
  
  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      case 'medium':
        return <Info className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-wellness-teal">Response Analysis</CardTitle>
        <CardDescription>
          Analyze employee responses to assess potential risk indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!analysisResult ? (
          <div className="text-center p-6">
            <Button 
              onClick={analyzeResponses}
              disabled={isAnalyzing}
              className="bg-wellness-teal hover:bg-wellness-teal/90"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Responses...
                </>
              ) : (
                'Start Analysis'
              )}
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              The system will analyze all responses to detect potential signs of distress
              using a sentiment analysis algorithm trained on relevant datasets.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="font-medium">Overall Risk Assessment</p>
                <p className="text-sm text-muted-foreground">
                  Based on all responses combined
                </p>
              </div>
              <Badge className={getRiskColor(analysisResult.overallRisk)}>
                <span className="flex items-center gap-1">
                  {getRiskIcon(analysisResult.overallRisk)}
                  {analysisResult.overallRisk.charAt(0).toUpperCase() + analysisResult.overallRisk.slice(1)} Risk
                </span>
              </Badge>
            </div>
            
            {analysisResult.explanation && (
              <div className="p-3 border rounded-md bg-muted/30">
                <p className="text-sm font-medium">Analysis Summary:</p>
                <p className="text-sm">{analysisResult.explanation}</p>
              </div>
            )}
            
            {analysisResult.overallRisk === 'high' && (
              <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>High Risk Detected</AlertTitle>
                <AlertDescription>
                  The analysis indicates a high risk level. Immediate professional 
                  intervention is recommended. Please contact a mental health 
                  professional or crisis services right away.
                </AlertDescription>
              </Alert>
            )}
            
            {analysisResult.overallRisk === 'medium' && (
              <Alert variant="default" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                <Info className="h-4 w-4" />
                <AlertTitle>Medium Risk Detected</AlertTitle>
                <AlertDescription>
                  The analysis indicates a medium risk level. Follow-up with a mental health 
                  professional is recommended for further assessment and support.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Individual Question Analysis</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {analysisResult.questionResults.map((result) => (
                  <div key={result.id} className="border rounded-md p-3">
                    <div className="flex justify-between">
                      <p className="font-medium">{result.question}</p>
                      <Badge className={getRiskColor(result.risk)}>
                        <span className="flex items-center gap-1">
                          {getRiskIcon(result.risk)}
                          {result.risk.charAt(0).toUpperCase() + result.risk.slice(1)}
                        </span>
                      </Badge>
                    </div>
                    <div className="mt-2 bg-muted p-2 rounded-md text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Response:</p>
                      {result.answer}
                    </div>
                    {result.reasoning && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p className="font-medium">Analysis:</p>
                        <p>{result.reasoning}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground border-t pt-4">
        <div>
          <p className="font-medium text-wellness-dark">Disclaimer:</p>
          <p>
            This analysis is not a clinical diagnosis. Always consult with qualified mental 
            health professionals for proper assessment and treatment. If you are concerned 
            about immediate danger, please contact emergency services immediately.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuestionAnalyzer;

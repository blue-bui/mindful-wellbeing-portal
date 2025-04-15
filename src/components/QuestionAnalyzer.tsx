
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from '../lib/supabase';
import { Question, QuestionSet } from '../lib/supabase';

interface QuestionAnalyzerProps {
  questionSetId: string;
  onAnalysisComplete?: (overallRisk: string) => void;
}

const QuestionAnalyzer = ({ questionSetId, onAnalysisComplete }: QuestionAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    overallRisk: string;
    questionResults: {
      id: string;
      risk: string;
      probability: number;
      question: string;
      answer: string;
    }[];
  } | null>(null);

  const analyzeResponses = async () => {
    setIsAnalyzing(true);
    
    try {
      // Fetch all answered questions for this set
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('question_set_id', questionSetId)
        .eq('status', 'answered');
      
      if (questionsError) throw questionsError;
      
      if (!questions || questions.length === 0) {
        toast.error('No answered questions found for analysis');
        setIsAnalyzing(false);
        return;
      }
      
      // Prepare data for sending to Flask backend
      const responses = questions.map((q: Question) => ({
        id: q.id,
        answer_text: q.answer_text || ''
      }));
      
      // Send to Flask API for analysis
      const apiUrl = 'http://localhost:5000/api/analyze'; // Change in production
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_set_id: questionSetId,
          responses
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze responses');
      }
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error('Analysis failed');
      }
      
      // Format results for display
      const formattedResults = result.results.map((r: any, index: number) => ({
        id: r.question_id,
        risk: r.risk_level,
        probability: r.probability,
        question: questions[index].question_text,
        answer: questions[index].answer_text || '',
      }));
      
      setAnalysisResult({
        overallRisk: result.overall_risk_level,
        questionResults: formattedResults,
      });
      
      // Update question_sets table with risk level
      const { error: updateError } = await supabase
        .from('question_sets')
        .update({ 
          status: 'analyzed',
          risk_level: result.overall_risk_level 
        })
        .eq('id', questionSetId);
      
      if (updateError) {
        console.error('Error updating question set:', updateError);
        toast.error('Error updating analysis results in database');
      }
      
      // Update individual questions with risk levels
      for (const resultItem of result.results) {
        const { error: questionUpdateError } = await supabase
          .from('questions')
          .update({ 
            status: 'analyzed',
            risk_level: resultItem.risk_level 
          })
          .eq('id', resultItem.question_id);
          
        if (questionUpdateError) {
          console.error('Error updating question:', questionUpdateError);
        }
      }
      
      // Create entry in question_history
      const { data: questionSet } = await supabase
        .from('question_sets')
        .select('*')
        .eq('id', questionSetId)
        .single();
        
      if (questionSet) {
        const { error: historyError } = await supabase
          .from('question_history')
          .insert({
            question_set_id: questionSetId,
            employee_id: questionSet.employee_id,
            hr_id: questionSet.hr_id,
            overall_risk_level: result.overall_risk_level,
            completed_at: new Date().toISOString()
          });
          
        if (historyError) {
          console.error('Error creating history record:', historyError);
        }
      }
      
      // Callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(result.overall_risk_level);
      }
      
      toast.success('Analysis completed successfully');
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze responses');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Helper function to get color for risk level
  const getRiskColor = (risk: string) => {
    switch (risk) {
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
  
  // Helper function to get icon for risk level
  const getRiskIcon = (risk: string) => {
    switch (risk) {
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
              using a machine learning model trained on relevant datasets.
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
              <Alert variant="warning" className="bg-yellow-50 text-yellow-800 border-yellow-200">
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

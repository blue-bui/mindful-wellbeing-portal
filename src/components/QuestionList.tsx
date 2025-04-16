import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Send, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';
import { format } from 'date-fns';
import { useAuth } from '../lib/authHelpers';
import QuestionAnalyzer from './QuestionAnalyzer';

interface QuestionItem {
  id: string;
  question_text: string;
  answer_text?: string;
  status: 'pending' | 'answered' | 'analyzed';
}

interface QuestionSetItem {
  id: string;
  created_at: string;
  status: 'pending' | 'completed' | 'analyzed';
  questions: QuestionItem[];
  employee_name?: string;
}

interface QuestionListProps {
  assignedQuestions?: QuestionSetItem[];
  isEmployee?: boolean;
  refetchQuestions?: () => void;
  loading?: boolean;
  onSubmitAnswers?: (questionSetId: string, answers: any[]) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({ 
  assignedQuestions = [], 
  isEmployee = false,
  refetchQuestions,
  loading = false,
  onSubmitAnswers
}) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionSetItem[]>(assignedQuestions);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [showAnalyzer, setShowAnalyzer] = useState<string | null>(null);
  
  useEffect(() => {
    setQuestions(assignedQuestions);
  }, [assignedQuestions]);
  
  const handleAnswerChange = (questionSetId: string, questionId: string, answer: string) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionSetId]: {
        ...(prev[questionSetId] || {}),
        [questionId]: answer
      }
    }));
  };

  const handleSubmit = async (questionSetId: string, questions: QuestionItem[]) => {
    if (!user) {
      toast.error('You must be logged in to submit answers');
      return;
    }
    
    const answersForThisSet = currentAnswers[questionSetId] || {};
    
    // Check if all questions have been answered
    let allAnswered = true;
    for (const question of questions) {
      if (!answersForThisSet[question.id] && !question.answer_text) {
        allAnswered = false;
        break;
      }
    }
    
    if (!allAnswered) {
      toast.warning('Please answer all questions before submitting');
      return;
    }
    
    setSubmitting(questionSetId);
    
    try {
      // If onSubmitAnswers prop is provided, use it (for mock data in EmployeeDashboard)
      if (onSubmitAnswers) {
        const answers = questions.map(q => ({
          id: q.id,
          answer_text: answersForThisSet[q.id] || q.answer_text
        }));
        
        onSubmitAnswers(questionSetId, answers);
        
        // Clear answers for this set
        setCurrentAnswers(prev => {
          const newAnswers = {...prev};
          delete newAnswers[questionSetId];
          return newAnswers;
        });
        
        setSubmitting(null);
        return;
      }
      
      // Otherwise use the database (real implementation)
      for (const question of questions) {
        const answer = answersForThisSet[question.id] || question.answer_text;
        if (answer) {
          const { error } = await supabase
            .from('questions')
            .update({
              answer_text: answer,
              status: 'answered',
              answered_at: new Date().toISOString()
            })
            .eq('id', question.id);
            
          if (error) {
            throw new Error(`Error updating question ${question.id}: ${error.message}`);
          }
        }
      }
      
      // Update the question set status
      const { error } = await supabase
        .from('question_sets')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', questionSetId);
        
      if (error) {
        throw new Error(`Error updating question set: ${error.message}`);
      }
      
      toast.success('Responses submitted successfully');
      
      // Clear answers for this set
      setCurrentAnswers(prev => {
        const newAnswers = {...prev};
        delete newAnswers[questionSetId];
        return newAnswers;
      });
      
      // If HR, show the analyzer
      if (!isEmployee) {
        setShowAnalyzer(questionSetId);
      }
      
      // Refetch the questions if callback provided
      if (refetchQuestions) {
        refetchQuestions();
      }
      
    } catch (error: any) {
      console.error('Error submitting answers:', error);
      toast.error(error.message || 'Failed to submit answers');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <Card className="text-center p-6">
        <div className="flex justify-center items-center flex-col p-4">
          <Loader2 className="h-8 w-8 animate-spin mb-2 text-wellness-teal" />
          <p>Loading questions...</p>
        </div>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="text-center p-6">
        <p className="text-muted-foreground">
          {isEmployee 
            ? "You don't have any questions assigned to you at the moment." 
            : "No questions have been assigned to employees yet."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((questionSet) => (
        <React.Fragment key={questionSet.id}>
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-wellness-teal text-lg">
                    Assessment {questionSet.id.substring(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    {questionSet.employee_name ? `Assigned to: ${questionSet.employee_name}` : ''}
                    {questionSet.employee_name ? ' • ' : ''}
                    Assigned: {format(new Date(questionSet.created_at), 'PPP')}
                  </CardDescription>
                </div>
                <Badge 
                  variant={questionSet.status !== 'pending' ? "default" : "outline"}
                  className={questionSet.status !== 'pending' 
                    ? "bg-green-100 text-green-800 hover:bg-green-100" 
                    : "border-wellness-accent text-wellness-accent"
                  }
                >
                  {questionSet.status !== 'pending' ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      {questionSet.status.charAt(0).toUpperCase() + questionSet.status.slice(1)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Pending
                    </span>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {questionSet.questions.map((item) => (
                  <div key={item.id} className="p-3 border rounded-md">
                    <p className="font-medium mb-2">{item.question_text}</p>
                    
                    {isEmployee && questionSet.status === 'pending' ? (
                      <Textarea
                        placeholder="Type your answer here..."
                        value={currentAnswers[questionSet.id]?.[item.id] || item.answer_text || ''}
                        onChange={(e) => handleAnswerChange(questionSet.id, item.id, e.target.value)}
                        className="mt-2"
                      />
                    ) : (
                      item.answer_text && (
                        <div className="bg-muted p-3 rounded-md mt-2 text-sm">
                          <p className="text-xs text-muted-foreground mb-1">Response:</p>
                          {item.answer_text}
                        </div>
                      )
                    )}
                  </div>
                ))}
                
                {isEmployee && questionSet.status === 'pending' && (
                  <div className="flex justify-end mt-4">
                    <Button 
                      className="bg-wellness-teal hover:bg-wellness-teal/90 flex items-center gap-2"
                      onClick={() => handleSubmit(questionSet.id, questionSet.questions)}
                      disabled={submitting === questionSet.id}
                    >
                      {submitting === questionSet.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-1" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Submit Responses
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {!isEmployee && questionSet.status === 'completed' && showAnalyzer !== questionSet.id && (
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setShowAnalyzer(questionSet.id)}
                    >
                      <Eye size={16} />
                      Analyze Responses
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {showAnalyzer === questionSet.id && (
            <QuestionAnalyzer 
              questionSetId={questionSet.id}
              onAnalysisComplete={() => {
                setShowAnalyzer(null);
                if (refetchQuestions) {
                  refetchQuestions();
                }
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default QuestionList;

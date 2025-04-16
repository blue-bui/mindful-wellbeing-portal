import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Layout from '../components/Layout';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';

interface Question {
  id: string;
  question_text: string;
  answer_text?: string;
  status: string;
}

const QuestionResponse = () => {
  const [searchParams] = useSearchParams();
  const questionSetId = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!questionSetId) {
        toast.error('No question set ID provided');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('question_set_id', questionSetId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error('No questions found for this set');
        }

        setQuestions(data);
        setAnswers(data.map(q => q.answer_text || ''));
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching questions:', error);
        toast.error(error.message || 'Failed to load questions');
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [questionSetId]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = e.target.value;
    setAnswers(updatedAnswers);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    const unansweredQuestions = answers.filter(answer => !answer.trim()).length;
    
    if (unansweredQuestions > 0) {
      toast.warning(`Please answer all questions (${unansweredQuestions} remaining)`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatePromises = questions.map((question, index) => 
        supabase
          .from('questions')
          .update({
            answer_text: answers[index],
            status: 'answered',
            answered_at: new Date().toISOString()
          })
          .eq('id', question.id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        throw new Error('Failed to save some answers');
      }

      const { error: setError } = await supabase
        .from('question_sets')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', questionSetId);

      if (setError) throw setError;

      toast.success('Your responses have been submitted successfully');
      window.location.href = '/employee-dashboard';
    } catch (error: any) {
      console.error('Error submitting answers:', error);
      toast.error(error.message || 'Failed to submit answers');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-wellness-teal" />
            <p>Loading your assessment questions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-wellness-teal mb-6">Wellbeing Assessment</h1>
        
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center"
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex items-center"
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {questions[currentQuestionIndex]?.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your answer here..."
              value={answers[currentQuestionIndex] || ''}
              onChange={handleAnswerChange}
              rows={5}
              className="resize-none"
            />
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {answers.filter(answer => answer.trim() !== '').length} of {questions.length} questions answered
            </div>
            
            {currentQuestionIndex === questions.length - 1 && (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting} 
                className="bg-wellness-teal hover:bg-wellness-teal/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Submit All Responses
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Note:</strong> Your responses are confidential and will be used only to offer
            appropriate support and resources. This assessment is not a diagnostic tool.
          </p>
          <p>
            If you're experiencing severe distress or having thoughts of harming yourself,
            please contact a mental health professional immediately or call the National
            Suicide Prevention Lifeline at <strong>988</strong>.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default QuestionResponse;

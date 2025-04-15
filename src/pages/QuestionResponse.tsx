
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Layout from '../components/Layout';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const QuestionResponse = () => {
  const [searchParams] = useSearchParams();
  const questionSetId = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);

  useEffect(() => {
    // In a real app, this would fetch the questions from the backend
    // based on the questionSetId parameter
    console.log('Fetching questions for set ID:', questionSetId);
    
    // Simulate API call to fetch questions
    setTimeout(() => {
      const mockQuestions = [
        "How often do you feel overwhelmed by work responsibilities?",
        "On a scale of 1-10, how would you rate your overall satisfaction with life currently?",
        "Have you experienced changes in your sleep patterns recently?",
        "Do you have someone you can talk to when you're feeling down?",
        "How often do you engage in activities you enjoy outside of work?",
        "Have you experienced feelings of hopelessness in the past month?",
        "Do you find it difficult to concentrate on tasks?",
        "Have you noticed changes in your appetite or eating habits?",
        "How would you describe your energy levels throughout the day?",
        "Do you ever feel that life is not worth living?"
      ];
      
      setQuestions(mockQuestions);
      setAnswers(new Array(mockQuestions.length).fill(''));
      setIsLoading(false);
    }, 1500);
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

  const handleSubmit = () => {
    // Check if all questions have been answered
    const unansweredQuestions = answers.filter(answer => !answer.trim()).length;
    
    if (unansweredQuestions > 0) {
      toast.warning(`Please answer all questions (${unansweredQuestions} remaining)`);
      return;
    }
    
    setIsSubmitting(true);
    
    // In a real app, this would send the answers to the backend
    console.log('Submitting answers:', answers);
    
    // Simulate API call to submit answers
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Your responses have been submitted successfully');
      
      // Redirect to employee dashboard
      window.location.href = '/employee-dashboard';
    }, 1500);
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
              {questions[currentQuestionIndex]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your answer here..."
              value={answers[currentQuestionIndex]}
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


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';

// Mock data types
interface QuestionResponse {
  questionId: number;
  question: string;
  answer: string;
  completed: boolean;
}

interface QuestionSet {
  id: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'completed';
  questions: QuestionResponse[];
}

interface QuestionListProps {
  assignedQuestions: QuestionSet[];
  isEmployee?: boolean;
  onSubmitAnswers?: (questionSetId: string, answers: QuestionResponse[]) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({ 
  assignedQuestions, 
  isEmployee = false,
  onSubmitAnswers = () => {} 
}) => {
  const [currentAnswers, setCurrentAnswers] = React.useState<Record<string, Record<number, string>>>({});

  const handleAnswerChange = (questionSetId: string, questionId: number, answer: string) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionSetId]: {
        ...(prev[questionSetId] || {}),
        [questionId]: answer
      }
    }));
  };

  const handleSubmit = (questionSetId: string, questions: QuestionResponse[]) => {
    const updatedQuestions = questions.map(q => ({
      ...q,
      answer: currentAnswers[questionSetId]?.[q.questionId] || q.answer,
      completed: true
    }));
    
    onSubmitAnswers(questionSetId, updatedQuestions);
    toast.success('Responses submitted successfully');
    
    // Reset answers for this set
    setCurrentAnswers(prev => {
      const newAnswers = {...prev};
      delete newAnswers[questionSetId];
      return newAnswers;
    });
  };

  if (assignedQuestions.length === 0) {
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
      {assignedQuestions.map((questionSet) => (
        <Card key={questionSet.id} className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-wellness-teal text-lg">
                  Assessment {questionSet.id.substring(0, 8)}
                </CardTitle>
                <CardDescription>
                  Assigned: {questionSet.assignedDate} | Due: {questionSet.dueDate}
                </CardDescription>
              </div>
              <Badge 
                variant={questionSet.status === 'completed' ? "default" : "outline"}
                className={questionSet.status === 'completed' 
                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                  : "border-wellness-accent text-wellness-accent"
                }
              >
                {questionSet.status === 'completed' ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle size={14} />
                    Completed
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
                <div key={item.questionId} className="p-3 border rounded-md">
                  <p className="font-medium mb-2">{item.question}</p>
                  
                  {isEmployee && questionSet.status === 'pending' ? (
                    <Textarea
                      placeholder="Type your answer here..."
                      value={currentAnswers[questionSet.id]?.[item.questionId] || ''}
                      onChange={(e) => handleAnswerChange(questionSet.id, item.questionId, e.target.value)}
                      className="mt-2"
                    />
                  ) : (
                    item.answer && (
                      <div className="bg-muted p-3 rounded-md mt-2 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Response:</p>
                        {item.answer}
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
                  >
                    <Send size={16} />
                    Submit Responses
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuestionList;


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const QuestionGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);

  // This would normally call the Gemini API through Flask backend
  const generateQuestions = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Mock API call to Flask backend with Gemini integration
      // In real implementation, this would call your Flask API
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
        
        setGeneratedQuestions(mockQuestions);
        setIsGenerating(false);
        toast.success('Questions generated successfully');
      }, 2000);
      
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions');
      setIsGenerating(false);
    }
  };

  const assignQuestions = async () => {
    if (!employeeEmail.trim()) {
      toast.error('Please enter an employee email');
      return;
    }
    
    if (generatedQuestions.length === 0) {
      toast.error('Please generate questions first');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Mock API call to Flask backend to assign questions and send email
      // In real implementation, this would call your Flask API which would use Resend API
      setTimeout(() => {
        setIsSubmitting(false);
        toast.success(`Questions assigned to ${employeeEmail}${sendEmail ? ' and email sent' : ''}`);
        
        // Reset form
        setPrompt('');
        setEmployeeEmail('');
        setGeneratedQuestions([]);
      }, 1500);
      
    } catch (error) {
      console.error('Error assigning questions:', error);
      toast.error('Failed to assign questions');
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-wellness-teal">Generate Assessment Questions</CardTitle>
        <CardDescription>
          Create psychological assessment questions using AI, based on your input prompt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt for Question Generation</Label>
          <Textarea
            id="prompt"
            placeholder="Enter a prompt describing the type of assessment you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Example: "Create questions to assess an employee's mental wellbeing and stress levels"
          </p>
        </div>
        
        <Button 
          onClick={generateQuestions} 
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-wellness-teal hover:bg-wellness-teal/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Questions...
            </>
          ) : (
            'Generate Questions'
          )}
        </Button>
        
        {generatedQuestions.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="font-medium">Generated Questions:</h3>
            <ul className="space-y-2 text-sm">
              {generatedQuestions.map((question, index) => (
                <li key={index} className="p-2 bg-muted rounded">
                  {index + 1}. {question}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {generatedQuestions.length > 0 && (
          <div className="border-t pt-4 mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Employee Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="employee@company.com"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="send-email" 
                checked={sendEmail} 
                onCheckedChange={setSendEmail} 
              />
              <Label htmlFor="send-email">Send notification email</Label>
            </div>
            
            <Button 
              onClick={assignQuestions} 
              disabled={isSubmitting || !employeeEmail.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning Questions...
                </>
              ) : (
                'Assign Questions to Employee'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionGenerator;

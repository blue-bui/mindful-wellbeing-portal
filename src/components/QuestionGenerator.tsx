
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../lib/authHelpers';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

interface QuestionGeneratorProps {
  onQuestionGenerated?: () => void;
}

const QuestionGenerator: React.FC<QuestionGeneratorProps> = ({ onQuestionGenerated }) => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('role', 'employee');
          
        if (error) throw error;
        setEmployees(data || []);
      } catch (error: any) {
        console.error('Error fetching employees:', error);
        setError('Failed to load employees. Please try again later.');
        toast.error('Failed to load employees');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);

  const generateQuestions = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: { 
          prompt: prompt,
          employeeId: selectedEmployeeId
        }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw new Error(`Failed to generate questions: ${error.message}`);
      }
      
      if (!data.questions || !Array.isArray(data.questions)) {
        console.error('Invalid response from question generator:', data);
        throw new Error('Invalid response from question generator');
      }

      setGeneratedQuestions(data.questions);
      toast.success('Questions generated successfully');
      
    } catch (error: any) {
      console.error('Error generating questions:', error);
      setError(error.message || 'Failed to generate questions');
      toast.error(error.message || 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const assignQuestions = async () => {
    if (!user) {
      toast.error('You must be logged in to assign questions');
      return;
    }
    
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    
    if (generatedQuestions.length === 0) {
      toast.error('Please generate questions first');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // First, create a question set entry
      const { data: questionSet, error: setError } = await supabase
        .from('question_sets')
        .insert({
          employee_id: selectedEmployeeId,
          hr_id: user.id,
          prompt: prompt,
          status: 'pending'
        })
        .select()
        .single();
        
      if (setError) throw setError;
      
      // Then create entries for each question
      const questionsToInsert = generatedQuestions.map(question => ({
        question_set_id: questionSet.id,
        employee_id: selectedEmployeeId,
        hr_id: user.id,
        question_text: question,
        status: 'pending'
      }));
      
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);
        
      if (questionsError) throw questionsError;
      
      // Get employee information for notification
      const selectedEmployee = employees.find(emp => emp.user_id === selectedEmployeeId);
      
      // If send email is checked, we would send an email notification here
      if (sendEmail && selectedEmployee) {
        console.log(`Email notification would be sent to ${selectedEmployee.name} at ${selectedEmployee.email}`);
        // In a real implementation, you would call an edge function to send the email
        // For now, we'll just log it
      }
      
      setPrompt('');
      setSelectedEmployeeId('');
      setGeneratedQuestions([]);
      
      toast.success(`Questions assigned to ${selectedEmployee?.name || 'employee'}`);
      
      // Call the callback if provided
      if (onQuestionGenerated) {
        onQuestionGenerated();
      }
      
    } catch (error: any) {
      console.error('Error assigning questions:', error);
      setError(error.message || 'Failed to assign questions');
      toast.error(error.message || 'Failed to assign questions');
    } finally {
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
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="employee">1. Select Employee</Label>
          <Select
            value={selectedEmployeeId}
            onValueChange={setSelectedEmployeeId}
            disabled={isLoading || isGenerating || isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading employees...
                </div>
              ) : employees.length > 0 ? (
                employees.map((employee) => (
                  <SelectItem key={employee.user_id} value={employee.user_id}>
                    {employee.name} ({employee.email})
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-muted-foreground">No employees found</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">2. Enter Context About Employee</Label>
          <Textarea
            id="prompt"
            placeholder="Enter a prompt describing the employee context, such as recent behaviors or concerns..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
            disabled={!selectedEmployeeId || isGenerating || isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Example: "Employee has been showing signs of withdrawal and decreased participation in team activities"
          </p>
        </div>
        
        <Button 
          onClick={generateQuestions} 
          disabled={isGenerating || isSubmitting || !prompt.trim() || !selectedEmployeeId}
          className="w-full bg-wellness-teal hover:bg-wellness-teal/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Questions...
            </>
          ) : (
            '3. Generate Questions'
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
              disabled={isSubmitting || generatedQuestions.length === 0}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning Questions...
                </>
              ) : (
                '4. Assign Questions to Employee'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionGenerator;

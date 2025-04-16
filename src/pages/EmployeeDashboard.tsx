
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Layout from '../components/Layout';
import QuestionList from '../components/QuestionList';
import { Book, FileText, User, Info, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../lib/authHelpers';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedQuestions, setAssignedQuestions] = useState<any[]>([]);
  const [userName, setUserName] = useState('Employee');

  // Fetch user data and assigned questions
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get user profile
        const { data: userProfile, error: userError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (userError) throw userError;
        
        if (userProfile) {
          setUserName(userProfile.name);
        }
        
        // Get question sets assigned to this employee
        const { data: questionSets, error: setsError } = await supabase
          .from('question_sets')
          .select('*')
          .eq('employee_id', user.id)
          .order('created_at', { ascending: false });
          
        if (setsError) throw setsError;
        
        if (questionSets && questionSets.length > 0) {
          // For each question set, get the questions
          const questionsPromises = questionSets.map(async (set) => {
            const { data: questions, error: questionsError } = await supabase
              .from('questions')
              .select('*')
              .eq('question_set_id', set.id)
              .order('created_at', { ascending: true });
              
            if (questionsError) throw questionsError;
            
            return {
              ...set,
              questions: questions || []
            };
          });
          
          const questionsData = await Promise.all(questionsPromises);
          setAssignedQuestions(questionsData);
        } else {
          setAssignedQuestions([]);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError('Failed to load your data. Please try again later.');
        toast.error('Failed to load your data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const handleSubmitAnswers = async (questionSetId: string, answers: any[]) => {
    if (!user) {
      toast.error('You must be logged in to submit answers');
      return;
    }
    
    try {
      // Update each question with the provided answer
      for (const answer of answers) {
        const { error } = await supabase
          .from('questions')
          .update({
            answer_text: answer.answer_text,
            status: 'answered',
            answered_at: new Date().toISOString()
          })
          .eq('id', answer.id);
          
        if (error) throw error;
      }
      
      // Update the question set status
      const { error } = await supabase
        .from('question_sets')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', questionSetId);
        
      if (error) throw error;
      
      toast.success('Your responses have been submitted successfully');
      
      // Refresh the data
      setLoading(true);
      const { data: questionSets, error: setsError } = await supabase
        .from('question_sets')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });
        
      if (setsError) throw setsError;
      
      if (questionSets && questionSets.length > 0) {
        const questionsPromises = questionSets.map(async (set) => {
          const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('question_set_id', set.id)
            .order('created_at', { ascending: true });
            
          if (questionsError) throw questionsError;
          
          return {
            ...set,
            questions: questions || []
          };
        });
        
        const questionsData = await Promise.all(questionsPromises);
        setAssignedQuestions(questionsData);
      } else {
        setAssignedQuestions([]);
      }
      setLoading(false);
      
    } catch (error: any) {
      console.error('Error submitting answers:', error);
      toast.error('Failed to submit your responses');
    }
  };

  // Resources for the wellbeing tab
  const resources = [
    {
      title: 'Understanding Mental Health',
      description: 'A comprehensive guide to understanding mental health and its importance in daily life.',
      link: '#'
    },
    {
      title: 'Stress Management Techniques',
      description: 'Practical techniques for managing stress in the workplace and personal life.',
      link: '#'
    },
    {
      title: 'Crisis Support Resources',
      description: 'Important contact information and resources for mental health crisis situations.',
      link: '#'
    },
    {
      title: 'Mindfulness Practices',
      description: 'Learn about mindfulness and meditation practices that can improve mental wellbeing.',
      link: '#'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-wellness-teal" />
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-wellness-dark">Employee Dashboard</h1>
          <div className="flex items-center bg-wellness-light text-wellness-dark rounded-full px-4 py-2">
            <User size={16} className="mr-2" />
            <span className="font-medium">{userName}</span>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="assessments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assessments" className="flex items-center gap-1">
              <FileText size={16} />
              My Assessments
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1">
              <Book size={16} />
              Wellbeing Resources
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assessments">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-wellness-teal">Your Wellbeing Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  <QuestionList 
                    assignedQuestions={assignedQuestions} 
                    isEmployee={true}
                    loading={loading}
                    onSubmitAnswers={handleSubmitAnswers}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-wellness-teal flex items-center gap-2">
                    <Info size={20} />
                    About These Assessments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    These assessments are designed to help understand your mental wellbeing and provide 
                    appropriate support when needed. Your responses are confidential and will be used only 
                    to offer personalized resources and support.
                  </p>
                  <p>
                    <strong>Important:</strong> This is not a diagnostic tool. If you're experiencing severe 
                    distress or having thoughts of harming yourself, please contact a mental health professional 
                    immediately or use the crisis resources available in the Wellbeing Resources tab.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="resources">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((resource, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-wellness-teal mb-2">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={16} className="mr-2" />
                        Access Resource
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="mt-4 bg-wellness-blue/10 border-wellness-blue">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-wellness-teal mb-2">Crisis Support</h3>
                <p className="mb-4">
                  If you're experiencing a mental health crisis or having thoughts of self-harm, 
                  please reach out for immediate help:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">•</span>
                    <span>National Suicide Prevention Lifeline: <strong>988</strong> (call or text)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">•</span>
                    <span>Crisis Text Line: Text <strong>HOME</strong> to <strong>741741</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">•</span>
                    <span>Employee Assistance Program: Contact HR for confidential support services</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;

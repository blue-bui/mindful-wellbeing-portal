
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '../components/Layout';
import QuestionList from '../components/QuestionList';
import { Book, FileText, User, Info, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// Mock data for the dashboard
const mockAssignedQuestions = [
  {
    id: 'q123456789',
    assignedDate: '2023-11-01',
    dueDate: '2023-11-08',
    status: 'pending' as const,
    created_at: '2023-11-01T10:00:00Z',
    questions: [
      { 
        id: '1', 
        question_text: 'How often do you feel overwhelmed by work responsibilities?', 
        answer_text: '', 
        status: 'pending' as const 
      },
      { 
        id: '2', 
        question_text: 'On a scale of 1-10, how would you rate your overall satisfaction with life currently?', 
        answer_text: '', 
        status: 'pending' as const 
      },
      { 
        id: '3', 
        question_text: 'Have you experienced changes in your sleep patterns recently?', 
        answer_text: '', 
        status: 'pending' as const 
      },
      { 
        id: '4', 
        question_text: 'Do you have someone you can talk to when you\'re feeling down?', 
        answer_text: '', 
        status: 'pending' as const 
      },
      { 
        id: '5', 
        question_text: 'How often do you engage in activities you enjoy outside of work?', 
        answer_text: '', 
        status: 'pending' as const 
      },
    ]
  }
];

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

const EmployeeDashboard = () => {
  const handleSubmitAnswers = (questionSetId: string, answers: any[]) => {
    // In a real app, this would send the answers to the backend
    console.log('Submitting answers for set:', questionSetId, answers);
    toast.success('Your responses have been submitted successfully');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-wellness-dark">Employee Dashboard</h1>
          <div className="flex items-center bg-wellness-light text-wellness-dark rounded-full px-4 py-2">
            <User size={16} className="mr-2" />
            <span className="font-medium">John Doe</span>
          </div>
        </div>
        
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
                    assignedQuestions={mockAssignedQuestions} 
                    isEmployee={true}
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

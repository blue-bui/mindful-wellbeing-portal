
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Layout from '../components/Layout';
import QuestionGenerator from '../components/QuestionGenerator';
import QuestionList from '../components/QuestionList';
import { AlertCircle, BarChart2, User, FileText } from 'lucide-react';

// Mock data for the dashboard
const employeeData = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', department: 'Engineering', risk: 'low' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', department: 'Marketing', risk: 'medium' },
  { id: '3', name: 'Robert Johnson', email: 'robert.j@example.com', department: 'Sales', risk: 'high' },
];

const mockAssignedQuestions = [
  {
    id: 'q123456789',
    assignedDate: '2023-10-15',
    dueDate: '2023-10-22',
    status: 'completed' as const,
    created_at: '2023-10-15T10:00:00Z', // Added created_at property
    questions: [
      { questionId: 1, question: 'How often do you feel overwhelmed by work responsibilities?', answer: 'I feel overwhelmed about twice a week, usually during project deadlines.', completed: true },
      { questionId: 2, question: 'On a scale of 1-10, how would you rate your overall satisfaction with life currently?', answer: '6 - Generally satisfied but there is room for improvement.', completed: true },
      { questionId: 3, question: 'Have you experienced changes in your sleep patterns recently?', answer: 'Yes, I have been having trouble falling asleep for the past two weeks.', completed: true },
      { questionId: 4, question: 'Do you have someone you can talk to when you\'re feeling down?', answer: 'I usually talk to my partner or my best friend when I feel down.', completed: true },
      { questionId: 5, question: 'How often do you engage in activities you enjoy outside of work?', answer: 'About once or twice a week, mostly on weekends.', completed: true },
    ]
  },
  {
    id: 'q987654321',
    assignedDate: '2023-11-01',
    dueDate: '2023-11-08',
    status: 'pending' as const,
    created_at: '2023-11-01T10:00:00Z', // Added created_at property
    questions: [
      { questionId: 1, question: 'Have you experienced feelings of hopelessness in the past month?', answer: '', completed: false },
      { questionId: 2, question: 'Do you find it difficult to concentrate on tasks?', answer: '', completed: false },
      { questionId: 3, question: 'Have you noticed changes in your appetite or eating habits?', answer: '', completed: false },
      { questionId: 4, question: 'How would you describe your energy levels throughout the day?', answer: '', completed: false },
      { questionId: 5, question: 'Do you ever feel that life is not worth living?', answer: '', completed: false },
    ]
  }
];

const HRDashboard = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-wellness-dark">HR Dashboard</h1>
          <div className="flex items-center bg-wellness-light text-wellness-dark rounded-full px-4 py-2">
            <User size={16} className="mr-2" />
            <span className="font-medium">HR Manager</span>
          </div>
        </div>
        
        <Alert className="bg-wellness-blue/20 border-wellness-blue">
          <AlertCircle className="h-4 w-4 text-wellness-teal" />
          <AlertTitle className="text-wellness-dark font-semibold">Important Note</AlertTitle>
          <AlertDescription className="text-sm text-wellness-dark/80">
            This platform is designed to provide early intervention support. Always involve mental health 
            professionals when addressing psychological concerns. Risk assessments should be reviewed 
            by qualified healthcare providers.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeData.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Monitored employees</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assessments Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground mt-1">Due this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Risk Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-wellness-accent">1</div>
              <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList>
            <TabsTrigger value="generate" className="flex items-center gap-1">
              <FileText size={16} />
              Generate Assessment
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-1">
              <User size={16} />
              Assigned Assessments
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-1">
              <BarChart2 size={16} />
              Analysis Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4">
            <QuestionGenerator />
          </TabsContent>
          
          <TabsContent value="assigned">
            <QuestionList assignedQuestions={mockAssignedQuestions} isEmployee={false} />
          </TabsContent>
          
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis Results</CardTitle>
                <CardDescription>
                  ML-powered analysis of employee responses to detect potential risk patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeeData.map((employee) => (
                    <div key={employee.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.department} • {employee.email}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          employee.risk === 'low' 
                            ? 'bg-green-100 text-green-800' 
                            : employee.risk === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.risk === 'low' ? 'Low Risk' : employee.risk === 'medium' ? 'Medium Risk' : 'High Risk'}
                        </div>
                      </div>
                      
                      {employee.risk === 'high' && (
                        <Alert className="mt-3 bg-red-50 border-red-200">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertTitle className="text-red-600 font-semibold">Attention Required</AlertTitle>
                          <AlertDescription className="text-sm text-red-600">
                            This employee's responses indicate potential risk factors. Consider 
                            scheduling a wellness check or providing resources for professional support. 
                            Contact a mental health professional immediately.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default HRDashboard;

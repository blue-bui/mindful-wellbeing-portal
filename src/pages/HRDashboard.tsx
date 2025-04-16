
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Layout from '../components/Layout';
import QuestionGenerator from '../components/QuestionGenerator';
import QuestionList from '../components/QuestionList';
import { AlertCircle, BarChart2, User, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../lib/authHelpers';
import { toast } from 'sonner';

const HRDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState([]);
  const [assignedQuestions, setAssignedQuestions] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingAssessments: 0,
    highRiskCount: 0
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'employee');
        
      if (employeesError) throw employeesError;
      
      // Fetch question sets with associated user data
      const { data: questionSetsData, error: questionSetsError } = await supabase
        .from('question_sets')
        .select(`
          *,
          user_profiles:user_profiles!employee_id(name, email),
          questions:questions(*)
        `)
        .order('created_at', { ascending: false });
        
      if (questionSetsError) throw questionSetsError;
      
      // Fetch analysis results
      const { data: analysisData, error: analysisError } = await supabase
        .from('question_sets')
        .select(`
          id,
          employee_id,
          prompt,
          status,
          risk_level,
          created_at,
          completed_at,
          user_profiles:user_profiles!employee_id(name, email)
        `)
        .eq('status', 'analyzed')
        .order('created_at', { ascending: false });
        
      if (analysisError) throw analysisError;
      
      // Calculate stats
      const pendingAssessments = questionSetsData.filter(qs => qs.status === 'pending').length;
      const highRiskCount = analysisData.filter(ar => ar.risk_level === 'high').length;
      
      setEmployees(employeesData || []);
      
      // Format question sets for QuestionList component
      const formattedQuestionSets = questionSetsData.map(qs => ({
        ...qs,
        employee_name: qs.user_profiles?.name || 'Unknown Employee',
        questions: qs.questions || []
      }));
      
      setAssignedQuestions(formattedQuestionSets);
      setAnalysisResults(analysisData || []);
      setStats({
        totalEmployees: employeesData?.length || 0,
        pendingAssessments,
        highRiskCount
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h1 className="text-3xl font-bold text-wellness-dark">HR Dashboard</h1>
          <div className="flex items-center bg-wellness-light text-wellness-dark rounded-full px-4 py-2">
            <User size={16} className="mr-2" />
            <span className="font-medium">{user?.user_metadata?.name || 'HR Manager'}</span>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">Monitored employees</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assessments Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAssessments}</div>
              <p className="text-xs text-muted-foreground mt-1">Due this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Risk Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-wellness-accent">{stats.highRiskCount}</div>
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
            <QuestionGenerator onQuestionGenerated={fetchData} />
          </TabsContent>
          
          <TabsContent value="assigned">
            {assignedQuestions.length > 0 ? (
              <QuestionList 
                assignedQuestions={assignedQuestions} 
                isEmployee={false} 
                refetchQuestions={fetchData} 
              />
            ) : (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No assessments have been assigned yet.</p>
              </Card>
            )}
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
                {analysisResults.length > 0 ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Date Completed</TableHead>
                          <TableHead>Risk Level</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisResults.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{result.user_profiles?.name || 'Unknown Employee'}</p>
                                <p className="text-sm text-muted-foreground">{result.user_profiles?.email || 'No email'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {result.completed_at ? new Date(result.completed_at).toLocaleDateString() : 'Not completed'}
                            </TableCell>
                            <TableCell>
                              <div className={`px-3 py-1 rounded-full text-sm inline-block ${getRiskColor(result.risk_level)}`}>
                                {result.risk_level === 'low' ? 'Low Risk' : 
                                 result.risk_level === 'medium' ? 'Medium Risk' : 
                                 result.risk_level === 'high' ? 'High Risk' : 'Unknown'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <button 
                                className="text-wellness-teal hover:underline text-sm"
                                onClick={() => {
                                  // This would ideally open a modal or navigate to a detailed view
                                  toast.info('Detailed view not implemented yet');
                                }}
                              >
                                View Details
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">No analysis results available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default HRDashboard;

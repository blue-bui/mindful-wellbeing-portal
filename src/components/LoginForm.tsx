
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('employee');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real application, this would be replaced with Supabase authentication
      console.log('Login attempt:', { username, password, userType });
      
      // Simulate authentication for demo purposes
      setTimeout(() => {
        setIsLoading(false);
        
        if (username && password) {
          if (userType === 'hr') {
            navigate('/hr-dashboard');
          } else {
            navigate('/employee-dashboard');
          }
          toast.success('Login successful');
        } else {
          toast.error('Invalid credentials');
        }
      }, 1000);
      
    } catch (error) {
      setIsLoading(false);
      toast.error('Login failed');
      console.error('Login error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-wellness-teal">Login</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>User Type</Label>
            <RadioGroup value={userType} onValueChange={setUserType} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="employee" />
                <Label htmlFor="employee" className="font-normal">Employee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hr" id="hr" />
                <Label htmlFor="hr" className="font-normal">HR</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-wellness-teal hover:bg-wellness-teal/90"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-gray-500">
        <p>For demo purposes only. No real authentication implemented.</p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;

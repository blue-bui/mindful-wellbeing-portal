
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Label } from "@/components/ui/label";

const SignupForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isHr, setIsHr] = useState(false);
  const [hrPassword, setHrPassword] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isHr && hrPassword !== 'iamhr') {
        toast.error('Invalid HR password');
        setLoading(false);
        return;
      }

      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: isHr ? 'hr' : 'employee'
          }
        }
      });

      if (signupError) throw signupError;

      if (signupData.user) {
        toast.success('Account created successfully! Please check your email for verification.');
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <div>
        <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
        />
      </div>

      <div>
        <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          minLength={6}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isHr"
          checked={isHr}
          onChange={(e) => setIsHr(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isHr">Sign up as HR</Label>
      </div>

      {isHr && (
        <div>
          <Label htmlFor="hrPassword" className="block text-sm font-medium text-gray-700 mb-1">
            HR Password
          </Label>
          <Input
            id="hrPassword"
            type="password"
            required
            value={hrPassword}
            onChange={(e) => setHrPassword(e.target.value)}
            placeholder="Enter HR password"
          />
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-wellness-teal hover:bg-wellness-teal/90"
        disabled={loading}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>

      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-wellness-teal hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
};

export default SignupForm;

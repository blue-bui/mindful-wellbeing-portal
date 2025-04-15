
import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const supabaseUrl = 'https://xuqgkncmciymfqrudrpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cWdrbmNtY2l5bWZxcnVkcnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzIwNzUsImV4cCI6MjA2MDMwODA3NX0.tEpBgOj9F0XxWcfQvh4JOPjtvvfaD5N0otSUM4iaEm8';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials', {
    url: supabaseUrl,
    anonKeyPresent: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type UserProfile = {
  id: string;
  user_id: string;
  role: 'hr' | 'employee';
  name: string;
  email: string;
  created_at: string;
};

export type Question = {
  id: string;
  question_set_id: string;
  employee_id: string;
  hr_id: string;
  question_text: string;
  answer_text?: string;
  status: 'pending' | 'answered' | 'analyzed';
  risk_level?: 'low' | 'medium' | 'high';
  created_at: string;
  answered_at?: string;
};

export type QuestionSet = {
  id: string;
  hr_id: string;
  employee_id: string;
  prompt: string;
  status: 'pending' | 'completed' | 'analyzed';
  risk_level?: 'low' | 'medium' | 'high';
  created_at: string;
  completed_at?: string;
};

export type QuestionHistory = {
  id: string;
  question_set_id: string;
  employee_id: string;
  hr_id: string;
  overall_risk_level: 'low' | 'medium' | 'high';
  completed_at: string;
};

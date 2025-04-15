
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables', {
    url: supabaseUrl,
    anonKeyPresent: !!supabaseAnonKey
  });
  throw new Error(`
    Missing Supabase environment variables. 
    Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.
    
    To resolve this:
    1. Check your Supabase project settings
    2. Add these variables to your project configuration
    3. Restart the development server
  `);
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
  questions: Question[];
  overall_risk_level: 'low' | 'medium' | 'high';
  completed_at: string;
};

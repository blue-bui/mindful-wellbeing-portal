
-- Create user_profiles table to store user roles and information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('hr', 'employee')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies to user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own profile
CREATE POLICY "Users can read their own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow HR to read all employee profiles
CREATE POLICY "HR can read all profiles" 
  ON public.user_profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'hr'
    )
  );

-- Policy to allow system to update profiles
CREATE POLICY "System can update profiles" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (true);

-- Create question_sets table to store sets of questions assigned to employees
CREATE TABLE IF NOT EXISTS public.question_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hr_id UUID REFERENCES auth.users(id),
  employee_id UUID REFERENCES auth.users(id),
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'analyzed')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies to question_sets table
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;

-- Policy to allow HR to read and create question sets
CREATE POLICY "HR can manage question sets" 
  ON public.question_sets 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'hr'
    )
  );

-- Policy to allow employees to view their assigned question sets
CREATE POLICY "Employees can view their question sets" 
  ON public.question_sets 
  FOR SELECT 
  USING (employee_id = auth.uid());

-- Policy to allow employees to update their assigned question sets (to mark as completed)
CREATE POLICY "Employees can update their question sets" 
  ON public.question_sets 
  FOR UPDATE 
  USING (employee_id = auth.uid());

-- Create questions table to store individual questions and answers
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_set_id UUID REFERENCES public.question_sets(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES auth.users(id),
  hr_id UUID REFERENCES auth.users(id),
  question_text TEXT NOT NULL,
  answer_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'analyzed')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies to questions table
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policy to allow HR to read questions
CREATE POLICY "HR can view questions" 
  ON public.questions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'hr'
    )
  );

-- Policy to allow employees to view their questions
CREATE POLICY "Employees can view their questions" 
  ON public.questions 
  FOR SELECT 
  USING (employee_id = auth.uid());

-- Policy to allow employees to update their questions (to provide answers)
CREATE POLICY "Employees can update their questions" 
  ON public.questions 
  FOR UPDATE 
  USING (employee_id = auth.uid());

-- Create question_history table to store completed question sets
CREATE TABLE IF NOT EXISTS public.question_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_set_id UUID REFERENCES public.question_sets(id),
  employee_id UUID REFERENCES auth.users(id),
  hr_id UUID REFERENCES auth.users(id),
  overall_risk_level TEXT CHECK (overall_risk_level IN ('low', 'medium', 'high')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies to question_history table
ALTER TABLE public.question_history ENABLE ROW LEVEL SECURITY;

-- Policy to allow HR to read question history
CREATE POLICY "HR can view question history" 
  ON public.question_history 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'hr'
    )
  );

-- Policy to allow employees to view their question history
CREATE POLICY "Employees can view their question history" 
  ON public.question_history 
  FOR SELECT 
  USING (employee_id = auth.uid());

-- Create a function to update user_profile when a user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, name, email)
  VALUES (new.id, 'employee', new.raw_user_meta_data->>'name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

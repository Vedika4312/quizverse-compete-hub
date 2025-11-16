-- Phase 3: Complete Database Schema for Programming Interview Platform

-- ============================================
-- 1. CREATE CANDIDATE PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  skills TEXT[],
  experience_years INTEGER,
  education TEXT,
  current_company TEXT,
  preferred_role TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 2. RENAME TEAMS TO COMPANIES
-- ============================================
ALTER TABLE teams RENAME TO companies;
ALTER TABLE team_members RENAME TO company_members;

-- Add email column to company_members if not exists
ALTER TABLE company_members 
ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================
-- 3. CREATE INTERVIEW SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interviewer_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  scheduled_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  duration_minutes INTEGER DEFAULT 60,
  interview_type TEXT DEFAULT 'technical', -- technical, behavioral, system_design
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 4. CREATE CODING CHALLENGES TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS coding_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium', -- easy, medium, hard
  category TEXT, -- arrays, strings, dynamic_programming, etc.
  starter_code JSONB DEFAULT '{}'::jsonb, -- {language: code} pairs
  test_cases JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {input, expected_output, is_hidden}
  time_limit INTEGER DEFAULT 30,
  memory_limit INTEGER,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 5. CREATE CHALLENGE SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES coding_challenges(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES auth.users(id),
  session_id UUID REFERENCES interview_sessions(id),
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  test_results JSONB DEFAULT '[]'::jsonb, -- Array of test case results
  passed_tests INTEGER DEFAULT 0,
  total_tests INTEGER DEFAULT 0,
  execution_time INTEGER, -- milliseconds
  memory_used INTEGER, -- bytes
  status TEXT DEFAULT 'pending', -- pending, passed, failed, error
  submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 6. CREATE INTERVIEW FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  interviewer_id UUID REFERENCES auth.users(id) NOT NULL,
  technical_skills INTEGER CHECK (technical_skills >= 1 AND technical_skills <= 5),
  problem_solving INTEGER CHECK (problem_solving >= 1 AND problem_solving <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  code_quality INTEGER CHECK (code_quality >= 1 AND code_quality <= 5),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  comments TEXT,
  recommendation TEXT, -- hire, maybe, reject
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 7. CREATE SECURITY FUNCTIONS
-- ============================================

-- Function to check if user is interviewer
CREATE OR REPLACE FUNCTION is_interviewer(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = $1 AND role IN ('admin', 'interviewer')
  );
$$;

-- Function to check if user is candidate
CREATE OR REPLACE FUNCTION is_candidate(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = $1 AND role IN ('candidate', 'user')
  );
$$;

-- ============================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. CREATE RLS POLICIES
-- ============================================

-- Candidate Profiles Policies
CREATE POLICY "Users can view their own profile"
ON candidate_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
ON candidate_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON candidate_profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins and interviewers can view all profiles"
ON candidate_profiles FOR SELECT
USING (is_interviewer(auth.uid()));

-- Interview Sessions Policies
CREATE POLICY "Candidates can view their own sessions"
ON interview_sessions FOR SELECT
USING (auth.uid() = candidate_id);

CREATE POLICY "Interviewers can view their assigned sessions"
ON interview_sessions FOR SELECT
USING (auth.uid() = interviewer_id OR is_admin(auth.uid()));

CREATE POLICY "Interviewers can create sessions"
ON interview_sessions FOR INSERT
WITH CHECK (is_interviewer(auth.uid()));

CREATE POLICY "Interviewers can update their sessions"
ON interview_sessions FOR UPDATE
USING (auth.uid() = interviewer_id OR is_admin(auth.uid()));

-- Coding Challenges Policies
CREATE POLICY "Everyone can view challenges"
ON coding_challenges FOR SELECT
USING (true);

CREATE POLICY "Admins can create challenges"
ON coding_challenges FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update challenges"
ON coding_challenges FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete challenges"
ON coding_challenges FOR DELETE
USING (is_admin(auth.uid()));

-- Challenge Submissions Policies
CREATE POLICY "Candidates can view their own submissions"
ON challenge_submissions FOR SELECT
USING (auth.uid() = candidate_id);

CREATE POLICY "Interviewers can view submissions for their sessions"
ON challenge_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM interview_sessions
    WHERE id = challenge_submissions.session_id
    AND interviewer_id = auth.uid()
  ) OR is_admin(auth.uid())
);

CREATE POLICY "Candidates can create submissions"
ON challenge_submissions FOR INSERT
WITH CHECK (auth.uid() = candidate_id);

-- Interview Feedback Policies
CREATE POLICY "Candidates can view their own feedback"
ON interview_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM interview_sessions
    WHERE id = interview_feedback.session_id
    AND candidate_id = auth.uid()
  )
);

CREATE POLICY "Interviewers can view feedback they created"
ON interview_feedback FOR SELECT
USING (auth.uid() = interviewer_id OR is_admin(auth.uid()));

CREATE POLICY "Interviewers can create feedback"
ON interview_feedback FOR INSERT
WITH CHECK (is_interviewer(auth.uid()));

CREATE POLICY "Interviewers can update their feedback"
ON interview_feedback FOR UPDATE
USING (auth.uid() = interviewer_id OR is_admin(auth.uid()));

-- ============================================
-- 10. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_candidate_profiles_updated_at
BEFORE UPDATE ON candidate_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
export interface InterviewSession {
  id: string;
  title: string;
  candidate_id: string;
  interviewer_id: string | null;
  company_id: string | null;
  scheduled_time: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  duration_minutes: number;
  interview_type: 'technical' | 'behavioral' | 'system_design';
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string | null;
  starter_code: Record<string, string> | null;
  test_cases: TestCase[];
  time_limit: number;
  memory_limit: number | null;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
}

export interface TestCase {
  input: any;
  expected_output: any;
  is_hidden: boolean;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  candidate_id: string;
  session_id: string | null;
  code: string;
  language: string;
  test_results: TestResult[] | null;
  passed_tests: number;
  total_tests: number;
  execution_time: number | null;
  memory_used: number | null;
  status: 'pending' | 'passed' | 'failed' | 'error';
  submitted_at: string;
}

export interface TestResult {
  test_case_index: number;
  passed: boolean;
  actual_output: any;
  expected_output: any;
  error?: string;
}

export interface InterviewFeedback {
  id: string;
  session_id: string;
  interviewer_id: string;
  technical_skills: number | null;
  problem_solving: number | null;
  communication: number | null;
  code_quality: number | null;
  overall_rating: number | null;
  comments: string | null;
  recommendation: 'hire' | 'maybe' | 'reject' | null;
  created_at: string;
}

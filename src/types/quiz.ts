
export type QuestionType = 'multiple_choice' | 'written';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  question_type: QuestionType;
  time_limit: number;
  correct_answer: string;
  has_compiler?: boolean;
  compiler_language?: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface QuizSettings {
  id: number;
  overall_time_limit: number | null;
  quiz_start_time: string | null;
}

// The following interfaces are kept for reference but no longer used in the admin panel
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  member_name: string;
  email: string | null;
  is_captain: boolean;
  joined_at: string;
}

export interface TeamScore {
  id: string;
  team_id: string;
  score: number;
  quiz_date: string | null;
}

export interface Question {
  id: string;
  question_text: string;
  created_at: string;
  quiz_id?: number;
}

export interface QAItem {
  id: number;
  question_text: string;
  answer_text: string;
  created_at: string;
  quiz_id?: number;
}

export interface AdminUser {
  id: string;
  user_id: string;
  added_by: string;
  created_at: string;
}

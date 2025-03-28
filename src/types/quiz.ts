
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
}

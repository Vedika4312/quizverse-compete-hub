export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      candidate_profiles: {
        Row: {
          created_at: string
          current_company: string | null
          education: string | null
          email: string
          experience_years: number | null
          full_name: string
          github_url: string | null
          id: string
          linkedin_url: string | null
          phone: string | null
          preferred_role: string | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_company?: string | null
          education?: string | null
          email: string
          experience_years?: number | null
          full_name: string
          github_url?: string | null
          id: string
          linkedin_url?: string | null
          phone?: string | null
          preferred_role?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_company?: string | null
          education?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          preferred_role?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      challenge_submissions: {
        Row: {
          candidate_id: string | null
          challenge_id: string | null
          code: string
          execution_time: number | null
          id: string
          language: string
          memory_used: number | null
          passed_tests: number | null
          session_id: string | null
          status: string | null
          submitted_at: string
          test_results: Json | null
          total_tests: number | null
        }
        Insert: {
          candidate_id?: string | null
          challenge_id?: string | null
          code: string
          execution_time?: number | null
          id?: string
          language: string
          memory_used?: number | null
          passed_tests?: number | null
          session_id?: string | null
          status?: string | null
          submitted_at?: string
          test_results?: Json | null
          total_tests?: number | null
        }
        Update: {
          candidate_id?: string | null
          challenge_id?: string | null
          code?: string
          execution_time?: number | null
          id?: string
          language?: string
          memory_used?: number | null
          passed_tests?: number | null
          session_id?: string | null
          status?: string | null
          submitted_at?: string
          test_results?: Json | null
          total_tests?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "coding_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_submissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_challenges: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: string | null
          id: string
          memory_limit: number | null
          starter_code: Json | null
          tags: string[] | null
          test_cases: Json
          time_limit: number | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          difficulty?: string | null
          id?: string
          memory_limit?: number | null
          starter_code?: Json | null
          tags?: string[] | null
          test_cases?: Json
          time_limit?: number | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string | null
          id?: string
          memory_limit?: number | null
          starter_code?: Json | null
          tags?: string[] | null
          test_cases?: Json
          time_limit?: number | null
          title?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          captain_id: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          captain_id?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          captain_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          email: string | null
          id: string
          is_captain: boolean | null
          joined_at: string | null
          member_name: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          email?: string | null
          id?: string
          is_captain?: boolean | null
          joined_at?: string | null
          member_name: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          is_captain?: boolean | null
          joined_at?: string | null
          member_name?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_feedback: {
        Row: {
          code_quality: number | null
          comments: string | null
          communication: number | null
          created_at: string
          id: string
          interviewer_id: string
          overall_rating: number | null
          problem_solving: number | null
          recommendation: string | null
          session_id: string
          technical_skills: number | null
        }
        Insert: {
          code_quality?: number | null
          comments?: string | null
          communication?: number | null
          created_at?: string
          id?: string
          interviewer_id: string
          overall_rating?: number | null
          problem_solving?: number | null
          recommendation?: string | null
          session_id: string
          technical_skills?: number | null
        }
        Update: {
          code_quality?: number | null
          comments?: string | null
          communication?: number | null
          created_at?: string
          id?: string
          interviewer_id?: string
          overall_rating?: number | null
          problem_solving?: number | null
          recommendation?: string | null
          session_id?: string
          technical_skills?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_room_presence: {
        Row: {
          audio_enabled: boolean | null
          id: string
          joined_at: string | null
          left_at: string | null
          role: string
          session_id: string | null
          user_id: string
          video_enabled: boolean | null
        }
        Insert: {
          audio_enabled?: boolean | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role: string
          session_id?: string | null
          user_id: string
          video_enabled?: boolean | null
        }
        Update: {
          audio_enabled?: boolean | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string
          session_id?: string | null
          user_id?: string
          video_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_room_presence_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          candidate_id: string
          company_id: string | null
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          interview_type: string | null
          interviewer_id: string | null
          notes: string | null
          scheduled_time: string | null
          status: string | null
          title: string
        }
        Insert: {
          candidate_id: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          interview_type?: string | null
          interviewer_id?: string | null
          notes?: string | null
          scheduled_time?: string | null
          status?: string | null
          title: string
        }
        Update: {
          candidate_id?: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          interview_type?: string | null
          interviewer_id?: string | null
          notes?: string | null
          scheduled_time?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          compiler_language: string | null
          correct_answer: string
          created_at: string | null
          created_by: string | null
          has_compiler: boolean | null
          id: string
          options: Json
          question: string
          question_type: string
          time_limit: number
        }
        Insert: {
          compiler_language?: string | null
          correct_answer: string
          created_at?: string | null
          created_by?: string | null
          has_compiler?: boolean | null
          id?: string
          options?: Json
          question: string
          question_type?: string
          time_limit?: number
        }
        Update: {
          compiler_language?: string | null
          correct_answer?: string
          created_at?: string | null
          created_by?: string | null
          has_compiler?: boolean | null
          id?: string
          options?: Json
          question?: string
          question_type?: string
          time_limit?: number
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          completed_at: string | null
          id: string
          score: number
          team_name: string | null
          total_questions: number
          user_id: string
          user_name: string | null
          written_answers: Json | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          score?: number
          team_name?: string | null
          total_questions?: number
          user_id: string
          user_name?: string | null
          written_answers?: Json | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          score?: number
          team_name?: string | null
          total_questions?: number
          user_id?: string
          user_name?: string | null
          written_answers?: Json | null
        }
        Relationships: []
      }
      quiz_settings: {
        Row: {
          id: number
          overall_time_limit: number | null
          quiz_start_time: string | null
        }
        Insert: {
          id?: number
          overall_time_limit?: number | null
          quiz_start_time?: string | null
        }
        Update: {
          id?: number
          overall_time_limit?: number | null
          quiz_start_time?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      written_answers: {
        Row: {
          answer: string
          created_at: string
          id: string
          question_id: string
          quiz_result_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question_id: string
          quiz_result_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question_id?: string
          quiz_result_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "written_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "written_answers_quiz_result_id_fkey"
            columns: ["quiz_result_id"]
            isOneToOne: false
            referencedRelation: "quiz_results"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_user: { Args: { user_email: string }; Returns: Json }
      get_quiz_settings: {
        Args: never
        Returns: {
          id: number
          overall_time_limit: number | null
          quiz_start_time: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "quiz_settings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_candidate: { Args: { user_id: string }; Returns: boolean }
      is_interviewer: { Args: { user_id: string }; Returns: boolean }
      update_quiz_settings: {
        Args: { p_overall_time_limit: number; p_quiz_start_time: string }
        Returns: {
          id: number
          overall_time_limit: number | null
          quiz_start_time: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "quiz_settings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

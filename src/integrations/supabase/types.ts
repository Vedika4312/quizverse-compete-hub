export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_management: {
        Row: {
          added_by: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          created_at: string | null
          id: number
          role_name: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          role_name: string
        }
        Update: {
          created_at?: string | null
          id?: never
          role_name?: string
        }
        Relationships: []
      }
      marks: {
        Row: {
          created_at: string | null
          id: number
          quiz_id: number
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          quiz_id: number
          score: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          quiz_id?: number
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marks_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          role: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      qa_items: {
        Row: {
          answer_text: string
          created_at: string | null
          id: number
          question_text: string
          quiz_id: number | null
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          id?: number
          question_text: string
          quiz_id?: number | null
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          id?: number
          question_text?: string
          quiz_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_items_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string | null
          id: number
          question_text: string
          quiz_id: number
        }
        Insert: {
          created_at?: string | null
          id?: never
          question_text: string
          quiz_id: number
        }
        Update: {
          created_at?: string | null
          id?: never
          question_text?: string
          quiz_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          compiler_language: string | null
          correct_answer: string
          created_at: string
          created_by: string
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
          created_at?: string
          created_by: string
          has_compiler?: boolean | null
          id?: string
          options: Json
          question: string
          question_type?: string
          time_limit?: number
        }
        Update: {
          compiler_language?: string | null
          correct_answer?: string
          created_at?: string
          created_by?: string
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
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          score?: number
          total_questions?: number
          user_id?: string
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
      team_members: {
        Row: {
          email: string | null
          id: string
          is_captain: boolean | null
          joined_at: string
          member_name: string
          team_id: string
          user_id: string
        }
        Insert: {
          email?: string | null
          id?: string
          is_captain?: boolean | null
          joined_at?: string
          member_name: string
          team_id: string
          user_id: string
        }
        Update: {
          email?: string | null
          id?: string
          is_captain?: boolean | null
          joined_at?: string
          member_name?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_scores: {
        Row: {
          id: string
          quiz_date: string | null
          score: number
          team_id: string
        }
        Insert: {
          id?: string
          quiz_date?: string | null
          score?: number
          team_id: string
        }
        Update: {
          id?: string
          quiz_date?: string | null
          score?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          captain_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          captain_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          captain_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_user: {
        Args: {
          user_email: string
        }
        Returns: string
      }
      get_quiz_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          overall_time_limit: number
          quiz_start_time: string
        }[]
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      update_quiz_settings: {
        Args: {
          p_overall_time_limit: number
          p_quiz_start_time?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

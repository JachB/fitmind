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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string
          icon: string
          name: string
          slug: string
          sort_order: number
          xp_reward: number
        }
        Insert: {
          description: string
          icon: string
          name: string
          slug: string
          sort_order?: number
          xp_reward?: number
        }
        Update: {
          description?: string
          icon?: string
          name?: string
          slug?: string
          sort_order?: number
          xp_reward?: number
        }
        Relationships: []
      }
      conversation_summaries: {
        Row: {
          created_at: string
          id: string
          summary: string
          up_to_message_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary: string
          up_to_message_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          summary?: string
          up_to_message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_up_to_message_id_fkey"
            columns: ["up_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quests: {
        Row: {
          completed: boolean
          created_at: string
          description: string
          id: string
          progress: number
          quest_date: string
          target: number
          type: Database["public"]["Enums"]["quest_type"]
          user_id: string
          xp_reward: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description: string
          id?: string
          progress?: number
          quest_date: string
          target: number
          type: Database["public"]["Enums"]["quest_type"]
          user_id: string
          xp_reward?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string
          id?: string
          progress?: number
          quest_date?: string
          target?: number
          type?: Database["public"]["Enums"]["quest_type"]
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      exercises: {
        Row: {
          bw_coefficient: number
          created_at: string
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          id: string
          name: string
          position: number
          workout_id: string
        }
        Insert: {
          bw_coefficient?: number
          created_at?: string
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          id?: string
          name: string
          position?: number
          workout_id: string
        }
        Update: {
          bw_coefficient?: number
          created_at?: string
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          id?: string
          name?: string
          position?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["message_role"]
          token_count: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["message_role"]
          token_count?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["message_role"]
          token_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string
          estimated_1rm: number
          lift: string
          reps: number
          user_id: string
          weight_kg: number
          workout_id: string | null
        }
        Insert: {
          achieved_at?: string
          estimated_1rm: number
          lift: string
          reps: number
          user_id: string
          weight_kg: number
          workout_id?: string | null
        }
        Update: {
          achieved_at?: string
          estimated_1rm?: number
          lift?: string
          reps?: number
          user_id?: string
          weight_kg?: number
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          body_weight_kg: number | null
          coach_persona: Database["public"]["Enums"]["coach_persona"]
          created_at: string
          display_name: string | null
          goal: string | null
          id: string
          onboarded_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          body_weight_kg?: number | null
          coach_persona?: Database["public"]["Enums"]["coach_persona"]
          created_at?: string
          display_name?: string | null
          goal?: string | null
          id: string
          onboarded_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          body_weight_kg?: number | null
          coach_persona?: Database["public"]["Enums"]["coach_persona"]
          created_at?: string
          display_name?: string | null
          goal?: string | null
          id?: string
          onboarded_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sets: {
        Row: {
          created_at: string
          duration_seconds: number | null
          exercise_id: string
          id: string
          position: number
          reps: number
          rpe: number | null
          weight_kg: number
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          position?: number
          reps: number
          rpe?: number | null
          weight_kg?: number
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          position?: number
          reps?: number
          rpe?: number | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_slug: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_slug: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_slug?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_slug_fkey"
            columns: ["achievement_slug"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_stats: {
        Row: {
          created_at: string
          current_streak: number
          last_active_date: string | null
          level: number
          longest_streak: number
          total_volume_kg: number
          total_work_seconds: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          total_volume_kg?: number
          total_work_seconds?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          total_volume_kg?: number
          total_work_seconds?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          goal_snapshot: string | null
          id: string
          persona_snapshot: string
          plan: Json
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          goal_snapshot?: string | null
          id?: string
          persona_snapshot: string
          plan: Json
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          goal_snapshot?: string | null
          id?: string
          persona_snapshot?: string
          plan?: Json
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          performed_at: string
          source_message_id: string | null
          total_volume_kg: number
          total_work_seconds: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          performed_at?: string
          source_message_id?: string | null
          total_volume_kg?: number
          total_work_seconds?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          performed_at?: string
          source_message_id?: string | null
          total_volume_kg?: number
          total_work_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          meta: Json | null
          reason: Database["public"]["Enums"]["xp_reason"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          meta?: Json | null
          reason: Database["public"]["Enums"]["xp_reason"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          meta?: Json | null
          reason?: Database["public"]["Enums"]["xp_reason"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_level: { Args: { xp: number }; Returns: number }
      get_volume_leaderboard: {
        Args: { row_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          level: number
          total_volume_kg: number
          user_id: string
        }[]
      }
      get_weekly_leaderboard: {
        Args: { row_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          level: number
          user_id: string
          weekly_xp: number
        }[]
      }
      get_xp_leaderboard: {
        Args: { row_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          level: number
          total_xp: number
          user_id: string
        }[]
      }
    }
    Enums: {
      coach_persona: "empathetic" | "hardcore" | "friend" | "pro"
      exercise_type: "weighted" | "bodyweight" | "timed"
      message_role: "user" | "assistant" | "system"
      quest_type:
        | "message_count"
        | "workout_log"
        | "exercise_variety"
        | "streak_day"
      xp_reason:
        | "message"
        | "long_message_bonus"
        | "workout_logged"
        | "quest_completed"
        | "streak_bonus"
        | "achievement_unlocked"
        | "daily_login"
        | "pr_set"
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
    Enums: {
      coach_persona: ["empathetic", "hardcore", "friend", "pro"],
      exercise_type: ["weighted", "bodyweight", "timed"],
      message_role: ["user", "assistant", "system"],
      quest_type: [
        "message_count",
        "workout_log",
        "exercise_variety",
        "streak_day",
      ],
      xp_reason: [
        "message",
        "long_message_bonus",
        "workout_logged",
        "quest_completed",
        "streak_bonus",
        "achievement_unlocked",
        "daily_login",
        "pr_set",
      ],
    },
  },
} as const

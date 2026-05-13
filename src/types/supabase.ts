// This file should be generated with `supabase gen types typescript`
// For now, this is a placeholder. Run the following to generate:
// npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      user_preferences: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      workout_programs: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      workout_templates: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      workout_sessions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      exercise_logs: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      progress_metrics: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      personal_records: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      ai_recommendations: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      recovery_scores: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      coach_messages: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      exercise_definitions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

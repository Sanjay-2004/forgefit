-- ForgeFit Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & PROFILES
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  age INTEGER,
  sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  height_cm NUMERIC,
  weight_kg NUMERIC,
  fitness_goal TEXT CHECK (fitness_goal IN ('fat_loss', 'muscle_gain', 'recomposition', 'endurance', 'athletic_performance', 'general_fitness')),
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  injuries TEXT,
  equipment_access TEXT CHECK (equipment_access IN ('full_gym', 'dumbbells_only', 'resistance_bands', 'bodyweight_only', 'running_only', 'hybrid')),
  preferred_styles TEXT[] DEFAULT '{}',
  workout_days_per_week INTEGER DEFAULT 4,
  session_duration_minutes INTEGER DEFAULT 60,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent')),
  stress_level TEXT CHECK (stress_level IN ('low', 'moderate', 'high', 'very_high')),
  nutrition_preferences TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- EXERCISE DEFINITIONS
-- ============================================

CREATE TABLE public.exercise_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  primary_muscles TEXT[] NOT NULL DEFAULT '{}',
  secondary_muscles TEXT[] DEFAULT '{}',
  equipment TEXT,
  instructions TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKOUT PROGRAMS & TEMPLATES
-- ============================================

CREATE TABLE public.workout_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  description TEXT,
  weekly_plan JSONB NOT NULL,
  progression_strategy TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  ai_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  name TEXT NOT NULL,
  focus TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  warmup JSONB,
  cooldown JSONB,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKOUT SESSIONS & LOGS
-- ============================================

CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.workout_programs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  focus TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  overall_rpe NUMERIC CHECK (overall_rpe BETWEEN 1 AND 10),
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'poor', 'terrible')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_definition_id UUID REFERENCES public.exercise_definitions(id) ON DELETE SET NULL,
  muscles_worked TEXT[] DEFAULT '{}',
  set_number INTEGER NOT NULL,
  weight_kg NUMERIC,
  reps INTEGER,
  rpe NUMERIC CHECK (rpe BETWEEN 1 AND 10),
  is_completed BOOLEAN DEFAULT FALSE,
  is_warmup BOOLEAN DEFAULT FALSE,
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROGRESS & METRICS
-- ============================================

CREATE TABLE public.progress_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('body_weight', 'body_fat', 'muscle_mass', 'measurement')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  measurement_location TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('weight', 'reps', 'volume')),
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI & RECOMMENDATIONS
-- ============================================

CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('progression', 'deload', 'substitution', 'recovery', 'insight', 'warning')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  is_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.recovery_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  muscle_scores JSONB NOT NULL DEFAULT '{}',
  factors JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.coach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX idx_workout_programs_user ON public.workout_programs(user_id);
CREATE INDEX idx_workout_templates_program ON public.workout_templates(program_id);
CREATE INDEX idx_workout_sessions_user ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_date ON public.workout_sessions(started_at DESC);
CREATE INDEX idx_exercise_logs_session ON public.exercise_logs(session_id);
CREATE INDEX idx_exercise_logs_user ON public.exercise_logs(user_id);
CREATE INDEX idx_progress_metrics_user ON public.progress_metrics(user_id);
CREATE INDEX idx_personal_records_user ON public.personal_records(user_id);
CREATE INDEX idx_ai_recommendations_user ON public.ai_recommendations(user_id);
CREATE INDEX idx_recovery_scores_user ON public.recovery_scores(user_id);
CREATE INDEX idx_coach_messages_user ON public.coach_messages(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Workout programs
CREATE POLICY "Users can manage own programs" ON public.workout_programs FOR ALL USING (auth.uid() = user_id);

-- Workout templates
CREATE POLICY "Users can manage own templates" ON public.workout_templates FOR ALL USING (auth.uid() = user_id);

-- Workout sessions
CREATE POLICY "Users can manage own sessions" ON public.workout_sessions FOR ALL USING (auth.uid() = user_id);

-- Exercise logs
CREATE POLICY "Users can manage own exercise logs" ON public.exercise_logs FOR ALL USING (auth.uid() = user_id);

-- Progress metrics
CREATE POLICY "Users can manage own metrics" ON public.progress_metrics FOR ALL USING (auth.uid() = user_id);

-- Personal records
CREATE POLICY "Users can manage own records" ON public.personal_records FOR ALL USING (auth.uid() = user_id);

-- AI recommendations
CREATE POLICY "Users can manage own recommendations" ON public.ai_recommendations FOR ALL USING (auth.uid() = user_id);

-- Recovery scores
CREATE POLICY "Users can manage own recovery scores" ON public.recovery_scores FOR ALL USING (auth.uid() = user_id);

-- Coach messages
CREATE POLICY "Users can manage own coach messages" ON public.coach_messages FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workout_programs_updated_at BEFORE UPDATE ON public.workout_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workout_templates_updated_at BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

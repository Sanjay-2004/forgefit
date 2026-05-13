// ============================================
// User & Profile Types
// ============================================

export type Sex = 'male' | 'female' | 'other';

export type FitnessGoal =
  | 'fat_loss'
  | 'muscle_gain'
  | 'recomposition'
  | 'endurance'
  | 'athletic_performance'
  | 'general_fitness';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type EquipmentAccess =
  | 'full_gym'
  | 'dumbbells_only'
  | 'resistance_bands'
  | 'bodyweight_only'
  | 'running_only'
  | 'hybrid';

export type WorkoutStyle =
  | 'bodybuilding'
  | 'strength'
  | 'powerlifting'
  | 'hiit'
  | 'cardio'
  | 'running'
  | 'hybrid'
  | 'calisthenics';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type StressLevel = 'low' | 'moderate' | 'high' | 'very_high';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  age: number | null;
  sex: Sex | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_goal: FitnessGoal | null;
  experience_level: ExperienceLevel | null;
  injuries: string | null;
  equipment_access: EquipmentAccess | null;
  preferred_styles: WorkoutStyle[];
  workout_days_per_week: number;
  session_duration_minutes: number;
  activity_level: ActivityLevel | null;
  sleep_quality: SleepQuality | null;
  stress_level: StressLevel | null;
  nutrition_preferences: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Workout Types
// ============================================

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: string;
  primary_muscles: MuscleGroup[];
  secondary_muscles: MuscleGroup[];
  equipment: string | null;
  instructions: string | null;
  video_url: string | null;
}

export interface WorkoutProgram {
  id: string;
  user_id: string;
  name: string;
  goal: string | null;
  description: string | null;
  weekly_plan: WeeklyPlan;
  progression_strategy: string | null;
  is_active: boolean;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplate {
  id: string;
  program_id: string;
  user_id: string;
  day_of_week: number;
  name: string;
  focus: string | null;
  exercises: TemplateExercise[];
  warmup: WarmupCooldown | null;
  cooldown: WarmupCooldown | null;
  estimated_duration_minutes: number | null;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  template_id: string | null;
  program_id: string | null;
  name: string;
  focus: string | null;
  status: 'in_progress' | 'completed' | 'skipped';
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  overall_rpe: number | null;
  mood: 'great' | 'good' | 'okay' | 'poor' | 'terrible' | null;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  session_id: string;
  user_id: string;
  exercise_name: string;
  exercise_definition_id: string | null;
  muscles_worked: MuscleGroup[];
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_completed: boolean;
  is_warmup: boolean;
  rest_seconds: number | null;
  notes: string | null;
  created_at: string;
}

// ============================================
// AI & Program Generation Types
// ============================================

export interface TemplateExercise {
  name: string;
  muscles: MuscleGroup[];
  sets: number;
  repRange: string;
  restSeconds: number;
  notes: string;
}

export interface DayPlan {
  day: string;
  focus: string;
  exercises: TemplateExercise[];
  warmup?: string[];
  cooldown?: string[];
}

export interface WeeklyPlan {
  programName: string;
  goal: string;
  weeklyPlan: DayPlan[];
}

export interface WarmupCooldown {
  exercises: string[];
  duration_minutes: number;
}

// ============================================
// Progress & Analytics Types
// ============================================

export interface ProgressMetric {
  id: string;
  user_id: string;
  metric_type: 'body_weight' | 'body_fat' | 'muscle_mass' | 'measurement';
  value: number;
  unit: string;
  measurement_location: string | null;
  recorded_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  record_type: 'weight' | 'reps' | 'volume';
  value: number;
  previous_value: number | null;
  achieved_at: string;
}

export interface AIRecommendation {
  id: string;
  user_id: string;
  session_id: string | null;
  recommendation_type: 'progression' | 'deload' | 'substitution' | 'recovery' | 'insight' | 'warning';
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  is_applied: boolean;
  created_at: string;
}

export interface RecoveryScore {
  id: string;
  user_id: string;
  overall_score: number;
  muscle_scores: Record<MuscleGroup, number>;
  factors: Record<string, unknown> | null;
  calculated_at: string;
}

export interface CoachMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  context: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// Muscle Groups
// ============================================

export type MuscleGroup =
  | 'chest'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'triceps'
  | 'biceps'
  | 'forearms'
  | 'upper_back'
  | 'lats'
  | 'lower_back'
  | 'traps'
  | 'abs'
  | 'obliques'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'hip_flexors'
  | 'neck';

// ============================================
// Onboarding Types
// ============================================

export interface OnboardingData {
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  fitness_goal: FitnessGoal;
  experience_level: ExperienceLevel;
  injuries: string;
  equipment_access: EquipmentAccess;
  preferred_styles: WorkoutStyle[];
  workout_days_per_week: number;
  session_duration_minutes: number;
  activity_level: ActivityLevel;
  sleep_quality: SleepQuality;
  stress_level: StressLevel;
  nutrition_preferences: string;
}

export const ONBOARDING_STEPS = [
  'basics',
  'body',
  'goals',
  'experience',
  'equipment',
  'style',
  'schedule',
  'lifestyle',
  'review',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

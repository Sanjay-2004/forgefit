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

export type TrainingLocation = 'home' | 'gym' | 'both';

export type DopamineType =
  | 'competition'   // Blue Lock — rival comparisons, leaderboards
  | 'leveling'      // Solo Leveling — XP, ranks, power display
  | 'streaks'       // Daily habit — flame, counters, consistency
  | 'social'        // Share with friends — weekly recap cards
  | 'rewards';      // Unlock cosmetics — badges, titles

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
  training_location: TrainingLocation | null;
  dopamine_type: DopamineType | null;
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
  xp_earned: number | null;
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
// Gamification Types
// ============================================

export type HunterRank =
  | 'E' | 'D' | 'C' | 'B' | 'A'
  | 'S' | 'SS' | 'SSS'
  | 'National' | 'World' | 'Monarch';

export const RANK_ORDER: HunterRank[] = [
  'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'National', 'World', 'Monarch',
];

// Cumulative XP thresholds per rank
export const RANK_XP_THRESHOLDS: Record<HunterRank, number> = {
  E: 0,
  D: 500,
  C: 1500,
  B: 4000,
  A: 10000,
  S: 25000,
  SS: 60000,
  SSS: 150000,
  National: 350000,
  World: 750000,
  Monarch: 1500000,
};

export interface UserGamification {
  id: string;
  user_id: string;
  xp_total: number;
  current_rank: HunterRank;
  streak_count: number;
  streak_freeze_count: number;
  longest_streak: number;
  last_workout_date: string | null;
  quests_completed: number;
  achievements_unlocked: number;
  created_at: string;
  updated_at: string;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  source: 'workout_complete' | 'set_complete' | 'pr_hit' | 'streak_bonus' | 'quest_complete' | 'achievement';
  description: string;
  session_id: string | null;
  created_at: string;
}

export type QuestType = 'daily' | 'weekly' | 'monthly' | 'emergency';
export type QuestStatus = 'active' | 'completed' | 'failed' | 'expired';

export interface Quest {
  id: string;
  user_id: string;
  type: QuestType;
  title: string;
  description: string;
  criteria: Record<string, unknown>;
  xp_reward: number;
  status: QuestStatus;
  progress: number;       // 0-100
  target_value: number;
  current_value: number;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: string;
  criteria_value: number;
  xp_reward: number;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  pose_type: 'front' | 'side' | 'back';
  notes: string | null;
  taken_at: string;
}

export interface UserGoalStats {
  id: string;
  user_id: string;
  metric: string;       // bench_press, squat, deadlift, body_weight, run_5k, etc.
  current_value: number;
  goal_value: number;
  unit: string;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyRecalibration {
  id: string;
  user_id: string;
  week_start: string;
  plan_json: WeeklyPlan;
  ai_reasoning: string;
  user_edits: Record<string, unknown> | null;
  accepted_at: string | null;
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
  // Existing
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  fitness_goals: FitnessGoal[];
  experience_level: ExperienceLevel;
  injuries: string;
  equipment_access: EquipmentAccess[];
  preferred_styles: WorkoutStyle[];
  workout_days_per_week: number;
  session_duration_minutes: number;
  activity_level: ActivityLevel;
  sleep_quality: SleepQuality;
  stress_level: StressLevel;
  nutrition_preferences: string;
  // New
  training_location: TrainingLocation;
  dopamine_type: DopamineType;
  current_stats: Record<string, number>;  // e.g. { bench_press: 60, squat: 80 }
  goal_stats: Record<string, number>;     // e.g. { bench_press: 100, squat: 140 }
}

export const ONBOARDING_STEPS = [
  'basics',
  'body',
  'goals',
  'experience',
  'equipment',
  'location',       // NEW: home / gym / both
  'style',
  'schedule',
  'lifestyle',
  'current-stats',  // NEW: current lift numbers
  'goal-stats',     // NEW: target numbers
  'dopamine',       // NEW: motivation style
  'review',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

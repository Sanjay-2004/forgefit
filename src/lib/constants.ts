export const FITNESS_GOALS = [
  { value: 'fat_loss', label: 'Fat Loss', icon: '🔥', description: 'Burn fat while preserving muscle' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: '💪', description: 'Build size and strength' },
  { value: 'recomposition', label: 'Recomposition', icon: '⚡', description: 'Lose fat and gain muscle simultaneously' },
  { value: 'endurance', label: 'Endurance', icon: '🏃', description: 'Improve cardiovascular fitness' },
  { value: 'athletic_performance', label: 'Athletic Performance', icon: '🏆', description: 'Sport-specific training' },
  { value: 'general_fitness', label: 'General Fitness', icon: '🎯', description: 'Overall health and wellness' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: '0-1 years of training' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years of training' },
  { value: 'advanced', label: 'Advanced', description: '3+ years of training' },
] as const;

export const EQUIPMENT_OPTIONS = [
  { value: 'full_gym', label: 'Full Gym', icon: '🏋️' },
  { value: 'dumbbells_only', label: 'Dumbbells Only', icon: '🏋️‍♂️' },
  { value: 'resistance_bands', label: 'Resistance Bands', icon: '🔗' },
  { value: 'bodyweight_only', label: 'Bodyweight Only', icon: '🤸' },
  { value: 'running_only', label: 'Running Only', icon: '🏃' },
  { value: 'hybrid', label: 'Hybrid / Mixed', icon: '🔄' },
] as const;

export const WORKOUT_STYLES = [
  { value: 'bodybuilding', label: 'Bodybuilding' },
  { value: 'strength', label: 'Strength' },
  { value: 'powerlifting', label: 'Powerlifting' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'running', label: 'Running' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'calisthenics', label: 'Calisthenics' },
] as const;

export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Desk job, minimal movement' },
  { value: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
  { value: 'extremely_active', label: 'Extremely Active', description: 'Very hard exercise, physical job' },
] as const;

export const SLEEP_QUALITY_OPTIONS = [
  { value: 'poor', label: 'Poor', description: '<5 hours or very broken sleep' },
  { value: 'fair', label: 'Fair', description: '5-6 hours, some disturbances' },
  { value: 'good', label: 'Good', description: '7-8 hours, mostly solid' },
  { value: 'excellent', label: 'Excellent', description: '8+ hours, deep and restful' },
] as const;

export const STRESS_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very High' },
] as const;

export const TRAINING_LOCATIONS = [
  { value: 'home', label: 'Home', icon: '🏠', description: 'Bodyweight / dumbbells at home' },
  { value: 'gym', label: 'Gym', icon: '🏋️', description: 'Full gym access' },
  { value: 'both', label: 'Both', icon: '🔄', description: 'Mix of home and gym days' },
] as const;

export const DOPAMINE_TYPES = [
  { value: 'competition', label: 'Competition', icon: '⚔️', description: 'Beat rivals, climb leaderboards', theme: 'Blue Lock' },
  { value: 'leveling', label: 'Leveling Up', icon: '⬆️', description: 'Gain XP, rank up, grow power', theme: 'Solo Leveling' },
  { value: 'streaks', label: 'Streaks', icon: '🔥', description: 'Build habits, never break the chain', theme: 'Daily Warrior' },
  { value: 'social', label: 'Social', icon: '📱', description: 'Share progress, weekly recaps', theme: 'Community' },
  { value: 'rewards', label: 'Rewards', icon: '🏆', description: 'Unlock badges and achievements', theme: 'Collector' },
] as const;

export const COMMON_LIFTS = [
  { key: 'bench_press', label: 'Bench Press', unit: 'kg' },
  { key: 'squat', label: 'Squat', unit: 'kg' },
  { key: 'deadlift', label: 'Deadlift', unit: 'kg' },
  { key: 'overhead_press', label: 'Overhead Press', unit: 'kg' },
  { key: 'barbell_row', label: 'Barbell Row', unit: 'kg' },
  { key: 'body_weight', label: 'Body Weight', unit: 'kg' },
  { key: 'run_5k', label: '5K Run Time', unit: 'min' },
] as const;

export const MUSCLE_GROUPS = [
  'chest', 'front_delts', 'side_delts', 'rear_delts',
  'triceps', 'biceps', 'forearms',
  'upper_back', 'lats', 'lower_back', 'traps',
  'abs', 'obliques',
  'glutes', 'quads', 'hamstrings', 'calves',
  'hip_flexors', 'neck',
] as const;

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

// XP rewards
export const XP_REWARDS = {
  SET_COMPLETE: 10,
  WORKOUT_COMPLETE: 100,
  PR_HIT: 250,
  STREAK_DAILY_BONUS: 25,
  STREAK_7_DAY: 200,
  STREAK_30_DAY: 1000,
  STREAK_100_DAY: 5000,
  QUEST_DAILY: 150,
  QUEST_WEEKLY: 500,
  QUEST_MONTHLY: 2000,
  QUEST_EMERGENCY: 300,
} as const;

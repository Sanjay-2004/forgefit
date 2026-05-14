import { z } from 'zod';

export const exerciseSchema = z.object({
  name: z.string().min(1),
  muscles: z.array(z.string()).min(1),
  sets: z.number().int().min(1).max(10),
  repRange: z.string().min(1),
  restSeconds: z.number().int().min(15).max(600),
  notes: z.string().default(''),
});

export const dayPlanSchema = z.object({
  day: z.string().min(1),
  focus: z.string().min(1),
  exercises: z.array(exerciseSchema).min(1),
  warmup: z.array(z.string()).optional(),
  cooldown: z.array(z.string()).optional(),
});

export const weeklyPlanSchema = z.object({
  programName: z.string().min(1),
  goal: z.string().min(1),
  weeklyPlan: z.array(dayPlanSchema).min(1).max(7),
});

export const onboardingSchema = z.object({
  age: z.number().int().min(16).max(120),
  sex: z.enum(['male', 'female', 'other']),
  height_cm: z.number().int().min(100).max(300),
  weight_kg: z.number().min(30).max(300),
  fitness_goals: z.array(
    z.enum(['fat_loss', 'muscle_gain', 'recomposition', 'endurance', 'athletic_performance', 'general_fitness'])
  ).min(1),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  injuries: z.string().optional().default(''),
  equipment_access: z.array(z.enum(['full_gym', 'dumbbells_only', 'resistance_bands', 'bodyweight_only', 'running_only', 'hybrid'])).min(1),
  preferred_styles: z.array(z.enum(['bodybuilding', 'strength', 'powerlifting', 'hiit', 'cardio', 'running', 'hybrid', 'calisthenics'])),
  workout_days_per_week: z.number().int().min(1).max(7),
  session_duration_minutes: z.number().int().min(15).max(180),
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']),
  sleep_quality: z.enum(['poor', 'fair', 'good', 'excellent']),
  stress_level: z.enum(['low', 'moderate', 'high', 'very_high']),
  nutrition_preferences: z.string().optional().default(''),
  training_location: z.enum(['home', 'gym', 'both']),
  dopamine_type: z.enum(['competition', 'leveling', 'streaks', 'social', 'rewards']),
  current_stats: z.record(z.string(), z.number()).default({}),
  goal_stats: z.record(z.string(), z.number()).default({}),
});

export type ValidatedWeeklyPlan = z.infer<typeof weeklyPlanSchema>;
export type ValidatedOnboardingData = z.infer<typeof onboardingSchema>;

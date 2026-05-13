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

export type ValidatedWeeklyPlan = z.infer<typeof weeklyPlanSchema>;

import { create } from 'zustand';
import type {
  OnboardingData,
  OnboardingStep,
  WorkoutStyle,
  EquipmentAccess,
  FitnessGoal,
  WorkoutSplit,
} from '@/types';
import { ONBOARDING_STEPS } from '@/types';

interface OnboardingState {
  currentStep: number;
  data: Partial<OnboardingData>;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  toggleStyle: (style: WorkoutStyle) => void;
  toggleEquipment: (equipment: EquipmentAccess) => void;
  toggleGoal: (goal: FitnessGoal) => void;
  updateStat: (key: string, value: number) => void;
  updateGoalStat: (key: string, value: number) => void;
  reset: () => void;
  getCurrentStepName: () => OnboardingStep;
}

const initialData: Partial<OnboardingData> = {
  fitness_goals: [],
  equipment_access: [],
  preferred_styles: [],
  preferred_split: 'auto',
  workout_days_per_week: 4,
  session_duration_minutes: 60,
  current_stats: {},
  goal_stats: {},
};

const MAX_STEP = ONBOARDING_STEPS.length - 1;

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 0,
  data: { ...initialData },

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, MAX_STEP) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

  updateData: (partial) =>
    set((s) => ({ data: { ...s.data, ...partial } })),

  toggleStyle: (style) =>
    set((s) => {
      const current = s.data.preferred_styles ?? [];
      const next = current.includes(style)
        ? current.filter((st) => st !== style)
        : [...current, style];
      return { data: { ...s.data, preferred_styles: next } };
    }),

  toggleEquipment: (equipment) =>
    set((s) => {
      const current = s.data.equipment_access ?? [];
      const next = current.includes(equipment)
        ? current.filter((e) => e !== equipment)
        : [...current, equipment];
      return { data: { ...s.data, equipment_access: next } };
    }),

  toggleGoal: (goal) =>
    set((s) => {
      const current = s.data.fitness_goals ?? [];
      const next = current.includes(goal)
        ? current.filter((g) => g !== goal)
        : [...current, goal];
      return { data: { ...s.data, fitness_goals: next } };
    }),

  updateStat: (key, value) =>
    set((s) => ({
      data: {
        ...s.data,
        current_stats: { ...(s.data.current_stats ?? {}), [key]: value },
      },
    })),

  updateGoalStat: (key, value) =>
    set((s) => ({
      data: {
        ...s.data,
        goal_stats: { ...(s.data.goal_stats ?? {}), [key]: value },
      },
    })),

  reset: () => set({ currentStep: 0, data: { ...initialData } }),

  getCurrentStepName: () => ONBOARDING_STEPS[get().currentStep],
}));

import { create } from 'zustand';
import type { OnboardingData, OnboardingStep, WorkoutStyle } from '@/types';

interface OnboardingState {
  currentStep: number;
  data: Partial<OnboardingData>;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  toggleStyle: (style: WorkoutStyle) => void;
  reset: () => void;
}

const initialData: Partial<OnboardingData> = {
  preferred_styles: [],
  workout_days_per_week: 4,
  session_duration_minutes: 60,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 0,
  data: { ...initialData },
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 8) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
  updateData: (partial) =>
    set((s) => ({ data: { ...s.data, ...partial } })),
  toggleStyle: (style) =>
    set((s) => {
      const current = s.data.preferred_styles ?? [];
      const next = current.includes(style)
        ? current.filter((s) => s !== style)
        : [...current, style];
      return { data: { ...s.data, preferred_styles: next } };
    }),
  reset: () => set({ currentStep: 0, data: { ...initialData } }),
}));

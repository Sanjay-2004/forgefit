import { create } from 'zustand';
import type { OnboardingData, ChallengeDuration } from '@/types';
import { DEFAULT_TARGETS } from '@/types';
import { toLocalDateString } from '@/lib/utils';

// 6 steps: 0=intro, 1=duration, 2=startDate, 3=water, 4=targets, 5=confirm
const MAX_STEP = 5;

interface OnboardingState {
  currentStep: number;
  data: Partial<OnboardingData>;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  reset: () => void;
}

const initialData: Partial<OnboardingData> = {
  durationDays: 75,
  startDate: toLocalDateString(),
  waterTarget: 3,
  dailyTargets: DEFAULT_TARGETS.map((t) => ({ ...t })),
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 0,
  data: { ...initialData },

  setStep: (step) => set({ currentStep: Math.max(0, Math.min(step, MAX_STEP)) }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, MAX_STEP) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

  updateData: (partial) => set((s) => ({ data: { ...s.data, ...partial } })),

  reset: () => set({ currentStep: 0, data: { ...initialData } }),
}));

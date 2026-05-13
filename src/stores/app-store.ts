import { create } from 'zustand';
import type { Profile, UserPreferences, WorkoutProgram } from '@/types';

interface AppState {
  profile: Profile | null;
  preferences: UserPreferences | null;
  activeProgram: WorkoutProgram | null;
  isLoading: boolean;

  setProfile: (profile: Profile | null) => void;
  setPreferences: (preferences: UserPreferences | null) => void;
  setActiveProgram: (program: WorkoutProgram | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  preferences: null,
  activeProgram: null,
  isLoading: true,

  setProfile: (profile) => set({ profile }),
  setPreferences: (preferences) => set({ preferences }),
  setActiveProgram: (program) => set({ activeProgram: program }),
  setLoading: (isLoading) => set({ isLoading }),
}));

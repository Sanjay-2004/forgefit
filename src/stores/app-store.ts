import { create } from 'zustand';
import type { Profile, UserPreferences, WorkoutProgram, UserGamification } from '@/types';

interface AppState {
  profile: Profile | null;
  preferences: UserPreferences | null;
  activeProgram: WorkoutProgram | null;
  gamification: UserGamification | null;
  isLoading: boolean;

  setProfile: (profile: Profile | null) => void;
  setPreferences: (preferences: UserPreferences | null) => void;
  setActiveProgram: (program: WorkoutProgram | null) => void;
  setGamification: (gamification: UserGamification | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  preferences: null,
  activeProgram: null,
  gamification: null,
  isLoading: false,

  setProfile: (profile) => set({ profile }),
  setPreferences: (preferences) => set({ preferences }),
  setActiveProgram: (program) => set({ activeProgram: program }),
  setGamification: (gamification) => set({ gamification: gamification }),
  setLoading: (isLoading) => set({ isLoading }),
}));

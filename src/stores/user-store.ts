import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HunterRank } from '@/types';

interface UserState {
  userId: string | null;
  name: string | null;
  email: string | null;
  avatar: string | null;
  level: number;
  totalXP: number;
  rank: HunterRank;
  isLoading: boolean;

  setUser: (data: Partial<Omit<UserState, 'setUser' | 'addXP' | 'setLoading' | 'reset'>>) => void;
  addXP: (amount: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  userId: null,
  name: null,
  email: null,
  avatar: null,
  level: 1,
  totalXP: 0,
  rank: 'E' as HunterRank,
  isLoading: false,
};

export const useUserStore = create<UserState>()(persist((set) => ({
  ...initialState,

  setUser: (data) => set((s) => ({ ...s, ...data })),

  addXP: (amount) =>
    set((s) => {
      const totalXP = s.totalXP + amount;
      const level = Math.floor(totalXP / 150) + 1;
      return { ...s, totalXP, level };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set(initialState),
}), {
  name: 'forgefit-user',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (s) => ({ userId: s.userId, name: s.name, email: s.email, avatar: s.avatar, level: s.level, totalXP: s.totalXP, rank: s.rank }),
}));

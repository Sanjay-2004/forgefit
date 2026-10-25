import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyLog, TargetLog } from '@/types';

interface DailyLogState {
  log: DailyLog | null;
  isLoading: boolean;

  setLog: (log: DailyLog | null) => void;

  // Optimistic update — synced from server response in the screen
  optimisticToggleTarget: (targetId: string) => void;
  optimisticSetWater: (liters: number) => void;
  setPhotoUrl: (url: string) => void;

  setLoading: (loading: boolean) => void;
  reset: () => void;
}

// Only `log` is persisted so today's progress survives an app restart / offline start.
export const useDailyLogStore = create<DailyLogState>()(persist((set) => ({
  log: null,
  isLoading: false,

  setLog: (log) => set({ log }),

  optimisticToggleTarget: (targetId) =>
    set((s) => {
      if (!s.log) return s;
      const targets = s.log.targetsCompleted.map((t: TargetLog) =>
        t.targetId === targetId ? { ...t, completed: !t.completed } : t,
      );
      const allCompleted = targets.every((t: TargetLog) => t.completed);
      return { log: { ...s.log, targetsCompleted: targets, allCompleted } };
    }),

  optimisticSetWater: (liters) =>
    set((s) => s.log ? { log: { ...s.log, waterIntake: liters } } : s),

  setPhotoUrl: (url) =>
    set((s) => s.log ? { log: { ...s.log, progressPhotoUrl: url } } : s),

  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ log: null, isLoading: false }),
}), {
  name: 'forgefit-daily-log',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (s) => ({ log: s.log }),
}));

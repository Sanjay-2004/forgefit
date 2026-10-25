import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Challenge } from '@/types';

interface ChallengeState {
  challenge: Challenge | null;
  setChallenge: (challenge: Challenge | null) => void;
  reset: () => void;
}

// Persisted so the app can still open (offline) with the last known challenge.
export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set) => ({
      challenge: null,
      setChallenge: (challenge) => set({ challenge }),
      reset: () => set({ challenge: null }),
    }),
    { name: 'forgefit-challenge', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

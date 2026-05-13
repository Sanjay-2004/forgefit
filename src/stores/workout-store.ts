import { create } from 'zustand';
import type { ExerciseLog, MuscleGroup } from '@/types';

interface SetData {
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_completed: boolean;
}

interface ActiveExercise {
  name: string;
  muscles: MuscleGroup[];
  targetSets: number;
  targetRepRange: string;
  restSeconds: number;
  sets: SetData[];
  notes: string;
}

interface WorkoutState {
  sessionId: string | null;
  sessionName: string;
  exercises: ActiveExercise[];
  currentExerciseIndex: number;
  isResting: boolean;
  restTimeRemaining: number;
  startTime: Date | null;
  isActive: boolean;

  startWorkout: (sessionId: string, name: string, exercises: ActiveExercise[]) => void;
  completeSet: (exerciseIndex: number, setIndex: number, data: SetData) => void;
  updateSet: (exerciseIndex: number, setIndex: number, data: Partial<SetData>) => void;
  addSet: (exerciseIndex: number) => void;
  setCurrentExercise: (index: number) => void;
  startRest: (seconds: number) => void;
  tickRest: () => void;
  stopRest: () => void;
  updateExerciseNotes: (exerciseIndex: number, notes: string) => void;
  finishWorkout: () => void;
  resetWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  sessionId: null,
  sessionName: '',
  exercises: [],
  currentExerciseIndex: 0,
  isResting: false,
  restTimeRemaining: 0,
  startTime: null,
  isActive: false,

  startWorkout: (sessionId, name, exercises) =>
    set({
      sessionId,
      sessionName: name,
      exercises,
      currentExerciseIndex: 0,
      isResting: false,
      restTimeRemaining: 0,
      startTime: new Date(),
      isActive: true,
    }),

  completeSet: (exerciseIndex, setIndex, data) =>
    set((state) => {
      const exercises = [...state.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      const sets = [...exercise.sets];
      sets[setIndex] = { ...data, is_completed: true };
      exercise.sets = sets;
      exercises[exerciseIndex] = exercise;
      return { exercises };
    }),

  updateSet: (exerciseIndex, setIndex, data) =>
    set((state) => {
      const exercises = [...state.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      const sets = [...exercise.sets];
      sets[setIndex] = { ...sets[setIndex], ...data };
      exercise.sets = sets;
      exercises[exerciseIndex] = exercise;
      return { exercises };
    }),

  addSet: (exerciseIndex) =>
    set((state) => {
      const exercises = [...state.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      exercise.sets = [
        ...exercise.sets,
        { weight_kg: null, reps: null, rpe: null, is_completed: false },
      ];
      exercise.targetSets += 1;
      exercises[exerciseIndex] = exercise;
      return { exercises };
    }),

  setCurrentExercise: (index) => set({ currentExerciseIndex: index }),

  startRest: (seconds) =>
    set({ isResting: true, restTimeRemaining: seconds }),

  tickRest: () =>
    set((state) => {
      const remaining = state.restTimeRemaining - 1;
      if (remaining <= 0) {
        return { isResting: false, restTimeRemaining: 0 };
      }
      return { restTimeRemaining: remaining };
    }),

  stopRest: () => set({ isResting: false, restTimeRemaining: 0 }),

  updateExerciseNotes: (exerciseIndex, notes) =>
    set((state) => {
      const exercises = [...state.exercises];
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], notes };
      return { exercises };
    }),

  finishWorkout: () => set({ isActive: false }),

  resetWorkout: () =>
    set({
      sessionId: null,
      sessionName: '',
      exercises: [],
      currentExerciseIndex: 0,
      isResting: false,
      restTimeRemaining: 0,
      startTime: null,
      isActive: false,
    }),
}));

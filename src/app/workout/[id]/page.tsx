'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useWorkoutStore } from '@/stores/workout-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  SkipForward,
  Square,
  Timer,
  Trophy,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MuscleGroup, TemplateExercise } from '@/types';

interface PreviousPerformance {
  exercise_name: string;
  weight_kg: number | null;
  reps: number | null;
  set_number: number;
}

export default function ActiveWorkoutPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const supabase = createClient();

  const {
    exercises,
    currentExerciseIndex,
    isResting,
    restTimeRemaining,
    isActive,
    startWorkout,
    completeSet,
    updateSet,
    addSet,
    setCurrentExercise,
    startRest,
    tickRest,
    stopRest,
    finishWorkout,
    resetWorkout,
  } = useWorkoutStore();

  const [loading, setLoading] = useState(true);
  const [previousPerformance, setPreviousPerformance] = useState<
    Record<string, PreviousPerformance[]>
  >({});
  const [elapsed, setElapsed] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>(undefined);
  const restTimerRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    loadSession();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(restTimerRef.current);
    };
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  // Rest timer
  useEffect(() => {
    if (isResting) {
      restTimerRef.current = setInterval(() => {
        tickRest();
      }, 1000);
    }
    return () => clearInterval(restTimerRef.current);
  }, [isResting, tickRest]);

  async function loadSession() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: session } = await supabase
      .from('workout_sessions')
      .select('*, workout_templates(*)')
      .eq('id', sessionId)
      .single();

    if (!session) {
      router.push('/workout');
      return;
    }

    const templateExercises = (
      session.workout_templates as unknown as { exercises: TemplateExercise[] }
    )?.exercises ?? [];

    // Load previous performance
    const exerciseNames = templateExercises.map((e) => e.name);
    const { data: prevLogs } = await supabase
      .from('exercise_logs')
      .select('exercise_name, weight_kg, reps, set_number')
      .eq('user_id', user.id)
      .in('exercise_name', exerciseNames)
      .eq('is_completed', true)
      .order('created_at', { ascending: false })
      .limit(50);

    const prevMap: Record<string, PreviousPerformance[]> = {};
    (prevLogs ?? []).forEach((log) => {
      if (!prevMap[log.exercise_name]) {
        prevMap[log.exercise_name] = [];
      }
      if (prevMap[log.exercise_name].length < 5) {
        prevMap[log.exercise_name].push(log);
      }
    });
    setPreviousPerformance(prevMap);

    const activeExercises = templateExercises.map((ex) => ({
      name: ex.name,
      muscles: ex.muscles as MuscleGroup[],
      targetSets: ex.sets,
      targetRepRange: ex.repRange,
      restSeconds: ex.restSeconds,
      notes: ex.notes || '',
      sets: Array.from({ length: ex.sets }, () => ({
        weight_kg: null,
        reps: null,
        rpe: null,
        is_completed: false,
      })),
    }));

    startWorkout(sessionId, session.name, activeExercises);
    setLoading(false);
  }

  async function handleCompleteSet(setIndex: number) {
    const exercise = exercises[currentExerciseIndex];
    const setData = exercise.sets[setIndex];

    if (setData.weight_kg === null || setData.reps === null) return;

    completeSet(currentExerciseIndex, setIndex, {
      ...setData,
      is_completed: true,
    });

    // Save to database
    await supabase.from('exercise_logs').insert({
      session_id: sessionId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      exercise_name: exercise.name,
      muscles_worked: exercise.muscles,
      set_number: setIndex + 1,
      weight_kg: setData.weight_kg,
      reps: setData.reps,
      rpe: setData.rpe,
      is_completed: true,
      rest_seconds: exercise.restSeconds,
    });

    // Start rest timer
    startRest(exercise.restSeconds);
  }

  async function handleFinishWorkout() {
    const duration = Math.floor(elapsed / 60);

    await supabase
      .from('workout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_minutes: duration,
      })
      .eq('id', sessionId);

    // Check for PRs
    for (const exercise of exercises) {
      const maxWeight = Math.max(
        ...exercise.sets
          .filter((s) => s.is_completed)
          .map((s) => s.weight_kg ?? 0)
      );

      const prev = previousPerformance[exercise.name];
      const prevMax = prev
        ? Math.max(...prev.map((p) => p.weight_kg ?? 0))
        : 0;

      if (maxWeight > prevMax && maxWeight > 0) {
        await supabase.from('personal_records').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          exercise_name: exercise.name,
          record_type: 'weight',
          value: maxWeight,
          previous_value: prevMax || null,
        });
      }
    }

    setShowComplete(true);
    finishWorkout();
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-forge-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Completion screen
  if (showComplete) {
    const totalSets = exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.is_completed).length,
      0
    );
    const totalVolume = exercises.reduce(
      (sum, ex) =>
        sum +
        ex.sets
          .filter((s) => s.is_completed)
          .reduce((v, s) => v + (s.weight_kg ?? 0) * (s.reps ?? 0), 0),
      0
    );

    return (
      <div className="min-h-screen bg-surface bg-gradient-mesh flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-full bg-accent-green/10 mx-auto flex items-center justify-center"
          >
            <Trophy className="w-10 h-10 text-accent-green" />
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold">Workout Complete! 🎉</h1>
            <p className="text-text-tertiary mt-1">{formatTime(elapsed)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-bold">{totalSets}</p>
              <p className="text-xs text-text-tertiary">Sets</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold">
                {totalVolume > 1000
                  ? `${(totalVolume / 1000).toFixed(1)}k`
                  : totalVolume}
              </p>
              <p className="text-xs text-text-tertiary">Volume (kg)</p>
            </Card>
          </div>

          <Button
            onClick={() => {
              resetWorkout();
              router.push('/dashboard');
            }}
            fullWidth
            size="lg"
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const prev = previousPerformance[currentExercise?.name];
  const completedSets = currentExercise?.sets.filter(
    (s) => s.is_completed
  ).length;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-20 glass px-4">
        <div className="flex items-center justify-between h-14">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-text-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-xs text-text-tertiary">
              Exercise {currentExerciseIndex + 1}/{exercises.length}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-forge-400">
              <Timer className="w-3.5 h-3.5" />
              {formatTime(elapsed)}
            </div>
          </div>
          <button
            onClick={handleFinishWorkout}
            className="text-sm text-accent-red font-medium"
          >
            Finish
          </button>
        </div>

        {/* Exercise progress dots */}
        <div className="flex gap-1 pb-2">
          {exercises.map((ex, i) => {
            const done = ex.sets.every((s) => s.is_completed);
            const partial = ex.sets.some((s) => s.is_completed);
            return (
              <button
                key={i}
                onClick={() => setCurrentExercise(i)}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all',
                  i === currentExerciseIndex
                    ? 'bg-forge-400'
                    : done
                    ? 'bg-accent-green'
                    : partial
                    ? 'bg-accent-orange'
                    : 'bg-surface-border'
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Rest Timer Overlay */}
      <AnimatePresence>
        {isResting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-surface/95 flex items-center justify-center"
          >
            <div className="text-center space-y-6">
              <p className="text-text-tertiary text-sm uppercase tracking-wider">
                Rest
              </p>
              <motion.p
                className="text-7xl font-bold text-forge-400 font-mono rest-pulse"
                key={restTimeRemaining}
              >
                {formatTime(restTimeRemaining)}
              </motion.p>
              <Button onClick={stopRest} variant="ghost" size="lg">
                <SkipForward className="w-5 h-5" />
                Skip Rest
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Content */}
      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentExerciseIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-4"
          >
            {/* Exercise Name */}
            <div>
              <h2 className="text-xl font-bold">{currentExercise.name}</h2>
              <p className="text-sm text-text-tertiary">
                {currentExercise.targetSets} sets × {currentExercise.targetRepRange} reps
                · {currentExercise.restSeconds}s rest
              </p>
              {currentExercise.notes && (
                <p className="text-xs text-forge-400 mt-1">
                  💡 {currentExercise.notes}
                </p>
              )}
            </div>

            {/* Previous Performance */}
            {prev && prev.length > 0 && (
              <Card className="bg-surface-elevated/50 py-2 px-3">
                <p className="text-xs text-text-tertiary mb-1">Last session:</p>
                <p className="text-sm text-text-secondary">
                  {prev
                    .slice(0, 3)
                    .map((p) => `${p.weight_kg}kg × ${p.reps}`)
                    .join(' · ')}
                </p>
              </Card>
            )}

            {/* Sets */}
            <div className="space-y-2">
              <div className="grid grid-cols-[40px_1fr_1fr_60px] gap-2 px-1 text-xs text-text-tertiary uppercase tracking-wider">
                <span>Set</span>
                <span>Weight (kg)</span>
                <span>Reps</span>
                <span></span>
              </div>

              {currentExercise.sets.map((set, setIndex) => (
                <motion.div
                  key={setIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: setIndex * 0.05 }}
                  className={cn(
                    'grid grid-cols-[40px_1fr_1fr_60px] gap-2 items-center p-2 rounded-xl transition-all',
                    set.is_completed
                      ? 'bg-accent-green/5 border border-accent-green/20'
                      : 'bg-surface-elevated border border-surface-border'
                  )}
                >
                  <span
                    className={cn(
                      'text-center font-bold text-sm',
                      set.is_completed
                        ? 'text-accent-green'
                        : 'text-text-tertiary'
                    )}
                  >
                    {setIndex + 1}
                  </span>

                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={
                      prev?.[setIndex]?.weight_kg?.toString() ?? '—'
                    }
                    value={set.weight_kg ?? ''}
                    onChange={(e) =>
                      updateSet(currentExerciseIndex, setIndex, {
                        weight_kg: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    disabled={set.is_completed}
                    className="bg-transparent text-center text-sm font-medium text-text-primary outline-none disabled:opacity-60"
                  />

                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={
                      prev?.[setIndex]?.reps?.toString() ?? '—'
                    }
                    value={set.reps ?? ''}
                    onChange={(e) =>
                      updateSet(currentExerciseIndex, setIndex, {
                        reps: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    disabled={set.is_completed}
                    className="bg-transparent text-center text-sm font-medium text-text-primary outline-none disabled:opacity-60"
                  />

                  {set.is_completed ? (
                    <div className="flex justify-center">
                      <Check className="w-5 h-5 text-accent-green" />
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteSet(setIndex)}
                      disabled={
                        set.weight_kg === null || set.reps === null
                      }
                      className="!px-2 !py-1.5"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}

              <button
                onClick={() => addSet(currentExerciseIndex)}
                className="w-full flex items-center justify-center gap-2 p-2 text-sm text-text-tertiary hover:text-forge-400 transition-colors rounded-xl border border-dashed border-surface-border hover:border-forge-500/30"
              >
                <Plus className="w-4 h-4" />
                Add Set
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 pb-8">
          <Button
            variant="secondary"
            onClick={() =>
              setCurrentExercise(Math.max(0, currentExerciseIndex - 1))
            }
            disabled={currentExerciseIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentExerciseIndex < exercises.length - 1 ? (
            <Button
              onClick={() =>
                setCurrentExercise(currentExerciseIndex + 1)
              }
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleFinishWorkout} className="flex-1">
              Complete Workout
              <Trophy className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/stores/app-store';
import { useWorkoutStore } from '@/stores/workout-store';
import { useSaveSession, useAddXP } from '@/lib/hooks';
import { XP_REWARDS } from '@/lib/constants';

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeProgram } = useAppStore();
  const saveSession = useSaveSession();
  const addXP = useAddXP();
  const {
    exercises,
    currentExerciseIndex,
    isResting,
    restTimeRemaining,
    isActive,
    xpEarned,
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

  const dayIndex = parseInt(id ?? '0', 10);
  const dayPlan = activeProgram?.weekly_plan?.weeklyPlan?.[dayIndex];

  // Initialize workout
  useEffect(() => {
    if (dayPlan && !isActive) {
      const activeExercises = dayPlan.exercises.map((e) => ({
        name: e.name,
        muscles: e.muscles as any[],
        targetSets: e.sets,
        targetRepRange: e.repRange,
        restSeconds: e.restSeconds,
        sets: Array.from({ length: e.sets }, () => ({
          weight_kg: null,
          reps: null,
          rpe: null,
          is_completed: false,
        })),
        notes: e.notes,
      }));
      startWorkout(`session-${Date.now()}`, dayPlan.focus, activeExercises);
    }
  }, [dayPlan]);

  // Rest timer
  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(tickRest, 1000);
    return () => clearInterval(interval);
  }, [isResting]);

  // Rest timer done — haptic
  useEffect(() => {
    if (restTimeRemaining === 0 && !isResting) return;
    if (restTimeRemaining <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [restTimeRemaining]);

  const currentExercise = exercises[currentExerciseIndex];

  function handleCompleteSet(setIndex: number) {
    const set = currentExercise.sets[setIndex];
    if (set.weight_kg === null && set.reps === null) {
      Alert.alert('Enter data', 'Please enter weight and reps before completing the set.');
      return;
    }
    completeSet(currentExerciseIndex, setIndex, set);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startRest(currentExercise.restSeconds);
  }

  function handleFinish() {
    const totalXP = xpEarned + XP_REWARDS.WORKOUT_COMPLETE;
    Alert.alert(
      'Finish Workout?',
      `You earned ${totalXP} XP this session!`,
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            // Build exercise logs from all exercises
            const exerciseLogs = exercises.flatMap((ex) =>
              ex.sets
                .filter((s) => s.is_completed)
                .map((s, i) => ({
                  exerciseName: ex.name,
                  musclesWorked: ex.muscles,
                  setNumber: i + 1,
                  weightKg: s.weight_kg,
                  reps: s.reps,
                  rpe: s.rpe,
                  isCompleted: true,
                }))
            );

            // Save to Supabase
            saveSession.mutate({
              programId: activeProgram?.id,
              name: dayPlan?.focus ?? 'Workout',
              focus: dayPlan?.focus,
              status: 'completed',
              durationMinutes: 0, // TODO: track actual duration
              xpEarned: totalXP,
              exerciseLogs,
            });

            // Record XP
            addXP.mutate({
              amount: totalXP,
              source: 'workout',
              description: `Completed ${dayPlan?.focus ?? 'workout'}`,
            });

            finishWorkout();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }

  if (!dayPlan || !currentExercise) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <Text className="text-text-secondary">Workout not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-accent-purple font-bold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-bg-tertiary">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#94A3B8" />
        </Pressable>
        <View className="items-center">
          <Text className="text-text-primary font-bold text-sm">{dayPlan.focus}</Text>
          <Text className="text-accent-gold text-xs font-bold">+{xpEarned} XP</Text>
        </View>
        <Pressable onPress={handleFinish}>
          <Text className="text-accent-emerald font-bold text-sm">Finish</Text>
        </Pressable>
      </View>

      {/* Rest Timer Overlay */}
      {isResting && (
        <View className="bg-bg-secondary px-5 py-4 items-center">
          <Text className="text-text-muted text-xs uppercase tracking-widest">Rest</Text>
          <Text className="text-accent-blue text-4xl font-bold mt-1">
            {Math.floor(restTimeRemaining / 60)}:{String(restTimeRemaining % 60).padStart(2, '0')}
          </Text>
          <Pressable onPress={stopRest} className="mt-2">
            <Text className="text-accent-purple text-sm font-semibold">Skip Rest</Text>
          </Pressable>
        </View>
      )}

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Exercise Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="my-4"
        >
          {exercises.map((ex, i) => {
            const completedSets = ex.sets.filter((s) => s.is_completed).length;
            const allDone = completedSets === ex.targetSets;
            return (
              <Pressable
                key={i}
                onPress={() => setCurrentExercise(i)}
                className={`mr-2 px-4 py-2 rounded-full ${
                  i === currentExerciseIndex
                    ? 'bg-accent-purple'
                    : allDone
                    ? 'bg-accent-emerald/20'
                    : 'bg-bg-card'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    i === currentExerciseIndex ? 'text-white' : 'text-text-secondary'
                  }`}
                  numberOfLines={1}
                >
                  {ex.name.length > 15 ? ex.name.slice(0, 15) + '…' : ex.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Current Exercise */}
        <View className="mb-6">
          <Text className="text-text-primary text-xl font-bold">{currentExercise.name}</Text>
          <Text className="text-accent-blue text-sm mt-1">
            {currentExercise.targetSets} sets × {currentExercise.targetRepRange} reps
          </Text>
          <Text className="text-text-muted text-xs mt-1">
            {currentExercise.muscles.join(', ')}
          </Text>
          {currentExercise.notes ? (
            <Text className="text-text-secondary text-xs mt-2 italic">
              💡 {currentExercise.notes}
            </Text>
          ) : null}
        </View>

        {/* Sets */}
        {currentExercise.sets.map((set, setIndex) => (
          <View
            key={setIndex}
            className={`flex-row items-center gap-3 mb-3 p-3 rounded-xl ${
              set.is_completed ? 'bg-accent-emerald/10' : 'bg-bg-card'
            }`}
          >
            <Text className="text-text-muted font-bold w-8 text-center">{setIndex + 1}</Text>

            <TextInput
              placeholder="kg"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={set.weight_kg?.toString() ?? ''}
              onChangeText={(v) => updateSet(currentExerciseIndex, setIndex, { weight_kg: v ? parseFloat(v) : null })}
              editable={!set.is_completed}
              className="flex-1 bg-bg-tertiary text-text-primary rounded-lg px-3 py-2 text-center text-sm"
            />

            <TextInput
              placeholder="reps"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              value={set.reps?.toString() ?? ''}
              onChangeText={(v) => updateSet(currentExerciseIndex, setIndex, { reps: v ? parseInt(v, 10) : null })}
              editable={!set.is_completed}
              className="flex-1 bg-bg-tertiary text-text-primary rounded-lg px-3 py-2 text-center text-sm"
            />

            <TextInput
              placeholder="RPE"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={set.rpe?.toString() ?? ''}
              onChangeText={(v) => updateSet(currentExerciseIndex, setIndex, { rpe: v ? parseFloat(v) : null })}
              editable={!set.is_completed}
              className="w-14 bg-bg-tertiary text-text-primary rounded-lg px-3 py-2 text-center text-sm"
            />

            {set.is_completed ? (
              <View className="w-10 h-10 rounded-full bg-accent-emerald/20 items-center justify-center">
                <Ionicons name="checkmark" size={20} color="#10B981" />
              </View>
            ) : (
              <Pressable
                onPress={() => handleCompleteSet(setIndex)}
                className="w-10 h-10 rounded-full bg-accent-purple items-center justify-center active:opacity-80"
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </Pressable>
            )}
          </View>
        ))}

        {/* Add Set */}
        <Pressable
          onPress={() => addSet(currentExerciseIndex)}
          className="flex-row items-center justify-center py-3 mb-8"
        >
          <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
          <Text className="text-accent-purple text-sm font-semibold ml-2">Add Set</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

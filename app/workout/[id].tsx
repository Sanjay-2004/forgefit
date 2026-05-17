import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import { useAppStore } from '@/stores/app-store';
import { useWorkoutStore } from '@/stores/workout-store';
import { useSaveSession, useAddXP } from '@/lib/hooks';
import { supabase } from '@/lib/supabase/client';
import { XP_REWARDS } from '@/lib/constants';

const RPE_INFO =
  'RPE = Rate of Perceived Exertion (1-10).\n\n' +
  '6 = easy, could do 4+ more reps\n' +
  '7 = moderate, 3 more reps in tank\n' +
  '8 = hard, 2 more reps possible\n' +
  '9 = very hard, 1 rep left\n' +
  '10 = maximum effort, no more reps';

const MAX_WEIGHT_KG = 500;
const MAX_REPS = 100;
const MAX_RPE = 10;
// In dev, allow unlimited workouts per day for testing
const DEV_UNLIMITED_WORKOUTS = __DEV__;

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeProgram, profile } = useAppStore();
  const saveSession = useSaveSession();
  const addXP = useAddXP();

  const dayIndex = parseInt(id ?? '0', 10);
  const dayPlan = activeProgram?.weekly_plan?.weeklyPlan?.[dayIndex];

  const {
    sessionId,
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
  } = useWorkoutStore();

  const [showVideo, setShowVideo] = useState(false);
  const [dailyCapChecked, setDailyCapChecked] = useState(false);

  // Unique session key — includes updated_at so edits reload exercises
  const sessionKey = useMemo(
    () => `day-${dayIndex}-${activeProgram?.id}-${activeProgram?.updated_at ?? ''}`,
    [dayIndex, activeProgram?.id, activeProgram?.updated_at],
  );

  // Check daily workout cap
  useEffect(() => {
    if (dailyCapChecked || !profile?.id || DEV_UNLIMITED_WORKOUTS) {
      setDailyCapChecked(true);
      return;
    }
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`);

      if ((count ?? 0) > 0) {
        Alert.alert(
          'Already trained today! 💪',
          'You\'ve completed a workout today. Rest up and come back tomorrow for maximum gains!',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      } else {
        setDailyCapChecked(true);
      }
    })();
  }, [profile?.id]);

  // Initialize/re-initialize when day or plan changes
  useEffect(() => {
    if (!dayPlan || !dailyCapChecked) return;
    if (sessionId === sessionKey) return;
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
    startWorkout(sessionKey, dayPlan.focus, activeExercises);
  }, [sessionKey, dayPlan, dailyCapChecked]);

  // Rest timer
  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(tickRest, 1000);
    return () => clearInterval(interval);
  }, [isResting]);

  const currentExercise = exercises[currentExerciseIndex];
  const isCompleted = !isActive && exercises.length > 0;

  // Sequential set enforcement: find the first incomplete set
  const nextSetIndex = currentExercise
    ? currentExercise.sets.findIndex((s) => !s.is_completed)
    : 0;

  function showRPEInfo() {
    Alert.alert('What is RPE?', RPE_INFO);
  }

  function handleCompleteSet(setIndex: number) {
    if (isCompleted || isResting) return;

    // Enforce sequential order
    if (setIndex !== nextSetIndex) {
      Alert.alert('Complete in order', `Please complete set ${nextSetIndex + 1} first.`);
      return;
    }

    const set = currentExercise.sets[setIndex];

    // Both weight AND reps are required
    if (set.weight_kg === null || set.reps === null) {
      Alert.alert('Missing data', 'Please enter both weight and reps before completing the set.');
      return;
    }

    // Validate ranges
    if (set.weight_kg < 0 || set.weight_kg > MAX_WEIGHT_KG) {
      Alert.alert('Invalid weight', `Weight must be between 0 and ${MAX_WEIGHT_KG}kg.`);
      return;
    }
    if (set.reps < 1 || set.reps > MAX_REPS) {
      Alert.alert('Invalid reps', `Reps must be between 1 and ${MAX_REPS}.`);
      return;
    }
    if (set.rpe !== null && (set.rpe < 1 || set.rpe > MAX_RPE)) {
      Alert.alert('Invalid RPE', `RPE must be between 1 and ${MAX_RPE}.`);
      return;
    }

    completeSet(currentExerciseIndex, setIndex, set);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startRest(currentExercise.restSeconds);
  }

  function handleFinish() {
    if (isCompleted) {
      router.back();
      return;
    }
    const totalXP = xpEarned + XP_REWARDS.WORKOUT_COMPLETE;
    Alert.alert(
      'Finish Workout?',
      `You earned ${totalXP} XP this session! Once finished, this session is locked.`,
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
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
                })),
            );

            saveSession.mutate({
              programId: activeProgram?.id,
              name: dayPlan?.focus ?? 'Workout',
              focus: dayPlan?.focus,
              status: 'completed',
              durationMinutes: 0,
              xpEarned: totalXP,
              exerciseLogs,
            });

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
      ],
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

  const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    currentExercise.name + ' proper form tutorial',
  )}`;

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
            <Text
              className={`font-bold text-sm ${
                isCompleted ? 'text-text-muted' : 'text-accent-emerald'
              }`}
            >
              {isCompleted ? 'Done' : 'Finish'}
            </Text>
          </Pressable>
        </View>

        {/* Completion Banner */}
        {isCompleted && (
          <View className="bg-accent-emerald/15 px-5 py-3 border-b border-accent-emerald/30">
            <Text className="text-accent-emerald text-sm font-semibold text-center">
              ✓ Workout completed — session locked
            </Text>
          </View>
        )}

        {/* Rest Timer */}
        {isResting && (
          <View className="bg-bg-secondary px-5 py-4 items-center">
            <Text className="text-text-muted text-xs uppercase tracking-widest">Rest — inputs locked</Text>
            <Text className="text-accent-blue text-4xl font-bold mt-1">
              {Math.floor(restTimeRemaining / 60)}:
              {String(restTimeRemaining % 60).padStart(2, '0')}
            </Text>
            <Pressable onPress={stopRest} className="mt-2">
              <Text className="text-accent-purple text-sm font-semibold">Skip Rest</Text>
            </Pressable>
          </View>
        )}

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 200 }}
        >
          {/* Exercise Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-4">
            {exercises.map((ex, i) => {
              const completedSets = ex.sets.filter((s) => s.is_completed).length;
              const allDone = completedSets === ex.targetSets;
              return (
                <Pressable
                  key={i}
                  onPress={() => { setCurrentExercise(i); setShowVideo(false); }}
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
          <View className="mb-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-text-primary text-xl font-bold">{currentExercise.name}</Text>
                <Text className="text-accent-blue text-sm mt-1">
                  {currentExercise.targetSets} sets × {currentExercise.targetRepRange} reps
                </Text>
                <Text className="text-text-muted text-xs mt-1">
                  {currentExercise.muscles.join(', ')}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowVideo(!showVideo)}
                className={`rounded-xl p-3 active:opacity-80 ${showVideo ? 'bg-accent-red/30' : 'bg-accent-red/15'}`}
              >
                <Ionicons name={showVideo ? 'close-circle' : 'logo-youtube'} size={22} color="#EF4444" />
              </Pressable>
            </View>
            {currentExercise.notes ? (
              <Text className="text-text-secondary text-xs mt-2 italic">
                💡 {currentExercise.notes}
              </Text>
            ) : null}
          </View>

          {/* Embedded YouTube Video */}
          {showVideo && (
            <View className="mb-4 rounded-xl overflow-hidden bg-bg-card" style={{ height: 220 }}>
              <WebView
                source={{ uri: videoUrl }}
                style={{ flex: 1 }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
              />
            </View>
          )}

          {/* Column Headers with RPE help */}
          <View className="flex-row items-center gap-3 mb-2 px-1">
            <Text className="text-text-muted text-xs w-8 text-center">Set</Text>
            <Text className="text-text-muted text-xs flex-1 text-center">Weight (kg)</Text>
            <Text className="text-text-muted text-xs flex-1 text-center">Reps</Text>
            <Pressable
              onPress={showRPEInfo}
              className="w-14 flex-row items-center justify-center active:opacity-60"
            >
              <Text className="text-text-muted text-xs">RPE</Text>
              <Ionicons
                name="information-circle-outline"
                size={12}
                color="#64748B"
                style={{ marginLeft: 2 }}
              />
            </Pressable>
            <View className="w-10" />
          </View>

          {/* Sets */}
          {currentExercise.sets.map((set, setIndex) => {
            const isDone = set.is_completed;
            // Only the next incomplete set is editable (sequential enforcement)
            const isNextSet = setIndex === nextSetIndex;
            // Lock: completed, workout done, resting, or not your turn
            const inputLocked = isDone || isCompleted || isResting || !isNextSet;
            const btnDisabled = isDone || isCompleted || isResting || !isNextSet;

            return (
              <View
                key={setIndex}
                className={`flex-row items-center gap-3 mb-3 p-3 rounded-xl ${
                  isDone
                    ? 'bg-accent-emerald/10'
                    : isNextSet && !isResting
                    ? 'bg-bg-card'
                    : 'bg-bg-card/50'
                }`}
              >
                <Text
                  className={`font-bold w-8 text-center ${
                    isNextSet && !isDone ? 'text-accent-purple' : 'text-text-muted'
                  }`}
                >
                  {setIndex + 1}
                </Text>

                <TextInput
                  placeholder="kg"
                  placeholderTextColor={inputLocked ? '#334155' : '#64748B'}
                  keyboardType="decimal-pad"
                  value={set.weight_kg?.toString() ?? ''}
                  onChangeText={(v) => {
                    const num = v ? parseFloat(v) : null;
                    if (num !== null && num > MAX_WEIGHT_KG) return;
                    updateSet(currentExerciseIndex, setIndex, { weight_kg: num });
                  }}
                  editable={!inputLocked}
                  className={`flex-1 rounded-lg px-3 py-2 text-center text-sm ${
                    inputLocked
                      ? 'bg-bg-tertiary/50 text-text-muted'
                      : 'bg-bg-tertiary text-text-primary'
                  }`}
                />

                <TextInput
                  placeholder="reps"
                  placeholderTextColor={inputLocked ? '#334155' : '#64748B'}
                  keyboardType="number-pad"
                  value={set.reps?.toString() ?? ''}
                  onChangeText={(v) => {
                    const num = v ? parseInt(v, 10) : null;
                    if (num !== null && num > MAX_REPS) return;
                    updateSet(currentExerciseIndex, setIndex, { reps: num });
                  }}
                  editable={!inputLocked}
                  className={`flex-1 rounded-lg px-3 py-2 text-center text-sm ${
                    inputLocked
                      ? 'bg-bg-tertiary/50 text-text-muted'
                      : 'bg-bg-tertiary text-text-primary'
                  }`}
                />

                <TextInput
                  placeholder="RPE"
                  placeholderTextColor={inputLocked ? '#334155' : '#64748B'}
                  keyboardType="decimal-pad"
                  value={set.rpe?.toString() ?? ''}
                  onChangeText={(v) => {
                    const num = v ? parseFloat(v) : null;
                    if (num !== null && num > MAX_RPE) return;
                    updateSet(currentExerciseIndex, setIndex, { rpe: num });
                  }}
                  editable={!inputLocked}
                  className={`w-14 rounded-lg px-3 py-2 text-center text-sm ${
                    inputLocked
                      ? 'bg-bg-tertiary/50 text-text-muted'
                      : 'bg-bg-tertiary text-text-primary'
                  }`}
                />

                {isDone ? (
                  <View className="w-10 h-10 rounded-full bg-accent-emerald/20 items-center justify-center">
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handleCompleteSet(setIndex)}
                    disabled={btnDisabled}
                    className={`w-10 h-10 rounded-full items-center justify-center active:opacity-80 ${
                      btnDisabled ? 'bg-bg-tertiary' : 'bg-accent-purple'
                    }`}
                  >
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={btnDisabled ? '#64748B' : '#fff'}
                    />
                  </Pressable>
                )}
              </View>
            );
          })}

          {/* Add Set */}
          {!isCompleted && (
            <Pressable
              onPress={() => addSet(currentExerciseIndex)}
              className="flex-row items-center justify-center py-3 mb-4"
            >
              <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
              <Text className="text-accent-purple text-sm font-semibold ml-2">Add Set</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

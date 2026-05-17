import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app-store';
import { supabase } from '@/lib/supabase/client';
import type { TemplateExercise, DayPlan } from '@/types';

// Common exercises to suggest when adding
const EXERCISE_SUGGESTIONS: Record<string, string[]> = {
  chest: ['Bench Press', 'Incline Dumbbell Press', 'Cable Flyes', 'Push-ups', 'Dips', 'Dumbbell Flyes', 'Machine Chest Press'],
  back: ['Pull-ups', 'Barbell Row', 'Lat Pulldown', 'Seated Cable Row', 'T-Bar Row', 'Face Pulls', 'Dumbbell Row'],
  shoulders: ['Overhead Press', 'Lateral Raise', 'Rear Delt Fly', 'Arnold Press', 'Front Raise', 'Cable Lateral Raise'],
  legs: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Lunges', 'Leg Curl', 'Leg Extension', 'Calf Raise', 'Bulgarian Split Squat'],
  arms: ['Barbell Curl', 'Tricep Pushdown', 'Hammer Curl', 'Skull Crushers', 'Preacher Curl', 'Overhead Tricep Extension'],
  core: ['Plank', 'Cable Crunch', 'Hanging Leg Raise', 'Russian Twist', 'Ab Wheel Rollout', 'Dead Bug'],
};

function ExerciseRow({
  exercise,
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  exercise: TemplateExercise;
  index: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <View className="bg-bg-card rounded-xl p-4 mb-2 flex-row items-center">
      {/* Reorder buttons */}
      <View className="mr-3">
        <Pressable
          onPress={onMoveUp}
          disabled={isFirst}
          className="mb-1 active:opacity-60"
        >
          <Ionicons name="chevron-up" size={18} color={isFirst ? '#334155' : '#94A3B8'} />
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={isLast}
          className="active:opacity-60"
        >
          <Ionicons name="chevron-down" size={18} color={isLast ? '#334155' : '#94A3B8'} />
        </Pressable>
      </View>

      {/* Exercise info */}
      <View className="flex-1">
        <Text className="text-text-primary font-semibold text-sm">{exercise.name}</Text>
        <Text className="text-text-muted text-xs mt-0.5">
          {exercise.sets}×{exercise.repRange} · {exercise.muscles.join(', ')}
        </Text>
      </View>

      {/* Remove */}
      <Pressable
        onPress={onRemove}
        className="ml-2 w-8 h-8 rounded-full bg-accent-red/15 items-center justify-center active:opacity-60"
      >
        <Ionicons name="close" size={16} color="#EF4444" />
      </Pressable>
    </View>
  );
}

export default function EditDayScreen() {
  const { dayIndex: rawIndex } = useLocalSearchParams<{ dayIndex: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProgram, setActiveProgram } = useAppStore();
  const dayIndex = parseInt(rawIndex ?? '0', 10);

  const weeklyPlan = activeProgram?.weekly_plan;
  const originalDay = weeklyPlan?.weeklyPlan?.[dayIndex];

  const [exercises, setExercises] = useState<TemplateExercise[]>(
    originalDay?.exercises ? [...originalDay.exercises] : [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addSets, setAddSets] = useState('3');
  const [addReps, setAddReps] = useState('8-12');
  const [addRest, setAddRest] = useState('90');

  if (!originalDay || !weeklyPlan) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <Text className="text-text-secondary">Day not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-accent-purple font-bold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  function moveExercise(from: number, to: number) {
    const next = [...exercises];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setExercises(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function removeExercise(index: number) {
    if (exercises.length <= 1) {
      Alert.alert('Cannot remove', 'A workout needs at least one exercise.');
      return;
    }
    Alert.alert('Remove Exercise', `Remove ${exercises[index].name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setExercises((prev) => prev.filter((_, i) => i !== index));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }

  function handleAddExercise() {
    if (!addName.trim()) {
      Alert.alert('Enter exercise name');
      return;
    }
    const newExercise: TemplateExercise = {
      name: addName.trim(),
      muscles: [],
      sets: parseInt(addSets, 10) || 3,
      repRange: addReps || '8-12',
      restSeconds: parseInt(addRest, 10) || 90,
      notes: '',
    };
    setExercises((prev) => [...prev, newExercise]);
    setShowAddModal(false);
    setAddName('');
    setAddSets('3');
    setAddReps('8-12');
    setAddRest('90');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSave() {
    if (!activeProgram) return;
    setIsSaving(true);

    try {
      // Build updated weekly plan
      const updatedDays = weeklyPlan.weeklyPlan.map((d: DayPlan, i: number) =>
        i === dayIndex ? { ...d, exercises } : d,
      );
      const updatedPlan = { ...weeklyPlan, weeklyPlan: updatedDays };

      // Save to Supabase
      const { error } = await supabase
        .from('workout_programs')
        .update({ weekly_plan: updatedPlan, updated_at: new Date().toISOString() })
        .eq('id', activeProgram.id);

      if (error) throw error;

      // Update local store with new updated_at so workout screen detects the change
      const now = new Date().toISOString();
      setActiveProgram({ ...activeProgram, weekly_plan: updatedPlan, updated_at: now });
      // Invalidate query so TanStack also picks up the change
      queryClient.invalidateQueries({ queryKey: ['activeProgram'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message ?? 'Could not save changes.');
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges =
    JSON.stringify(exercises) !== JSON.stringify(originalDay.exercises);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-bg-tertiary">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text-secondary font-semibold">Cancel</Text>
        </Pressable>
        <Text className="text-text-primary font-bold">{originalDay.day}</Text>
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          className="active:opacity-60"
        >
          <Text
            className={`font-bold ${
              hasChanges ? 'text-accent-purple' : 'text-text-muted'
            }`}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Focus label */}
        <View className="mt-4 mb-2">
          <Text className="text-accent-blue text-sm font-semibold">{originalDay.focus}</Text>
          <Text className="text-text-muted text-xs mt-1">
            Drag to reorder · Tap ✕ to remove
          </Text>
        </View>

        {/* Exercise list */}
        {exercises.map((ex, i) => (
          <ExerciseRow
            key={`${ex.name}-${i}`}
            exercise={ex}
            index={i}
            onRemove={() => removeExercise(i)}
            onMoveUp={() => moveExercise(i, i - 1)}
            onMoveDown={() => moveExercise(i, i + 1)}
            isFirst={i === 0}
            isLast={i === exercises.length - 1}
          />
        ))}

        {/* Add exercise */}
        <Pressable
          onPress={() => setShowAddModal(true)}
          className="flex-row items-center justify-center py-4 mt-2 mb-8 bg-bg-card rounded-xl active:opacity-80"
        >
          <Ionicons name="add-circle-outline" size={22} color="#4F46E5" />
          <Text className="text-accent-purple font-semibold ml-2">Add Exercise</Text>
        </Pressable>

        {/* Quick suggestions */}
        <View className="mb-8">
          <Text className="text-text-muted text-xs uppercase tracking-widest mb-3">
            Quick Add
          </Text>
          {Object.entries(EXERCISE_SUGGESTIONS).map(([category, names]) => (
            <View key={category} className="mb-3">
              <Text className="text-text-secondary text-xs font-semibold mb-1 capitalize">
                {category}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {names
                  .filter((n) => !exercises.some((e) => e.name === n))
                  .map((name) => (
                    <Pressable
                      key={name}
                      onPress={() => {
                        setExercises((prev) => [
                          ...prev,
                          { name, muscles: [], sets: 3, repRange: '8-12', restSeconds: 90, notes: '' },
                        ]);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className="bg-bg-tertiary rounded-full px-3 py-1.5 mr-2 active:opacity-70"
                    >
                      <Text className="text-text-secondary text-xs">{name}</Text>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Exercise Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={() => setShowAddModal(false)} />
          <View className="bg-bg-secondary rounded-t-3xl px-5 pt-6 pb-10">
            <Text className="text-text-primary text-lg font-bold mb-4">Add Exercise</Text>

            <Text className="text-text-muted text-xs uppercase mb-1">Exercise Name</Text>
            <TextInput
              value={addName}
              onChangeText={setAddName}
              placeholder="e.g. Barbell Bench Press"
              placeholderTextColor="#64748B"
              className="bg-bg-tertiary text-text-primary rounded-xl px-4 py-3 text-sm mb-3"
            />

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-text-muted text-xs uppercase mb-1">Sets</Text>
                <TextInput
                  value={addSets}
                  onChangeText={setAddSets}
                  keyboardType="number-pad"
                  className="bg-bg-tertiary text-text-primary rounded-xl px-4 py-3 text-sm text-center"
                />
              </View>
              <View className="flex-1">
                <Text className="text-text-muted text-xs uppercase mb-1">Rep Range</Text>
                <TextInput
                  value={addReps}
                  onChangeText={setAddReps}
                  className="bg-bg-tertiary text-text-primary rounded-xl px-4 py-3 text-sm text-center"
                />
              </View>
              <View className="flex-1">
                <Text className="text-text-muted text-xs uppercase mb-1">Rest (s)</Text>
                <TextInput
                  value={addRest}
                  onChangeText={setAddRest}
                  keyboardType="number-pad"
                  className="bg-bg-tertiary text-text-primary rounded-xl px-4 py-3 text-sm text-center"
                />
              </View>
            </View>

            <Pressable
              onPress={handleAddExercise}
              className="bg-accent-purple rounded-2xl py-4 items-center active:opacity-80"
            >
              <Text className="text-white font-bold text-base">Add to Workout</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

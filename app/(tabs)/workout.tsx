import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/app-store';
import { useActiveProgram } from '@/lib/hooks';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import type { DayPlan } from '@/types';

function WorkoutDayCard({
  day,
  index,
  onPress,
  onEdit,
}: {
  day: DayPlan;
  index: number;
  onPress: () => void;
  onEdit: () => void;
}) {
  const isToday = (() => {
    const todayIndex = new Date().getDay();
    const adjusted = todayIndex === 0 ? 6 : todayIndex - 1;
    return adjusted === index;
  })();

  return (
    <Pressable
      onPress={onPress}
      className={`bg-bg-card rounded-2xl p-5 mb-3 border ${
        isToday ? 'border-accent-purple/50' : 'border-transparent'
      } active:opacity-80`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          {isToday && (
            <View className="bg-accent-purple rounded-full w-2 h-2 mr-2" />
          )}
          <Text className="text-text-primary font-bold text-base">{day.day}</Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onEdit();
          }}
          className="mr-2 p-1.5 rounded-lg bg-bg-tertiary active:opacity-60"
          hitSlop={8}
        >
          <Ionicons name="pencil-outline" size={14} color="#6366F1" />
        </Pressable>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </View>
      <Text className="text-accent-blue text-sm font-semibold mb-2">{day.focus}</Text>
      <Text className="text-text-muted text-xs">
        {day.exercises.length} exercises · ~{day.exercises.reduce((sum, e) => sum + e.sets, 0)} sets
      </Text>
    </Pressable>
  );
}

export default function WorkoutScreen() {
  const router = useRouter();
  const { activeProgram, profile, setActiveProgram } = useAppStore();
  const { data: serverProgram, isLoading: isProgramLoading } = useActiveProgram();
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync server data to store if store is empty
  useEffect(() => {
    if (serverProgram && !activeProgram) {
      setActiveProgram(serverProgram);
    }
  }, [serverProgram]);

  const program = activeProgram ?? serverProgram;
  const weeklyPlan = program?.weekly_plan;
  const onboardingDone = !!profile?.onboarding_completed;

  async function handleGenerateProgram() {
    if (!profile?.id) return;
    setIsGenerating(true);
    try {
      // Fetch user preferences to pass to AI
      const { data: prefs, error: prefsError } = await supabase
        .from('user_preferences').select('*').eq('user_id', profile.id).single();

      if (prefsError || !prefs) {
        throw new Error('No preferences found. Please complete onboarding first.');
      }

      // Normalize DB shape → edge function expected shape
      const userData = {
        age: prefs.age,
        sex: prefs.sex,
        height_cm: prefs.height_cm,
        weight_kg: prefs.weight_kg,
        fitness_goals: prefs.fitness_goal ? [prefs.fitness_goal] : [],
        experience_level: prefs.experience_level,
        injuries: prefs.injuries,
        equipment_access: prefs.equipment_access ? [prefs.equipment_access] : [],
        preferred_styles: prefs.preferred_styles ?? [],
        preferred_split: prefs.preferred_split ?? 'auto',
        workout_days_per_week: prefs.workout_days_per_week,
        session_duration_minutes: prefs.session_duration_minutes,
        activity_level: prefs.activity_level,
        sleep_quality: prefs.sleep_quality,
        stress_level: prefs.stress_level,
        training_location: prefs.training_location,
      };

      const { data: programData, error: fnError } = await supabase.functions.invoke(
        'generate-program',
        { body: { userData, userId: profile.id } },
      );

      if (fnError) {
        console.error('Edge function error:', fnError);
        throw new Error(fnError.message || 'Program generation failed');
      }

      if (programData?.error) {
        console.error('Program generation error:', programData.error);
        throw new Error(programData.error);
      }

      if (!programData?.programId) {
        throw new Error('No program ID returned from server');
      }

      const { data: newProgram, error: fetchError } = await supabase
        .from('workout_programs').select('*').eq('id', programData.programId).single();

      if (fetchError || !newProgram) {
        throw new Error('Program was generated but could not be loaded');
      }

      setActiveProgram(newProgram);
    } catch (err: any) {
      console.error('Program generation error:', err);
      Alert.alert(
        'Generation Failed',
        err?.message ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mt-4 mb-6">
          <Text className="text-text-muted text-sm uppercase tracking-widest">
            ⚔️ Training
          </Text>
          <Text className="text-text-primary text-2xl font-bold mt-1">
            {weeklyPlan?.programName ?? 'No Active Program'}
          </Text>
          {weeklyPlan && (
            <Text className="text-text-secondary text-sm mt-1">{weeklyPlan.goal}</Text>
          )}
        </View>

        {weeklyPlan ? (
          <>
            {/* Edit Program Banner */}
            <Pressable
              onPress={() =>
                Alert.alert('Edit Plan', 'What would you like to change?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Edit Preferences',
                    onPress: () => router.push('/onboarding'),
                  },
                  {
                    text: 'Regenerate Program',
                    style: 'destructive',
                    onPress: handleGenerateProgram,
                  },
                ])
              }
              className="bg-bg-tertiary rounded-xl p-4 mb-4 flex-row items-center active:opacity-80"
            >
              <Ionicons name="create-outline" size={20} color="#6366F1" />
              <Text className="text-accent-purple-light text-sm font-semibold ml-2 flex-1">
                {isGenerating ? 'Regenerating…' : "Edit this week's plan"}
              </Text>
              {isGenerating ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#6366F1" />
              )}
            </Pressable>

            {/* Day Cards */}
            {weeklyPlan.weeklyPlan.map((day, index) => (
              <WorkoutDayCard
                key={`${day.day}-${index}`}
                day={day}
                index={index}
                onPress={() => router.push(`/workout/${index}`)}
                onEdit={() => router.push(`/workout/edit/${index}`)}
              />
            ))}
          </>
        ) : (
          <View className="items-center py-20">
            {isProgramLoading ? (
              <ActivityIndicator size="large" color="#4F46E5" />
            ) : onboardingDone ? (
              <>
                <Ionicons name="barbell-outline" size={64} color="#6366F1" />
                <Text className="text-text-secondary text-base mt-4 text-center">
                  No program generated yet.{'\n'}Tap below to create your AI training plan.
                </Text>
                <Pressable
                  onPress={handleGenerateProgram}
                  disabled={isGenerating}
                  className="bg-accent-purple rounded-2xl py-4 px-8 mt-6 active:opacity-80"
                >
                  {isGenerating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">Generate Program ⚔️</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Ionicons name="barbell-outline" size={64} color="#64748B" />
                <Text className="text-text-secondary text-base mt-4 text-center">
                  No program yet.{'\n'}Complete onboarding to generate your plan.
                </Text>
                <Pressable
                  onPress={() => router.push('/onboarding')}
                  className="bg-accent-purple rounded-2xl py-4 px-8 mt-6 active:opacity-80"
                >
                  <Text className="text-white font-bold text-base">Start Onboarding</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

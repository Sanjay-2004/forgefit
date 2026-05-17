import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAppStore } from '@/stores/app-store';
import { supabase } from '@/lib/supabase/client';
import { ONBOARDING_STEPS } from '@/types';
import { useState } from 'react';

// Step Components
import { BasicsStep } from '@/components/onboarding/basics-step';
import { BodyStep } from '@/components/onboarding/body-step';
import { GoalsStep } from '@/components/onboarding/goals-step';
import { ExperienceStep } from '@/components/onboarding/experience-step';
import { EquipmentStep } from '@/components/onboarding/equipment-step';
import { LocationStep } from '@/components/onboarding/location-step';
import { StyleStep } from '@/components/onboarding/style-step';
import { ScheduleStep } from '@/components/onboarding/schedule-step';
import { LifestyleStep } from '@/components/onboarding/lifestyle-step';
import { CurrentStatsStep } from '@/components/onboarding/current-stats-step';
import { GoalStatsStep } from '@/components/onboarding/goal-stats-step';
import { DopamineStep } from '@/components/onboarding/dopamine-step';
import { ReviewStep } from '@/components/onboarding/review-step';

const STEP_COMPONENTS = [
  BasicsStep,
  BodyStep,
  GoalsStep,
  ExperienceStep,
  EquipmentStep,
  LocationStep,
  StyleStep,
  ScheduleStep,
  LifestyleStep,
  CurrentStatsStep,
  GoalStatsStep,
  DopamineStep,
  ReviewStep,
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { currentStep, nextStep, prevStep, data } = useOnboardingStore();
  const { profile, setProfile } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeProgram } = useAppStore();
  const isEditMode = !!profile?.onboarding_completed;
  const needsProgram = !activeProgram;

  const StepComponent = STEP_COMPONENTS[currentStep];
  const stepName = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  async function handleComplete() {
    if (!profile?.id) return;
    setIsSubmitting(true);
    const { setPreferences, setActiveProgram, setGamification } = useAppStore.getState();

    try {
      // Save preferences
      const { data: prefsData } = await supabase.from('user_preferences').upsert({
        user_id: profile.id,
        age: data.age,
        sex: data.sex,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
        fitness_goal: data.fitness_goals?.[0],
        experience_level: data.experience_level,
        injuries: data.injuries,
        equipment_access: data.equipment_access?.[0],
        preferred_styles: data.preferred_styles,
        preferred_split: data.preferred_split ?? 'auto',
        workout_days_per_week: data.workout_days_per_week,
        session_duration_minutes: data.session_duration_minutes,
        activity_level: data.activity_level,
        sleep_quality: data.sleep_quality,
        stress_level: data.stress_level,
        nutrition_preferences: data.nutrition_preferences,
        training_location: data.training_location,
        dopamine_type: data.dopamine_type,
      }).select().single();

      if (prefsData) setPreferences(prefsData);

      // Generate program if first time OR if no program exists yet
      if (!isEditMode || needsProgram) {
        // Generate program via edge function
        const { data: programData } = await supabase.functions.invoke('generate-program', {
          body: { userData: data, userId: profile.id },
        });

        // Fetch the created program to store it
        if (programData?.programId) {
          const { data: program } = await supabase
            .from('workout_programs')
            .select('*')
            .eq('id', programData.programId)
            .single();
          if (program) setActiveProgram(program);
        }
      }

      if (!isEditMode) {
        // Mark onboarding complete
        await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', profile.id);
        setProfile({ ...profile, onboarding_completed: true });

        // Initialize gamification
        const { data: gamData } = await supabase.from('user_gamification').upsert({
          user_id: profile.id,
          xp_total: 0,
          current_rank: 'E',
          streak_count: 0,
          streak_freeze_count: 1,
          longest_streak: 0,
        }).select().single();

        if (gamData) setGamification(gamData);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    if (isLastStep) {
      handleComplete();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      nextStep();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      {/* Progress Bar */}
      <View className="px-5 pt-4">
        <View className="flex-row items-center justify-between mb-2">
          {currentStep > 0 ? (
            <Pressable onPress={prevStep}>
              <Text className="text-accent-purple font-semibold text-sm">Back</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Text className="text-text-muted text-xs uppercase tracking-widest">
            {currentStep + 1} / {ONBOARDING_STEPS.length}
          </Text>
        </View>
        <View className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <View
            className="h-full bg-accent-purple rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Step Content */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepComponent />
      </ScrollView>

      {/* Next Button */}
      <View className="px-5 pb-6 pt-3">
        <Pressable
          onPress={handleNext}
          disabled={isSubmitting}
          className="bg-accent-purple rounded-2xl py-4 items-center active:opacity-80"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">
              {isLastStep
                ? (isEditMode && !needsProgram)
                  ? 'Save Changes'
                  : 'Generate My Program ⚔️'
                : 'Continue'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

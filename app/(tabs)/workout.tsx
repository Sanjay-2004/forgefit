import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/app-store';
import { useActiveProgram, useWeekSessionMap, useTriggerRecalibration } from '@/lib/hooks';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect, useMemo } from 'react';
import type { DayPlan } from '@/types';

// ── Helpers ──

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

/** Get the Monday of the current week */
function getCurrentMonday(): Date {
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun
  const offset = jsDay === 0 ? -6 : 1 - jsDay;
  const mon = new Date(now);
  mon.setDate(now.getDate() + offset);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

/** Format a date as "Mon 19" */
function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

/** Format a date key for comparison (YYYY-MM-DD) */
function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ── Day Card ──

type DayStatus = 'today' | 'tomorrow' | 'past-done' | 'past-missed' | 'future';

function WorkoutDayCard({
  day,
  index,
  status,
  dateLabel,
  dateStr,
  onPress,
  onEdit,
}: {
  day: DayPlan;
  index: number;
  status: DayStatus;
  dateLabel: string;
  dateStr: string;
  onPress: () => void;
  onEdit?: () => void;
}) {
  const borderClass =
    status === 'today'
      ? 'border-accent-purple'
      : status === 'past-done'
      ? 'border-accent-emerald/40'
      : status === 'past-missed'
      ? 'border-accent-red/40'
      : 'border-transparent';

  const bgClass =
    status === 'today'
      ? 'bg-bg-card'
      : status === 'past-done'
      ? 'bg-accent-emerald/5'
      : status === 'past-missed'
      ? 'bg-accent-red/5'
      : 'bg-bg-card';

  const isPast = status === 'past-done' || status === 'past-missed';
  const canEdit = !isPast;

  return (
    <Pressable
      onPress={onPress}
      className={`${bgClass} rounded-2xl p-5 mb-3 border ${borderClass} active:opacity-80`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          {/* Status icon */}
          {status === 'today' && (
            <View className="bg-accent-purple rounded-full w-2.5 h-2.5 mr-2" />
          )}
          {status === 'past-done' && (
            <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 6 }} />
          )}
          {status === 'past-missed' && (
            <Ionicons name="close-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
          )}
          {status === 'tomorrow' && (
            <Ionicons name="time-outline" size={16} color="#A78BFA" style={{ marginRight: 6 }} />
          )}

          <View>
            <Text className="text-text-primary font-bold text-base">{dateLabel}</Text>
            <Text className="text-text-muted text-xs">{dateStr}</Text>
          </View>
        </View>

        {canEdit && onEdit && (
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
        )}
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </View>

      <Text className="text-accent-blue text-sm font-semibold mb-1">{day.focus}</Text>
      <Text className="text-text-muted text-xs">
        {day.exercises.length} exercises · ~{day.exercises.reduce((sum, e) => sum + e.sets, 0)} sets
      </Text>
    </Pressable>
  );
}

// ── Main Screen ──

export default function WorkoutScreen() {
  const router = useRouter();
  const { activeProgram, profile, setActiveProgram } = useAppStore();
  const { data: serverProgram, isLoading: isProgramLoading } = useActiveProgram();
  const { data: weekMap = {}, isLoading: weekLoading } = useWeekSessionMap();
  const triggerRecalibration = useTriggerRecalibration();
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

  // ── Map plan days to calendar dates ──
  const calendarDays = useMemo(() => {
    if (!weeklyPlan?.weeklyPlan) return [];
    const monday = getCurrentMonday();
    const today = toDateKey(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = toDateKey(tomorrowDate);

    // Plan's weeklyPlan array maps to actual days based on day name.
    // Build a lookup: day name → plan index
    const planByDay = new Map<string, { plan: DayPlan; index: number }>();
    weeklyPlan.weeklyPlan.forEach((plan, idx) => {
      planByDay.set(plan.day, { plan, index: idx });
    });

    // Walk Mon–Sun and match plan entries
    const result: {
      dayPlan: DayPlan;
      planIndex: number;
      status: DayStatus;
      dateLabel: string;
      dateStr: string;
      dateKey: string;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dayName = DAY_NAMES[i];
      const dateKey = toDateKey(date);
      const entry = planByDay.get(dayName);
      if (!entry) continue; // rest day — no plan for this day

      const sessionStatus = weekMap[dateKey] as 'completed' | 'skipped' | undefined;

      let status: DayStatus;
      if (dateKey === today) {
        status = 'today';
      } else if (dateKey === tomorrow) {
        status = 'tomorrow';
      } else if (dateKey < today) {
        status = sessionStatus === 'completed' ? 'past-done' : 'past-missed';
      } else {
        status = 'future';
      }

      // Date label
      let dateLabel: string;
      if (dateKey === today) {
        dateLabel = 'Today';
      } else if (dateKey === tomorrow) {
        dateLabel = 'Tomorrow';
      } else {
        dateLabel = dayName;
      }

      const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      result.push({
        dayPlan: entry.plan,
        planIndex: entry.index,
        status,
        dateLabel,
        dateStr,
        dateKey,
      });
    }

    return result;
  }, [weeklyPlan, weekMap]);

  // ── Auto-recalibrate if missed days detected (check once on mount) ──
  useEffect(() => {
    if (!activeProgram || !calendarDays.length || !profile?.id) return;

    const today = toDateKey(new Date());
    const missedPastDays = calendarDays.filter(
      (d) => d.dateKey < today && d.status === 'past-missed',
    );

    // If any past days were missed, trigger recalibration for remaining days
    if (missedPastDays.length > 0) {
      triggerRecalibration.mutate();
    }
  }, [calendarDays.length, activeProgram?.id]);

  async function handleGenerateProgram() {
    if (!profile?.id) return;
    setIsGenerating(true);
    try {
      const { data: prefs, error: prefsError } = await supabase
        .from('user_preferences').select('*').eq('user_id', profile.id).single();

      if (prefsError || !prefs) {
        throw new Error('No preferences found. Please complete onboarding first.');
      }

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

      if (fnError) throw new Error(fnError.message || 'Program generation failed');
      if (programData?.error) throw new Error(programData.error);
      if (!programData?.programId) throw new Error('No program ID returned');

      const { data: newProgram, error: fetchError } = await supabase
        .from('workout_programs').select('*').eq('id', programData.programId).single();

      if (fetchError || !newProgram) throw new Error('Program generated but could not be loaded');

      setActiveProgram(newProgram);
    } catch (err: any) {
      console.error('Program generation error:', err);
      Alert.alert('Generation Failed', err?.message ?? 'Something went wrong.');
    } finally {
      setIsGenerating(false);
    }
  }

  const isLoading = isProgramLoading || weekLoading;

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mt-4 mb-6">
          <Text className="text-text-muted text-sm uppercase tracking-widest">⚔️ Training</Text>
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
                  { text: 'Edit Preferences', onPress: () => router.push('/onboarding') },
                  { text: 'Regenerate Program', style: 'destructive', onPress: handleGenerateProgram },
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

            {/* Legend */}
            <View className="flex-row gap-4 mb-3 px-1">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-accent-emerald mr-1.5" />
                <Text className="text-text-muted text-xs">Done</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-accent-red mr-1.5" />
                <Text className="text-text-muted text-xs">Missed</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-full bg-accent-purple mr-1.5" />
                <Text className="text-text-muted text-xs">Today</Text>
              </View>
            </View>

            {/* Day Cards */}
            {calendarDays.map((cd) => (
              <WorkoutDayCard
                key={cd.dateKey}
                day={cd.dayPlan}
                index={cd.planIndex}
                status={cd.status}
                dateLabel={cd.dateLabel}
                dateStr={cd.dateStr}
                onPress={() => router.push(`/workout/${cd.planIndex}`)}
                onEdit={
                  cd.status !== 'past-done' && cd.status !== 'past-missed'
                    ? () => router.push(`/workout/edit/${cd.planIndex}`)
                    : undefined
                }
              />
            ))}
          </>
        ) : (
          <View className="items-center py-20">
            {isLoading ? (
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

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/app-store';
import type { DayPlan } from '@/types';

function WorkoutDayCard({ day, index, onPress }: { day: DayPlan; index: number; onPress: () => void }) {
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
        <View className="flex-row items-center">
          {isToday && (
            <View className="bg-accent-purple rounded-full w-2 h-2 mr-2" />
          )}
          <Text className="text-text-primary font-bold text-base">{day.day}</Text>
        </View>
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
  const { activeProgram } = useAppStore();
  const weeklyPlan = activeProgram?.weekly_plan;

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
            <Pressable className="bg-bg-tertiary rounded-xl p-4 mb-4 flex-row items-center active:opacity-80">
              <Ionicons name="create-outline" size={20} color="#6366F1" />
              <Text className="text-accent-purple-light text-sm font-semibold ml-2 flex-1">
                Edit this week&apos;s plan
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#6366F1" />
            </Pressable>

            {/* Day Cards */}
            {weeklyPlan.weeklyPlan.map((day, index) => (
              <WorkoutDayCard
                key={day.day}
                day={day}
                index={index}
                onPress={() => router.push(`/workout/${index}`)}
              />
            ))}
          </>
        ) : (
          <View className="items-center py-20">
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

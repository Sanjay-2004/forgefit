import { View, Text, Pressable } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import type { WorkoutSplit } from '@/types';

const SPLITS: { value: WorkoutSplit; label: string; desc: string; icon: string }[] = [
  { value: 'ppl', label: 'Push / Pull / Legs', desc: 'Best for 3–6 day splits', icon: '🏋️' },
  { value: 'upper_lower', label: 'Upper / Lower', desc: 'Great for 4-day splits', icon: '⬆️' },
  { value: 'full_body', label: 'Full Body', desc: 'Ideal for 2–3 day splits', icon: '💪' },
  { value: 'bro_split', label: 'Bro Split', desc: '1 body part per day', icon: '🔥' },
  { value: 'auto', label: 'Let AI Decide', desc: 'Based on your goals & schedule', icon: '🤖' },
];

export function ScheduleStep() {
  const { data, updateData } = useOnboardingStore();

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Battle Schedule</Text>
      <Text className="text-text-secondary text-base mt-2 mb-8">
        How often and how long can you train?
      </Text>

      {/* Split Type */}
      <Text className="text-text-secondary text-sm font-semibold mb-3 uppercase tracking-wider">
        Training Split
      </Text>
      <View className="gap-2 mb-8">
        {SPLITS.map((split) => (
          <Pressable
            key={split.value}
            onPress={() => updateData({ preferred_split: split.value })}
            className={`flex-row items-center p-4 rounded-xl border ${
              data.preferred_split === split.value
                ? 'bg-accent-purple/10 border-accent-purple'
                : 'bg-bg-card border-transparent'
            } active:opacity-80`}
          >
            <Text className="text-xl mr-3">{split.icon}</Text>
            <View className="flex-1">
              <Text className="text-text-primary font-bold text-base">{split.label}</Text>
              <Text className="text-text-muted text-xs">{split.desc}</Text>
            </View>
            {data.preferred_split === split.value && (
              <Text className="text-accent-purple text-lg">✓</Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* Days per week */}
      <Text className="text-text-secondary text-sm font-semibold mb-3 uppercase tracking-wider">
        Days per Week
      </Text>
      <View className="flex-row gap-2 mb-8">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <Pressable
            key={day}
            onPress={() => updateData({ workout_days_per_week: day })}
            className={`flex-1 py-3 rounded-xl items-center ${
              data.workout_days_per_week === day
                ? 'bg-accent-purple'
                : 'bg-bg-card'
            }`}
          >
            <Text
              className={`font-bold text-base ${
                data.workout_days_per_week === day ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {day}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Session duration */}
      <Text className="text-text-secondary text-sm font-semibold mb-3 uppercase tracking-wider">
        Session Duration
      </Text>
      <View className="gap-3">
        {[
          { value: 30, label: '30 min', desc: 'Quick & intense' },
          { value: 45, label: '45 min', desc: 'Focused session' },
          { value: 60, label: '60 min', desc: 'Standard training' },
          { value: 90, label: '90 min', desc: 'Comprehensive workout' },
          { value: 120, label: '120 min', desc: 'Extended session' },
        ].map((option) => (
          <Pressable
            key={option.value}
            onPress={() => updateData({ session_duration_minutes: option.value })}
            className={`flex-row items-center justify-between p-4 rounded-xl border ${
              data.session_duration_minutes === option.value
                ? 'bg-accent-purple/10 border-accent-purple'
                : 'bg-bg-card border-transparent'
            } active:opacity-80`}
          >
            <View>
              <Text className="text-text-primary font-bold text-base">{option.label}</Text>
              <Text className="text-text-muted text-xs">{option.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

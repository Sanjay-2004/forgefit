import { View, Text, Pressable } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { ACTIVITY_LEVELS, SLEEP_QUALITY_OPTIONS, STRESS_LEVELS } from '@/lib/constants';
import type { ActivityLevel, SleepQuality, StressLevel } from '@/types';

export function LifestyleStep() {
  const { data, updateData } = useOnboardingStore();

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Lifestyle Intel</Text>
      <Text className="text-text-secondary text-base mt-2 mb-8">
        Recovery is part of the fight. Help us understand yours.
      </Text>

      {/* Activity Level */}
      <Text className="text-text-secondary text-sm font-semibold mb-3 uppercase tracking-wider">
        Activity Level
      </Text>
      <View className="gap-2 mb-6">
        {ACTIVITY_LEVELS.map((level) => (
          <Pressable
            key={level.value}
            onPress={() => updateData({ activity_level: level.value as ActivityLevel })}
            className={`p-4 rounded-xl border ${
              data.activity_level === level.value
                ? 'bg-accent-purple/10 border-accent-purple'
                : 'bg-bg-card border-transparent'
            } active:opacity-80`}
          >
            <Text className="text-text-primary font-bold text-sm">{level.label}</Text>
            <Text className="text-text-muted text-xs">{level.description}</Text>
          </Pressable>
        ))}
      </View>

      {/* Sleep Quality */}
      <Text className="text-text-secondary text-sm font-semibold mb-3 uppercase tracking-wider">
        Sleep Quality
      </Text>
      <View className="flex-row gap-2 mb-6">
        {SLEEP_QUALITY_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => updateData({ sleep_quality: option.value as SleepQuality })}
            className={`flex-1 py-3 rounded-xl items-center ${
              data.sleep_quality === option.value ? 'bg-accent-purple' : 'bg-bg-card'
            }`}
          >
            <Text
              className={`font-semibold text-xs ${
                data.sleep_quality === option.value ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Stress Level */}
      <Text className="text-text-secondary text-sm font-semibold mb-3 uppercase tracking-wider">
        Stress Level
      </Text>
      <View className="flex-row gap-2">
        {STRESS_LEVELS.map((level) => (
          <Pressable
            key={level.value}
            onPress={() => updateData({ stress_level: level.value as StressLevel })}
            className={`flex-1 py-3 rounded-xl items-center ${
              data.stress_level === level.value ? 'bg-accent-purple' : 'bg-bg-card'
            }`}
          >
            <Text
              className={`font-semibold text-xs ${
                data.stress_level === level.value ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {level.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

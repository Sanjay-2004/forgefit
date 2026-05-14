import { View, Text, Pressable } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { EXPERIENCE_LEVELS } from '@/lib/constants';
import type { ExperienceLevel } from '@/types';

export function ExperienceStep() {
  const { data, updateData } = useOnboardingStore();

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Experience Level</Text>
      <Text className="text-text-secondary text-base mt-2 mb-8">
        This determines your starting intensity and complexity.
      </Text>

      <View className="gap-3">
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = data.experience_level === level.value;
          return (
            <Pressable
              key={level.value}
              onPress={() => updateData({ experience_level: level.value as ExperienceLevel })}
              className={`p-5 rounded-xl border ${
                isSelected
                  ? 'bg-accent-purple/10 border-accent-purple'
                  : 'bg-bg-card border-transparent'
              } active:opacity-80`}
            >
              <Text className="text-text-primary font-bold text-lg">{level.label}</Text>
              <Text className="text-text-secondary text-sm mt-1">{level.description}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

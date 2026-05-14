import { View, Text, Pressable } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { WORKOUT_STYLES } from '@/lib/constants';
import type { WorkoutStyle } from '@/types';

export function StyleStep() {
  const { data, toggleStyle } = useOnboardingStore();
  const selected = data.preferred_styles ?? [];

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Fighting Style</Text>
      <Text className="text-text-secondary text-base mt-2 mb-8">
        How do you like to train? Select your preferred styles.
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {WORKOUT_STYLES.map((style) => {
          const isSelected = selected.includes(style.value as WorkoutStyle);
          return (
            <Pressable
              key={style.value}
              onPress={() => toggleStyle(style.value as WorkoutStyle)}
              className={`px-5 py-3 rounded-xl border ${
                isSelected
                  ? 'bg-accent-purple/10 border-accent-purple'
                  : 'bg-bg-card border-transparent'
              } active:opacity-80`}
            >
              <Text
                className={`font-semibold text-sm ${
                  isSelected ? 'text-accent-purple' : 'text-text-secondary'
                }`}
              >
                {style.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

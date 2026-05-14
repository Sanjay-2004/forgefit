import { View, Text, Pressable } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { TRAINING_LOCATIONS } from '@/lib/constants';
import type { TrainingLocation } from '@/types';

export function LocationStep() {
  const { data, updateData } = useOnboardingStore();

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Training Ground</Text>
      <Text className="text-text-secondary text-base mt-2 mb-8">
        Where do you usually train? This shapes your exercise selection.
      </Text>

      <View className="gap-3">
        {TRAINING_LOCATIONS.map((loc) => {
          const isSelected = data.training_location === loc.value;
          return (
            <Pressable
              key={loc.value}
              onPress={() => updateData({ training_location: loc.value as TrainingLocation })}
              className={`flex-row items-center p-5 rounded-xl border ${
                isSelected
                  ? 'bg-accent-purple/10 border-accent-purple'
                  : 'bg-bg-card border-transparent'
              } active:opacity-80`}
            >
              <Text className="text-3xl mr-4">{loc.icon}</Text>
              <View className="flex-1">
                <Text className="text-text-primary font-bold text-lg">{loc.label}</Text>
                <Text className="text-text-secondary text-sm mt-0.5">{loc.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

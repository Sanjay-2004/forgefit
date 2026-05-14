import { View, Text, Pressable } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { FITNESS_GOALS } from '@/lib/constants';
import type { FitnessGoal } from '@/types';

export function GoalsStep() {
  const { data, toggleGoal } = useOnboardingStore();
  const selected = data.fitness_goals ?? [];

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Your Mission</Text>
      <Text className="text-text-secondary text-base mt-2 mb-8">
        Select your primary fitness goals. Choose as many as apply.
      </Text>

      <View className="gap-3">
        {FITNESS_GOALS.map((goal) => {
          const isSelected = selected.includes(goal.value as FitnessGoal);
          return (
            <Pressable
              key={goal.value}
              onPress={() => toggleGoal(goal.value as FitnessGoal)}
              className={`flex-row items-center p-4 rounded-xl border ${
                isSelected
                  ? 'bg-accent-purple/10 border-accent-purple'
                  : 'bg-bg-card border-transparent'
              } active:opacity-80`}
            >
              <Text className="text-2xl mr-3">{goal.icon}</Text>
              <View className="flex-1">
                <Text className="text-text-primary font-bold text-base">{goal.label}</Text>
                <Text className="text-text-secondary text-xs mt-0.5">{goal.description}</Text>
              </View>
              {isSelected && (
                <View className="w-6 h-6 rounded-full bg-accent-purple items-center justify-center">
                  <Text className="text-white text-xs font-bold">✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

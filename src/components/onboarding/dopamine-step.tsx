import { View, Text, Pressable } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { DOPAMINE_TYPES } from '@/lib/constants';
import type { DopamineType } from '@/types';

export function DopamineStep() {
  const { data, updateData } = useOnboardingStore();

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Motivation Style</Text>
      <Text className="text-text-secondary text-base mt-2 mb-2">
        How do you get your dopamine? This shapes how we motivate you.
      </Text>
      <Text className="text-text-muted text-xs mb-8">
        Pick the one that resonates most with you.
      </Text>

      <View className="gap-3">
        {DOPAMINE_TYPES.map((type) => {
          const isSelected = data.dopamine_type === type.value;
          return (
            <Pressable
              key={type.value}
              onPress={() => updateData({ dopamine_type: type.value as DopamineType })}
              className={`p-5 rounded-xl border ${
                isSelected
                  ? 'bg-accent-purple/10 border-accent-purple'
                  : 'bg-bg-card border-transparent'
              } active:opacity-80`}
            >
              <View className="flex-row items-center mb-1">
                <Text className="text-2xl mr-3">{type.icon}</Text>
                <View className="flex-1">
                  <Text className="text-text-primary font-bold text-lg">{type.label}</Text>
                  <Text className="text-text-secondary text-sm">{type.description}</Text>
                </View>
              </View>
              <Text className="text-accent-purple/60 text-xs mt-2 italic">
                Inspired by: {type.theme}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

import { View, Text, Pressable } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { EQUIPMENT_OPTIONS } from '@/lib/constants';
import type { EquipmentAccess } from '@/types';

export function EquipmentStep() {
  const { data, toggleEquipment } = useOnboardingStore();
  const selected = data.equipment_access ?? [];

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Your Arsenal</Text>
      <Text className="text-text-secondary text-base mt-2 mb-8">
        What equipment do you have access to? Select all that apply.
      </Text>

      <View className="gap-3">
        {EQUIPMENT_OPTIONS.map((item) => {
          const isSelected = selected.includes(item.value as EquipmentAccess);
          return (
            <Pressable
              key={item.value}
              onPress={() => toggleEquipment(item.value as EquipmentAccess)}
              className={`flex-row items-center p-4 rounded-xl border ${
                isSelected
                  ? 'bg-accent-purple/10 border-accent-purple'
                  : 'bg-bg-card border-transparent'
              } active:opacity-80`}
            >
              <Text className="text-2xl mr-3">{item.icon}</Text>
              <Text className="text-text-primary font-bold text-base flex-1">{item.label}</Text>
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

import { View, Text, TextInput } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { COMMON_LIFTS } from '@/lib/constants';

export function CurrentStatsStep() {
  const { data, updateStat } = useOnboardingStore();
  const stats = data.current_stats ?? {};

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Current Power Level</Text>
      <Text className="text-text-secondary text-base mt-2 mb-2">
        Enter your current best numbers. Leave blank if you don&apos;t know.
      </Text>
      <Text className="text-text-muted text-xs mb-8">
        This helps us set your starting point and track progress.
      </Text>

      <View className="gap-4">
        {COMMON_LIFTS.map((lift) => (
          <View key={lift.key} className="flex-row items-center">
            <Text className="text-text-primary text-sm font-semibold flex-1">
              {lift.label}
            </Text>
            <View className="flex-row items-center">
              <TextInput
                placeholder="—"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                value={stats[lift.key]?.toString() ?? ''}
                onChangeText={(v) => updateStat(lift.key, v ? parseFloat(v) : 0)}
                className="bg-bg-card text-text-primary rounded-lg px-4 py-3 w-24 text-center text-sm"
              />
              <Text className="text-text-muted text-xs ml-2 w-8">{lift.unit}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

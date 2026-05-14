import { View, Text, TextInput } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { COMMON_LIFTS } from '@/lib/constants';

export function GoalStatsStep() {
  const { data, updateGoalStat } = useOnboardingStore();
  const goals = data.goal_stats ?? {};
  const current = data.current_stats ?? {};

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Target Power Level</Text>
      <Text className="text-text-secondary text-base mt-2 mb-2">
        Where do you want to be? Set your goals.
      </Text>
      <Text className="text-text-muted text-xs mb-8">
        We&apos;ll track your journey from current stats to these targets.
      </Text>

      <View className="gap-4">
        {COMMON_LIFTS.map((lift) => {
          const currentVal = current[lift.key];
          return (
            <View key={lift.key}>
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-text-primary text-sm font-semibold">
                    {lift.label}
                  </Text>
                  {currentVal ? (
                    <Text className="text-text-muted text-xs">
                      Current: {currentVal} {lift.unit}
                    </Text>
                  ) : null}
                </View>
                <View className="flex-row items-center">
                  <TextInput
                    placeholder="Goal"
                    placeholderTextColor="#64748B"
                    keyboardType="decimal-pad"
                    value={goals[lift.key]?.toString() ?? ''}
                    onChangeText={(v) => updateGoalStat(lift.key, v ? parseFloat(v) : 0)}
                    className="bg-bg-card text-text-primary rounded-lg px-4 py-3 w-24 text-center text-sm"
                  />
                  <Text className="text-text-muted text-xs ml-2 w-8">{lift.unit}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

import { View, Text, TextInput } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';

export function BodyStep() {
  const { data, updateData } = useOnboardingStore();

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Body Stats</Text>
      <Text className="text-text-secondary text-base mt-2 mb-8">
        We use this to calibrate your program intensity.
      </Text>

      <Text className="text-text-secondary text-sm font-semibold mb-2 uppercase tracking-wider">
        Height (cm)
      </Text>
      <TextInput
        placeholder="175"
        placeholderTextColor="#64748B"
        keyboardType="number-pad"
        value={data.height_cm?.toString() ?? ''}
        onChangeText={(v) => updateData({ height_cm: v ? parseInt(v, 10) : undefined })}
        className="bg-bg-card text-text-primary rounded-xl px-4 py-4 text-base mb-6"
      />

      <Text className="text-text-secondary text-sm font-semibold mb-2 uppercase tracking-wider">
        Weight (kg)
      </Text>
      <TextInput
        placeholder="75"
        placeholderTextColor="#64748B"
        keyboardType="decimal-pad"
        value={data.weight_kg?.toString() ?? ''}
        onChangeText={(v) => updateData({ weight_kg: v ? parseFloat(v) : undefined })}
        className="bg-bg-card text-text-primary rounded-xl px-4 py-4 text-base mb-6"
      />

      <Text className="text-text-secondary text-sm font-semibold mb-2 uppercase tracking-wider">
        Injuries / Limitations
      </Text>
      <TextInput
        placeholder="e.g., Lower back pain, knee issues"
        placeholderTextColor="#64748B"
        multiline
        value={data.injuries ?? ''}
        onChangeText={(v) => updateData({ injuries: v })}
        className="bg-bg-card text-text-primary rounded-xl px-4 py-4 text-base min-h-[80px]"
        textAlignVertical="top"
      />
    </View>
  );
}

import { View, Text, TextInput } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAppStore } from '@/stores/app-store';
import { supabase } from '@/lib/supabase/client';
import { useState } from 'react';

export function BasicsStep() {
  const { data, updateData } = useOnboardingStore();
  const { profile, setProfile } = useAppStore();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');

  function handleNameChange(name: string) {
    setFullName(name);
    supabase.from('profiles').update({ full_name: name }).eq('id', profile?.id).then();
    setProfile(profile ? { ...profile, full_name: name } : null);
  }

  return (
    <View className="mt-8">
      <Text className="text-text-primary text-2xl font-bold">Welcome, Hunter</Text>
      <Text className="text-text-secondary text-base mt-2 mb-8">
        Tell us about yourself to forge your perfect training program.
      </Text>

      <Text className="text-text-secondary text-sm font-semibold mb-2 uppercase tracking-wider">
        Full Name
      </Text>
      <TextInput
        placeholder="Your name"
        placeholderTextColor="#64748B"
        value={fullName}
        onChangeText={handleNameChange}
        className="bg-bg-card text-text-primary rounded-xl px-4 py-4 text-base mb-6"
      />

      <Text className="text-text-secondary text-sm font-semibold mb-2 uppercase tracking-wider">
        Age
      </Text>
      <TextInput
        placeholder="25"
        placeholderTextColor="#64748B"
        keyboardType="number-pad"
        value={data.age?.toString() ?? ''}
        onChangeText={(v) => updateData({ age: v ? parseInt(v, 10) : undefined })}
        className="bg-bg-card text-text-primary rounded-xl px-4 py-4 text-base mb-6"
      />

      <Text className="text-text-secondary text-sm font-semibold mb-2 uppercase tracking-wider">
        Sex
      </Text>
      <View className="flex-row gap-3">
        {(['male', 'female', 'other'] as const).map((sex) => (
          <SelectorChip
            key={sex}
            label={sex.charAt(0).toUpperCase() + sex.slice(1)}
            selected={data.sex === sex}
            onPress={() => updateData({ sex })}
          />
        ))}
      </View>
    </View>
  );
}

function SelectorChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <View className="flex-1">
      <Text
        onPress={onPress}
        className={`text-center py-3 rounded-xl font-semibold text-sm ${
          selected
            ? 'bg-accent-purple text-white'
            : 'bg-bg-card text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

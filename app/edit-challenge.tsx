import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useChallengeStore } from '@/stores/challenge-store';
import { useDailyLogStore } from '@/stores/daily-log-store';
import { updateChallenge } from '@/api/challenge';
import { getToday } from '@/api/daily-log';

interface DraftTarget { _id?: string; name: string; type: string; xpValue: string }

export default function EditChallengeScreen() {
  const router = useRouter();
  const { challenge, setChallenge } = useChallengeStore();
  const setLog = useDailyLogStore((s) => s.setLog);

  const [water, setWater] = useState<3 | 4>(challenge?.waterTarget ?? 3);
  const [targets, setTargets] = useState<DraftTarget[]>(
    (challenge?.dailyTargets ?? []).map((t) => ({
      _id: t._id, name: t.name, type: t.type, xpValue: String(t.xpValue),
    })),
  );
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!challenge) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <Text className="text-text-secondary">No active challenge.</Text>
      </SafeAreaView>
    );
  }

  function update(idx: number, patch: Partial<DraftTarget>) {
    setTargets((ts) => ts.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  function add() {
    if (!newName.trim()) return;
    setTargets((ts) => [...ts, { name: newName.trim(), type: 'custom', xpValue: '10' }]);
    setNewName('');
  }

  async function save() {
    if (!challenge) return;
    if (targets.length === 0 || targets.some((t) => !t.name.trim())) {
      Alert.alert('Invalid', 'Keep at least one quest and make sure none are blank.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateChallenge(challenge._id, {
        waterTarget: water,
        dailyTargets: targets.map((t) => ({
          ...(t._id ? { _id: t._id } : {}),
          name: t.name.trim(),
          type: t.type as any,
          xpValue: Math.max(1, Math.min(100, Number(t.xpValue) || 10)),
        })),
      });
      setChallenge(updated);
      try { setLog(await getToday()); } catch { /* dashboard will refetch */ }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()}><Text className="text-text-secondary">Cancel</Text></Pressable>
        <Text className="text-text-primary font-bold tracking-widest">EDIT CHALLENGE</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        <Text className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase mb-3">💧 Water target</Text>
        <View className="flex-row gap-3 mb-6">
          {([3, 4] as const).map((l) => (
            <Pressable
              key={l}
              onPress={() => setWater(l)}
              className={`flex-1 rounded-2xl py-4 items-center border-2 bg-bg-secondary ${water === l ? 'border-neon-cyan' : 'border-bg-tertiary'}`}
            >
              <Text className={`text-xl font-bold ${water === l ? 'text-neon-cyan' : 'text-text-primary'}`}>{l}L</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase mb-3">⚔️ Daily quests</Text>
        {targets.map((t, idx) => (
          <View key={t._id ?? `new-${idx}`} className="flex-row items-center bg-bg-secondary rounded-xl px-3 py-2 mb-2 border border-bg-tertiary">
            <TextInput
              className="flex-1 text-text-primary text-sm py-2"
              value={t.name}
              onChangeText={(v) => update(idx, { name: v })}
            />
            <TextInput
              className="bg-bg-primary text-neon-cyan rounded-lg px-2 py-1 w-12 text-center text-sm font-bold"
              keyboardType="number-pad"
              value={t.xpValue}
              onChangeText={(v) => update(idx, { xpValue: v.replace(/[^0-9]/g, '') })}
            />
            <Text className="text-text-muted text-xs ml-1 mr-2">XP</Text>
            <Pressable onPress={() => setTargets((ts) => ts.filter((_, i) => i !== idx))} className="p-1">
              <Text className="text-red-500 text-lg">×</Text>
            </Pressable>
          </View>
        ))}
        <View className="flex-row items-center gap-2 mt-2 mb-6">
          <TextInput
            className="flex-1 bg-bg-secondary text-text-primary rounded-xl px-4 py-3 border border-bg-tertiary text-sm"
            placeholder="New quest..."
            placeholderTextColor="#64748B"
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={add}
          />
          <Pressable onPress={add} className="bg-accent-purple rounded-xl px-4 py-3"><Text className="text-white font-bold">+</Text></Pressable>
        </View>
        <Text className="text-text-muted text-xs mb-6">
          Duration and start date can't be changed. Start a new challenge if you need that.
        </Text>
      </ScrollView>

      <View className="px-6 pb-8">
        <Pressable onPress={save} disabled={saving} className="bg-accent-purple rounded-2xl py-4 items-center active:opacity-80">
          {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold tracking-wider">SAVE CHANGES</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

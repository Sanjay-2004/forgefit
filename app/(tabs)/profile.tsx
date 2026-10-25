import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { applyReminder, loadReminder, DEFAULT_REMINDER, type ReminderSettings } from '@/lib/notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/stores/user-store';
import { useChallengeStore } from '@/stores/challenge-store';
import { RankBadge } from '@/components/ui/RankBadge';
import { XPBar } from '@/components/ui/XPBar';
import { ProgressCalendar } from '@/components/ui/ProgressCalendar';
import { getProgressStats } from '@/api/stats';
import type { ProgressStats } from '@/types';
import { RANK_TITLES } from '@/types';
import { getRankColor } from '@/lib/utils';

export default function ProfileScreen() {
  const router = useRouter();
  const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER);
  useEffect(() => { loadReminder().then(setReminder); }, []);

  async function changeReminder(next: ReminderSettings) {
    const ok = await applyReminder(next);
    if (!ok) {
      Alert.alert('Notifications blocked', 'Enable notifications for ForgeFit in system settings.');
      setReminder({ ...next, enabled: false });
      return;
    }
    setReminder(next);
  }

  function shiftHour(delta: number) {
    changeReminder({ ...reminder, hour: (reminder.hour + delta + 24) % 24 });
  }

  function confirmSignOut() {
    Alert.alert('Sign out', 'Leave the System?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  const { name, email, level, totalXP, rank } = useUserStore();
  const { challenge } = useChallengeStore();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStats() {
    setLoading(true);
    try {
      const data = await getProgressStats();
      setStats(data);
    } catch (err) {
      console.error('fetchStats:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  const rankColor = getRankColor(rank);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00f0ff" />}
      >
        {/* ── Profile Header ── */}
        <LinearGradient colors={['#0f0f2e', '#0A0A1A']} className="px-5 pt-6 pb-8 items-center">
          <View
            className="w-20 h-20 rounded-full bg-bg-secondary border-4 items-center justify-center mb-3"
            style={{ borderColor: rankColor }}
          >
            <Text className="text-4xl">⚔️</Text>
          </View>
          <Text className="text-text-primary text-xl font-bold tracking-wider">
            {name ?? email ?? 'Hunter'}
          </Text>
          <Text className="text-text-muted text-sm mt-0.5 tracking-widest uppercase">
            {RANK_TITLES[rank]}
          </Text>
          <View className="mt-3 mb-4">
            <RankBadge rank={rank} size="lg" />
          </View>
          <View className="flex-row gap-6 mt-2">
            <View className="items-center">
              <Text className="text-2xl font-bold text-text-primary">{level}</Text>
              <Text className="text-text-muted text-xs tracking-wider">LEVEL</Text>
            </View>
            <View className="w-px bg-bg-tertiary" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-text-primary">{totalXP.toLocaleString()}</Text>
              <Text className="text-text-muted text-xs tracking-wider">TOTAL XP</Text>
            </View>
            <View className="w-px bg-bg-tertiary" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-neon-cyan">{stats?.currentStreak ?? 0}</Text>
              <Text className="text-text-muted text-xs tracking-wider">STREAK</Text>
            </View>
          </View>
          <View className="w-full mt-5 px-2">
            <XPBar totalXP={totalXP} rank={rank} level={level} />
          </View>
        </LinearGradient>

        <View className="px-5 pt-5 pb-24">
          {challenge && (
            <View className="bg-bg-secondary rounded-2xl p-4 border border-bg-tertiary mb-5">
              <Text className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase mb-3">⚔️ Active Challenge</Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-text-muted text-xs">Duration</Text>
                  <Text className="text-text-primary font-bold">{challenge.durationDays} days</Text>
                </View>
                <View>
                  <Text className="text-text-muted text-xs">Water Target</Text>
                  <Text className="text-text-primary font-bold">{challenge.waterTarget}L / day</Text>
                </View>
                <View>
                  <Text className="text-text-muted text-xs">Days Done</Text>
                  <Text className="text-text-primary font-bold">{stats?.totalDaysCompleted ?? 0}</Text>
                </View>
              </View>
            </View>
          )}
          <View className="flex-row gap-3 mb-5">
            <View className="flex-1 bg-bg-secondary rounded-2xl p-4 border border-bg-tertiary">
              <Text className="text-3xl font-bold text-neon-cyan">{stats?.currentStreak ?? 0}</Text>
              <Text className="text-text-muted text-xs mt-1 tracking-wider uppercase">Current Streak 🔥</Text>
            </View>
            <View className="flex-1 bg-bg-secondary rounded-2xl p-4 border border-bg-tertiary">
              <Text className="text-3xl font-bold text-accent-purple">{stats?.longestStreak ?? 0}</Text>
              <Text className="text-text-muted text-xs mt-1 tracking-wider uppercase">Best Streak 👑</Text>
            </View>
          </View>
          <View className="bg-bg-secondary rounded-2xl p-4 border border-bg-tertiary mb-5">
            <Text className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase mb-4">📅 Quest Journal</Text>
            {loading && !stats ? (
              <ActivityIndicator color="#00f0ff" />
            ) : (
              <ProgressCalendar
                days={stats?.calendarDays ?? []}
                totalDays={challenge?.durationDays ?? 75}
              />
            )}
          </View>
          <View className="bg-bg-secondary rounded-2xl p-4 border border-bg-tertiary mb-5">
            <Text className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase mb-3">⚙️ Settings</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-text-primary">Daily reminder</Text>
              <Switch
                value={reminder.enabled}
                onValueChange={(v) => changeReminder({ ...reminder, enabled: v })}
                trackColor={{ true: '#7C3AED', false: '#334155' }}
              />
            </View>
            {reminder.enabled && (
              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-text-muted text-sm">Remind me at</Text>
                <View className="flex-row items-center gap-3">
                  <Pressable onPress={() => shiftHour(-1)} className="bg-bg-primary rounded-lg px-3 py-1"><Text className="text-neon-cyan text-lg">−</Text></Pressable>
                  <Text className="text-text-primary font-bold w-16 text-center">
                    {String(reminder.hour).padStart(2, '0')}:{String(reminder.minute).padStart(2, '0')}
                  </Text>
                  <Pressable onPress={() => shiftHour(1)} className="bg-bg-primary rounded-lg px-3 py-1"><Text className="text-neon-cyan text-lg">+</Text></Pressable>
                </View>
              </View>
            )}
            {challenge && (
              <Pressable onPress={() => router.push('/edit-challenge' as any)} className="mt-4 bg-bg-primary rounded-xl py-3 items-center border border-bg-tertiary active:opacity-70">
                <Text className="text-text-primary font-semibold">Edit challenge</Text>
              </Pressable>
            )}
            <Pressable onPress={confirmSignOut} className="mt-3 rounded-xl py-3 items-center border border-red-500/40 active:opacity-70">
              <Text className="text-red-400 font-semibold">Sign out</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

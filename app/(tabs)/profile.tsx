import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import { useGamification } from '@/lib/hooks';
import { getRankColor, getXPProgressInRank } from '@/lib/utils';
import { RANK_ORDER, RANK_XP_THRESHOLDS, type HunterRank } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, preferences } = useAppStore();
  const { data: gamification } = useGamification();

  const rank = gamification?.current_rank ?? 'E';
  const xpTotal = gamification?.xp_total ?? 0;
  const rankColor = getRankColor(rank);
  const xpProgress = getXPProgressInRank(xpTotal);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View className="items-center mt-6 mb-8">
          <View
            className="w-24 h-24 rounded-full bg-bg-card items-center justify-center mb-4"
            style={{ borderWidth: 3, borderColor: rankColor }}
          >
            <Text className="text-4xl">⚔️</Text>
          </View>
          <Text className="text-text-primary text-xl font-bold">
            {profile?.full_name ?? 'Hunter'}
          </Text>
          <Text className="text-text-secondary text-sm mt-1">{profile?.email}</Text>
          <View className="flex-row items-center mt-2">
            <Text className="font-bold text-lg" style={{ color: rankColor }}>
              Rank {rank}
            </Text>
            <Text className="text-text-muted text-sm ml-2">
              · {xpTotal.toLocaleString()} XP
            </Text>
          </View>
          {/* XP to next rank */}
          <View className="w-full mt-3 px-6">
            <View className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${xpProgress.percentage}%`, backgroundColor: rankColor }}
              />
            </View>
            <Text className="text-text-secondary text-xs text-center mt-1">
              {xpProgress.needed > 0
                ? `${xpProgress.current.toLocaleString()} / ${xpProgress.needed.toLocaleString()} XP to next rank`
                : 'Max rank achieved!'}
            </Text>
          </View>
        </View>

        {/* ── Rank Ladder ── */}
        <View className="bg-bg-card rounded-2xl p-5 mb-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-4">
            Rank Ladder
          </Text>
          {RANK_ORDER.map((r) => {
            const isCurrent = r === rank;
            const isUnlocked = xpTotal >= RANK_XP_THRESHOLDS[r];
            const color = getRankColor(r);
            return (
              <View
                key={r}
                className={`flex-row items-center py-2.5 ${
                  isCurrent ? 'bg-bg-tertiary rounded-lg px-2 -mx-2' : ''
                }`}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: isUnlocked ? color + '20' : '#37415120',
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: isUnlocked ? color : '#6B7280' }}
                  >
                    {r}
                  </Text>
                </View>
                <Text
                  className="flex-1 text-sm font-medium"
                  style={{ color: isUnlocked ? '#E5E7EB' : '#6B7280' }}
                >
                  Rank {r}
                </Text>
                <Text className="text-text-secondary text-xs">
                  {RANK_XP_THRESHOLDS[r].toLocaleString()} XP
                </Text>
                {isCurrent && (
                  <Ionicons name="arrow-back" size={14} color={color} style={{ marginLeft: 6 }} />
                )}
              </View>
            );
          })}
        </View>

        {/* Info Cards */}
        <View className="bg-bg-card rounded-2xl p-5 mb-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-4">
            Fitness Profile
          </Text>
          <ProfileRow label="Goal" value={preferences?.fitness_goal?.replace(/_/g, ' ') ?? '—'} />
          <ProfileRow label="Experience" value={preferences?.experience_level ?? '—'} />
          <ProfileRow label="Days/Week" value={String(preferences?.workout_days_per_week ?? '—')} />
          <ProfileRow label="Session" value={preferences?.session_duration_minutes ? `${preferences.session_duration_minutes} min` : '—'} />
          <ProfileRow label="Equipment" value={preferences?.equipment_access?.replace(/_/g, ' ') ?? '—'} />
        </View>

        <View className="bg-bg-card rounded-2xl p-5 mb-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-4">
            Lifestyle
          </Text>
          <ProfileRow label="Activity" value={preferences?.activity_level?.replace(/_/g, ' ') ?? '—'} />
          <ProfileRow label="Sleep" value={preferences?.sleep_quality ?? '—'} />
          <ProfileRow label="Stress" value={preferences?.stress_level?.replace(/_/g, ' ') ?? '—'} />
        </View>

        {/* Actions */}
        <Pressable
          onPress={() => router.push('/onboarding')}
          className="bg-bg-card rounded-2xl p-4 mb-3 flex-row items-center active:opacity-80"
        >
          <Ionicons name="settings-outline" size={20} color="#94A3B8" />
          <Text className="text-text-primary text-sm font-semibold ml-3 flex-1">
            Edit Preferences
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </Pressable>

        <Pressable
          onPress={handleSignOut}
          className="bg-bg-card rounded-2xl p-4 mb-12 flex-row items-center active:opacity-80"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-accent-red text-sm font-semibold ml-3">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-bg-tertiary">
      <Text className="text-text-secondary text-sm">{label}</Text>
      <Text className="text-text-primary text-sm font-medium capitalize">{value}</Text>
    </View>
  );
}

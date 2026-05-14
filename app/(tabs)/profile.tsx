import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import { getRankFromXP, getRankColor } from '@/lib/utils';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, preferences, gamification } = useAppStore();
  const rank = gamification?.current_rank ?? getRankFromXP(gamification?.xp_total ?? 0);
  const rankColor = getRankColor(rank);

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
              · {gamification?.xp_total?.toLocaleString() ?? 0} XP
            </Text>
          </View>
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

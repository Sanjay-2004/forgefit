import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/app-store';
import { getRankFromXP, getXPProgressInRank, getRankColor, isStreakActive } from '@/lib/utils';
import { XP_REWARDS } from '@/lib/constants';

function RankBadge({ rank, size = 'large' }: { rank: string; size?: 'small' | 'large' }) {
  const color = getRankColor(rank as any);
  const textSize = size === 'large' ? 'text-3xl' : 'text-lg';
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size === 'large' ? 80 : 40,
        height: size === 'large' ? 80 : 40,
        borderWidth: 2,
        borderColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
      }}
    >
      <Text className={`${textSize} font-bold`} style={{ color }}>
        {rank}
      </Text>
    </View>
  );
}

function StreakFlame({ count, isActive }: { count: number; isActive: boolean }) {
  const intensity = Math.min(count / 30, 1); // Max visual at 30 days
  return (
    <View className="items-center">
      <Text className="text-3xl">{isActive ? '🔥' : '💀'}</Text>
      <Text className="text-text-primary font-bold text-lg mt-1">{count}</Text>
      <Text className="text-text-muted text-xs">
        {isActive ? 'day streak' : 'streak lost'}
      </Text>
    </View>
  );
}

function XPProgressBar({ current, needed, percentage }: { current: number; needed: number; percentage: number }) {
  return (
    <View className="w-full">
      <View className="flex-row justify-between mb-1">
        <Text className="text-text-secondary text-xs">{current} XP</Text>
        <Text className="text-text-muted text-xs">{needed > 0 ? `${needed} to next rank` : 'MAX RANK'}</Text>
      </View>
      <View className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
        <View
          className="h-full rounded-full bg-accent-purple"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, gamification, activeProgram } = useAppStore();

  const xp = gamification?.xp_total ?? 0;
  const rank = gamification?.current_rank ?? getRankFromXP(xp);
  const progress = getXPProgressInRank(xp);
  const streak = gamification?.streak_count ?? 0;
  const streakActive = isStreakActive(gamification?.last_workout_date ?? null);

  // Get today's workout from active program
  const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon, etc.
  const adjustedIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Convert to Mon=0

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mt-4 mb-6">
          <View>
            <Text className="text-text-muted text-sm uppercase tracking-widest">
              Hunter&apos;s Hub
            </Text>
            <Text className="text-text-primary text-2xl font-bold mt-1">
              {profile?.full_name ?? 'Hunter'}
            </Text>
          </View>
          <RankBadge rank={rank} />
        </View>

        {/* XP & Streak Row */}
        <View className="flex-row items-center bg-bg-card rounded-2xl p-5 mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-accent-gold font-bold text-2xl">{xp.toLocaleString()} XP</Text>
            <XPProgressBar {...progress} />
          </View>
          <StreakFlame count={streak} isActive={streakActive} />
        </View>

        {/* Today's Quest */}
        <Pressable
          onPress={() => router.push('/(tabs)/workout')}
          className="bg-bg-card rounded-2xl p-5 mb-4 border border-accent-purple/30 active:opacity-80"
        >
          <View className="flex-row items-center mb-3">
            <Text className="text-accent-purple text-xs uppercase tracking-widest font-bold">
              ⚔️ Daily Quest
            </Text>
            <View className="flex-1" />
            <View className="bg-accent-purple/20 rounded-full px-3 py-1">
              <Text className="text-accent-purple text-xs font-bold">
                +{XP_REWARDS.QUEST_DAILY} XP
              </Text>
            </View>
          </View>
          <Text className="text-text-primary text-lg font-bold">
            {activeProgram ? 'Complete Today\'s Workout' : 'Generate Your First Program'}
          </Text>
          <Text className="text-text-secondary text-sm mt-1">
            {activeProgram
              ? `${activeProgram.name}`
              : 'Start your journey — tap to begin onboarding'}
          </Text>
          <View className="flex-row items-center mt-4">
            <Ionicons name="play-circle" size={24} color="#4F46E5" />
            <Text className="text-accent-purple font-semibold ml-2">Start Training</Text>
          </View>
        </Pressable>

        {/* Quick Stats Grid */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-bg-card rounded-2xl p-4">
            <Ionicons name="trophy" size={20} color="#F59E0B" />
            <Text className="text-text-primary font-bold text-xl mt-2">
              {gamification?.quests_completed ?? 0}
            </Text>
            <Text className="text-text-muted text-xs mt-1">Quests Done</Text>
          </View>
          <View className="flex-1 bg-bg-card rounded-2xl p-4">
            <Ionicons name="medal" size={20} color="#EF4444" />
            <Text className="text-text-primary font-bold text-xl mt-2">
              {gamification?.achievements_unlocked ?? 0}
            </Text>
            <Text className="text-text-muted text-xs mt-1">Achievements</Text>
          </View>
          <View className="flex-1 bg-bg-card rounded-2xl p-4">
            <Ionicons name="flame" size={20} color="#F97316" />
            <Text className="text-text-primary font-bold text-xl mt-2">
              {gamification?.longest_streak ?? 0}
            </Text>
            <Text className="text-text-muted text-xs mt-1">Best Streak</Text>
          </View>
        </View>

        {/* Recent Activity Placeholder */}
        <View className="bg-bg-card rounded-2xl p-5 mb-8">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-3">
            Recent Activity
          </Text>
          <View className="items-center py-6">
            <Ionicons name="document-text-outline" size={40} color="#64748B" />
            <Text className="text-text-secondary text-sm mt-2">
              Complete your first workout to see activity
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/stores/app-store';
import {
  useGamification,
  useQuests,
  useRecentSessions,
  useTriggerRecalibration,
} from '@/lib/hooks';
import {
  getRankColor,
  getXPProgressInRank,
  isStreakActive,
  getRelativeTime,
  formatDuration,
} from '@/lib/utils';
import { RANK_ORDER, RANK_XP_THRESHOLDS, type HunterRank } from '@/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, activeProgram } = useAppStore();
  const { data: gamification, isLoading: gamLoading } = useGamification();
  const { data: quests = [] } = useQuests();
  const { data: recentSessions = [] } = useRecentSessions(5);
  const triggerRecalibration = useTriggerRecalibration();

  // ── Detect missed days for auto-recalibration ──
  useEffect(() => {
    if (!activeProgram || !gamification?.last_workout_date) return;
    const lastDate = new Date(gamification.last_workout_date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 3) {
      triggerRecalibration.mutate();
    }
  }, [activeProgram, gamification?.last_workout_date]);

  // ── Compute today's workout index ──
  const todayWorkoutIndex = useMemo(() => {
    if (!activeProgram?.weekly_plan?.weeklyPlan) return null;
    const dow = new Date().getDay(); // 0=Sun
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[dow];
    const plan = activeProgram.weekly_plan.weeklyPlan;
    const idx = plan.findIndex((d) => d.day === todayName);
    if (idx !== -1) return idx;
    // Find next upcoming day
    for (let offset = 1; offset < 7; offset++) {
      const checkName = dayNames[(dow + offset) % 7];
      const i = plan.findIndex((d) => d.day === checkName);
      if (i !== -1) return i;
    }
    return 0;
  }, [activeProgram]);

  const rank = gamification?.current_rank ?? 'E';
  const xpTotal = gamification?.xp_total ?? 0;
  const streakCount = gamification?.streak_count ?? 0;
  const streakActive = isStreakActive(gamification?.last_workout_date ?? null);
  const xpProgress = getXPProgressInRank(xpTotal);
  const rankColor = getRankColor(rank);

  const dailyQuest = quests.find((q) => q.type === 'daily');

  if (gamLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator color="#A78BFA" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between mt-4 mb-6">
          <View>
            <Text className="text-text-secondary text-sm">Welcome back</Text>
            <Text className="text-text-primary text-2xl font-bold">
              {profile?.full_name?.split(' ')[0] ?? 'Hunter'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            className="w-10 h-10 rounded-full bg-bg-card items-center justify-center"
          >
            <Ionicons name="person" size={20} color="#A78BFA" />
          </Pressable>
        </View>

        {/* ── Rank Badge ── */}
        <View className="bg-bg-card rounded-2xl p-5 mb-4">
          <View className="flex-row items-center mb-3">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: rankColor + '20' }}
            >
              <Text className="text-lg font-bold" style={{ color: rankColor }}>
                {rank}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-semibold text-base">
                Rank {rank}
              </Text>
              <Text className="text-text-secondary text-xs">
                {xpTotal.toLocaleString()} XP total
              </Text>
            </View>
            {/* Streak */}
            <View className="items-center">
              <View className="flex-row items-center">
                <Ionicons
                  name="flame"
                  size={20}
                  color={streakActive ? '#F97316' : '#6B7280'}
                />
                <Text
                  className="text-lg font-bold ml-1"
                  style={{ color: streakActive ? '#F97316' : '#6B7280' }}
                >
                  {streakCount}
                </Text>
              </View>
              <Text className="text-text-secondary text-xs">streak</Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${xpProgress.percentage}%`,
                backgroundColor: rankColor,
              }}
            />
          </View>
          <Text className="text-text-secondary text-xs mt-1">
            {xpProgress.needed > 0
              ? `${xpProgress.current.toLocaleString()} / ${xpProgress.needed.toLocaleString()} XP to next rank`
              : 'Max rank achieved!'}
          </Text>
        </View>

        {/* ── Start Training ── */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (activeProgram && todayWorkoutIndex !== null) {
              router.push(`/workout/${todayWorkoutIndex}`);
            } else {
              router.push('/(tabs)/workout');
            }
          }}
          className="bg-accent-purple rounded-2xl p-5 mb-4 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-white font-bold text-lg">Start Training</Text>
            {activeProgram && todayWorkoutIndex !== null && (
              <Text className="text-white/70 text-sm mt-0.5">
                {activeProgram.weekly_plan.weeklyPlan[todayWorkoutIndex]?.day} —{' '}
                {activeProgram.weekly_plan.weeklyPlan[todayWorkoutIndex]?.focus}
              </Text>
            )}
          </View>
          <Ionicons name="play-circle" size={32} color="white" />
        </Pressable>

        {/* ── Daily Quest ── */}
        {dailyQuest && (
          <View className="bg-bg-card rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="compass" size={18} color="#F59E0B" />
              <Text className="text-accent-gold font-semibold ml-2 text-sm">
                Daily Quest
              </Text>
            </View>
            <Text className="text-text-primary font-medium">{dailyQuest.title}</Text>
            <Text className="text-text-secondary text-xs mt-1">
              {dailyQuest.description}
            </Text>
            <View className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mt-3">
              <View
                className="h-full bg-accent-gold rounded-full"
                style={{ width: `${Math.min(100, (dailyQuest.current_value / dailyQuest.target_value) * 100)}%` }}
              />
            </View>
            <Text className="text-text-secondary text-xs mt-1">
              {dailyQuest.current_value} / {dailyQuest.target_value} · +{dailyQuest.xp_reward} XP
            </Text>
          </View>
        )}

        {/* ── Quick Stats ── */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
            <Text className="text-text-secondary text-xs mb-1">This Week</Text>
            <Text className="text-text-primary text-2xl font-bold">
              {recentSessions.filter((s) => {
                const d = new Date(s.started_at);
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return d >= weekAgo && s.status === 'completed';
              }).length}
            </Text>
            <Text className="text-text-secondary text-xs">workouts</Text>
          </View>
          <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
            <Text className="text-text-secondary text-xs mb-1">Quests Done</Text>
            <Text className="text-text-primary text-2xl font-bold">
              {gamification?.quests_completed ?? 0}
            </Text>
            <Text className="text-text-secondary text-xs">completed</Text>
          </View>
          <View className="flex-1 bg-bg-card rounded-2xl p-4 items-center">
            <Text className="text-text-secondary text-xs mb-1">Achievements</Text>
            <Text className="text-text-primary text-2xl font-bold">
              {gamification?.achievements_unlocked ?? 0}
            </Text>
            <Text className="text-text-secondary text-xs">unlocked</Text>
          </View>
        </View>

        {/* ── Recent Activity ── */}
        <View className="mb-8">
          <Text className="text-text-primary font-semibold text-base mb-3">
            Recent Activity
          </Text>
          {recentSessions.length === 0 ? (
            <View className="bg-bg-card rounded-2xl p-4 items-center">
              <Ionicons name="barbell-outline" size={32} color="#6B7280" />
              <Text className="text-text-secondary text-sm mt-2">
                No workouts yet — start your first session!
              </Text>
            </View>
          ) : (
            recentSessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/workout/session/${session.id}`);
                }}
                className="bg-bg-card rounded-xl p-4 mb-2 flex-row items-center"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: session.status === 'completed' ? '#10B98120' : '#6B728020' }}
                >
                  <Ionicons
                    name={session.status === 'completed' ? 'checkmark-circle' : 'time'}
                    size={20}
                    color={session.status === 'completed' ? '#10B981' : '#6B7280'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-medium">
                    {session.name ?? session.focus ?? 'Workout'}
                  </Text>
                  <Text className="text-text-secondary text-xs">
                    {getRelativeTime(session.started_at)}
                    {session.duration_minutes ? ` · ${formatDuration(session.duration_minutes * 60)}` : ''}
                    {session.xp_earned ? ` · +${session.xp_earned} XP` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

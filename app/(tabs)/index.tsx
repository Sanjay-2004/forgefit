import {
  View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/stores/user-store';
import { useChallengeStore } from '@/stores/challenge-store';
import { useDailyLogStore } from '@/stores/daily-log-store';
import { RankBadge } from '@/components/ui/RankBadge';
import { XPBar } from '@/components/ui/XPBar';
import { QuestItem } from '@/components/ui/QuestItem';
import { WaterTracker } from '@/components/ui/WaterTracker';
import { BonusChallengeCard } from '@/components/ui/BonusChallenge';
import { DayCounter } from '@/components/ui/DayCounter';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { XPGainToast } from '@/components/gamification/animations';
import { getToday, toggleTarget, updateWater, uploadPhoto } from '@/api/daily-log';
import { generateBonusChallenges, completeBonusChallenge } from '@/api/bonus-challenges';
import { getDayNumber, toLocalDateString } from '@/lib/utils';
import { getRankColor } from '@/lib/utils';

export default function DashboardScreen() {
  const router = useRouter();
  const { level, totalXP, rank, addXP, setUser } = useUserStore();
  const { challenge } = useChallengeStore();
  const { log, setLog, optimisticToggleTarget, optimisticSetWater, setPhotoUrl, isLoading, setLoading } = useDailyLogStore();

  const [refreshing, setRefreshing] = useState(false);
  const [generatingGate, setGeneratingGate] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<{ visible: boolean; amount: number }>({ visible: false, amount: 0 });
  const [celebrateAll, setCelebrateAll] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const dayNumber = challenge ? getDayNumber(challenge.startDate) : 1;

  async function fetchLog() {
    if (!challenge) return;
    setLoading(true);
    try {
      const l = await getToday();
      setLog(l);
    } catch (err: any) {
      console.error('fetchLog:', err);
      // Offline: drop a persisted log that belongs to a previous day
      const cached = useDailyLogStore.getState().log;
      if (cached && cached.date !== toLocalDateString()) setLog(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLog(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLog();
    setRefreshing(false);
  }, [challenge]);

  async function handleToggle(targetId: string) {
    if (!log || togglingId) return;
    setTogglingId(targetId);
    optimisticToggleTarget(targetId);
    try {
      const result = await toggleTarget(log._id, targetId);
      const target = challenge?.dailyTargets.find((t) => t._id === targetId);
      const wasJustCompleted = result.log.targetsCompleted.find((t) => t.targetId === targetId)?.completed;

      setLog(result.log);
      setUser({ totalXP: result.newXP, level: result.newLevel, rank: result.newRank });
      addXP(0); // force re-render via store

      if (wasJustCompleted && (target?.xpValue ?? 0) > 0) {
        setXpToast({ visible: true, amount: target?.xpValue ?? 0 });
      }

      if (result.leveledUp) {
        setTimeout(() => router.push(`/level-up?level=${result.newLevel}&rank=${result.newRank}` as any), 600);
      }

      if (result.log.allCompleted && !celebrateAll) {
        setCelebrateAll(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setCelebrateAll(false), 3000);
      }
    } catch (err: any) {
      optimisticToggleTarget(targetId); // revert
      Alert.alert('Error', err?.message ?? 'Could not update quest');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleWaterUpdate(liters: number) {
    if (!log) return;
    optimisticSetWater(liters);
    try {
      const updated = await updateWater(log._id, liters);
      setLog(updated);
    } catch { /* silent — optimistic already applied */ }
  }

  async function handlePhotoUpload(url: string) {
    if (!log) return;
    setPhotoUrl(url);
    try {
      const updated = await uploadPhoto(log._id, url);
      setLog(updated);
    } catch { /* silent */ }
  }

  async function handleGenerateGate() {
    if (!log) return;
    setGeneratingGate(true);
    try {
      const updated = await generateBonusChallenges(log._id);
      setLog(updated);
    } catch (err: any) {
      Alert.alert('Gate Sealed', err?.message ?? 'Could not open the daily gate');
    } finally {
      setGeneratingGate(false);
    }
  }

  async function handleCompleteBonus(challengeId: string) {
    if (!log) return;
    setCompletingId(challengeId);
    try {
      const result = await completeBonusChallenge(log._id, challengeId);
      setLog(result.log);
      setUser({ totalXP: result.newXP, level: result.newLevel, rank: result.newRank });
      const bonus = result.log.bonusChallenges.find((b: any) => b._id === challengeId);
      if (bonus) setXpToast({ visible: true, amount: bonus.xpValue });
      if (result.leveledUp) {
        setTimeout(() => router.push(`/level-up?level=${result.newLevel}&rank=${result.newRank}` as any), 600);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not complete bonus quest');
    } finally {
      setCompletingId(null);
    }
  }

  if (!challenge || (isLoading && !log)) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#00f0ff" />
        <Text className="text-text-secondary text-xs mt-3 tracking-widest uppercase">Loading Quests...</Text>
      </View>
    );
  }

  const rankColor = getRankColor(rank);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      {/* All-Complete Celebration */}
      {celebrateAll && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="absolute top-0 left-0 right-0 z-50 bg-accent-purple px-6 py-3 items-center"
        >
          <Text className="text-white font-bold tracking-widest">⚡ ALL QUESTS COMPLETE! ⚡</Text>
        </MotiView>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00f0ff" />}
      >
        {/* ── Header ── */}
        <LinearGradient colors={['#0f0f2e', '#0A0A1A']} className="px-5 pt-4 pb-5">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 mr-4">
              <RankBadge rank={rank} size="md" />
              <Text className="text-text-primary font-bold text-lg mt-2 tracking-wider">
                System Active
              </Text>
              <Text className="text-text-secondary text-xs tracking-widest">Daily Quest Board</Text>
            </View>
            <DayCounter dayNumber={dayNumber} totalDays={challenge.durationDays} />
          </View>
          <XPBar totalXP={totalXP} rank={rank} level={level} />
        </LinearGradient>

        <View className="px-5 pt-5 pb-24">
          {/* ── Daily Quests ── */}
          <View className="flex-row items-center mb-4">
            <Text className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase mr-2">⚔️</Text>
            <Text className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase">Daily Quests</Text>
            {log && (
              <Text className="text-text-muted text-xs ml-auto">
                {log.targetsCompleted.filter((t) => t.completed).length} / {log.targetsCompleted.length}
              </Text>
            )}
          </View>

          {log?.targetsCompleted.map((target) => {
            const def = challenge.dailyTargets.find((t) => t._id === target.targetId);
            return (
              <QuestItem
                key={target.targetId}
                target={target}
                xpValue={def?.xpValue ?? 0}
                onToggle={() => handleToggle(target.targetId)}
                disabled={togglingId === target.targetId}
              />
            );
          })}

          {/* XP Today summary */}
          {log && log.totalXPEarnedToday > 0 && (
            <View className="flex-row justify-end mt-1 mb-4">
              <Text className="text-accent-purple text-xs font-semibold">
                +{log.totalXPEarnedToday} XP earned today
              </Text>
            </View>
          )}

          {/* ── Hydration ── */}
          <View className="bg-bg-secondary rounded-2xl p-4 border border-bg-tertiary mb-5 mt-2">
            <Text className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase mb-4">
              💧 Hydration
            </Text>
            <WaterTracker
              current={log?.waterIntake ?? 0}
              target={challenge.waterTarget}
              onUpdate={handleWaterUpdate}
            />
          </View>

          {/* ── Progress Photo ── */}
          <View className="mb-5">
            <Text className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase mb-3">📸 Progress Photo</Text>
            <PhotoUpload
              currentUrl={log?.progressPhotoUrl}
              onUpload={handlePhotoUpload}
            />
          </View>

          {/* ── Daily Gate (Bonus Challenges) ── */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase">⚡ Daily Gate</Text>
                <Text className="text-text-muted text-xs mt-0.5">AI-generated side quests</Text>
              </View>
              {(!log?.bonusChallenges || log.bonusChallenges.length === 0) && (
                <Pressable
                  onPress={handleGenerateGate}
                  disabled={generatingGate}
                  className="bg-neon-cyan/10 rounded-xl px-4 py-2 border border-neon-cyan/30 active:opacity-70"
                >
                  {generatingGate ? (
                    <ActivityIndicator size="small" color="#00f0ff" />
                  ) : (
                    <Text className="text-neon-cyan text-xs font-bold tracking-wider">OPEN GATE</Text>
                  )}
                </Pressable>
              )}
            </View>

            {log?.bonusChallenges?.map((bc) => (
              <BonusChallengeCard
                key={bc._id}
                challenge={bc}
                onComplete={() => handleCompleteBonus(bc._id)}
                completing={completingId === bc._id}
              />
            ))}

            {!log?.bonusChallenges?.length && !generatingGate && (
              <View className="bg-bg-secondary rounded-2xl p-5 border border-dashed border-neon-cyan/20 items-center">
                <Text className="text-text-muted text-sm text-center">
                  The gate is sealed.{'\n'}Open it to reveal today's bonus quests.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* XP toast */}
      <XPGainToast
        amount={xpToast.amount}
        visible={xpToast.visible}
        onDismiss={() => setXpToast((s) => ({ ...s, visible: false }))}
      />
    </SafeAreaView>
  );
}

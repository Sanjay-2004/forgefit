import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSessionLogs, useRecentSessions } from '@/lib/hooks';
import { formatDuration, formatWeight } from '@/lib/utils';
import type { ExerciseLog } from '@/types';

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { data: logs, isLoading: logsLoading } = useSessionLogs(sessionId);
  const { data: sessions = [] } = useRecentSessions(50);

  const session = sessions.find((s) => s.id === sessionId);

  // Group logs by exercise name
  const exerciseGroups = useMemo(() => {
    if (!logs) return [];
    const map = new Map<string, ExerciseLog[]>();
    for (const log of logs) {
      const key = log.exercise_name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    return Array.from(map.entries()).map(([name, sets]) => ({ name, sets }));
  }, [logs]);

  // Totals
  const totalVolume = useMemo(() => {
    if (!logs) return 0;
    return logs.reduce((sum, l) => {
      if (l.is_completed && l.weight_kg && l.reps) {
        return sum + l.weight_kg * l.reps;
      }
      return sum;
    }, 0);
  }, [logs]);

  const totalSets = logs?.filter((l) => l.is_completed).length ?? 0;

  if (logsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator color="#A78BFA" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-bg-card">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#E5E7EB" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text-primary font-bold text-lg" numberOfLines={1}>
            {session?.name ?? session?.focus ?? 'Workout Session'}
          </Text>
          {session?.started_at && (
            <Text className="text-text-secondary text-xs">
              {new Date(session.started_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* ── Summary Cards ── */}
        <View className="flex-row gap-3 mt-4 mb-4">
          <View className="flex-1 bg-bg-card rounded-xl p-3 items-center">
            <Text className="text-text-secondary text-xs">Duration</Text>
            <Text className="text-text-primary text-lg font-bold">
              {session?.duration_minutes
                ? formatDuration(session.duration_minutes * 60)
                : '—'}
            </Text>
          </View>
          <View className="flex-1 bg-bg-card rounded-xl p-3 items-center">
            <Text className="text-text-secondary text-xs">Sets</Text>
            <Text className="text-text-primary text-lg font-bold">{totalSets}</Text>
          </View>
          <View className="flex-1 bg-bg-card rounded-xl p-3 items-center">
            <Text className="text-text-secondary text-xs">Volume</Text>
            <Text className="text-text-primary text-lg font-bold">
              {formatWeight(totalVolume)}
            </Text>
          </View>
          {session?.xp_earned ? (
            <View className="flex-1 bg-bg-card rounded-xl p-3 items-center">
              <Text className="text-text-secondary text-xs">XP</Text>
              <Text className="text-accent-purple text-lg font-bold">
                +{session.xp_earned}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Exercise Breakdown ── */}
        {exerciseGroups.length === 0 ? (
          <View className="bg-bg-card rounded-xl p-6 items-center mt-4">
            <Ionicons name="barbell-outline" size={32} color="#6B7280" />
            <Text className="text-text-secondary mt-2">No exercise data recorded</Text>
          </View>
        ) : (
          exerciseGroups.map(({ name, sets }) => (
            <View key={name} className="bg-bg-card rounded-xl p-4 mb-3">
              <Text className="text-text-primary font-semibold text-base mb-2">
                {name}
              </Text>

              {/* Table Header */}
              <View className="flex-row mb-1 pb-1 border-b border-bg-tertiary">
                <Text className="text-text-secondary text-xs w-10">Set</Text>
                <Text className="text-text-secondary text-xs flex-1 text-center">
                  Weight
                </Text>
                <Text className="text-text-secondary text-xs flex-1 text-center">
                  Reps
                </Text>
                <Text className="text-text-secondary text-xs flex-1 text-center">
                  RPE
                </Text>
              </View>

              {/* Set Rows */}
              {sets.map((set, i) => (
                <View
                  key={set.id}
                  className={`flex-row py-1.5 ${
                    i < sets.length - 1 ? 'border-b border-bg-tertiary/30' : ''
                  }`}
                >
                  <Text className="text-text-secondary text-sm w-10">
                    {set.is_warmup ? 'W' : set.set_number}
                  </Text>
                  <Text className="text-text-primary text-sm flex-1 text-center">
                    {set.weight_kg != null ? `${set.weight_kg} kg` : '—'}
                  </Text>
                  <Text className="text-text-primary text-sm flex-1 text-center">
                    {set.reps ?? '—'}
                  </Text>
                  <Text className="text-text-primary text-sm flex-1 text-center">
                    {set.rpe ?? '—'}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}

        {/* ── Notes / Mood ── */}
        {(session?.notes || session?.mood) && (
          <View className="bg-bg-card rounded-xl p-4 mb-6">
            {session?.mood && (
              <View className="flex-row items-center mb-2">
                <Text className="text-text-secondary text-sm mr-2">Mood:</Text>
                <Text className="text-text-primary text-sm capitalize">
                  {session.mood}
                </Text>
              </View>
            )}
            {session?.notes && (
              <Text className="text-text-secondary text-sm">{session.notes}</Text>
            )}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

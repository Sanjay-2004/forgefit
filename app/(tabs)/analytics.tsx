import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/app-store';
import { usePersonalRecords, useRecentSessions } from '@/lib/hooks';
import { MuscleMap } from '@/components/muscle-map/muscle-map';
import { ProgressPhotosView } from '@/components/progress/progress-photos';

export default function AnalyticsScreen() {
  const { gamification } = useAppStore();
  const xp = gamification?.xp_total ?? 0;
  const { data: personalRecords = [] } = usePersonalRecords();
  const { data: recentSessions = [] } = useRecentSessions(7);

  // Calculate weekly volume from recent sessions
  const thisWeekSessions = recentSessions.filter((s) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(s.started_at ?? s.created_at) > weekAgo;
  });

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mt-4 mb-6">
          <Text className="text-text-muted text-sm uppercase tracking-widest">
            📊 Analytics
          </Text>
          <Text className="text-text-primary text-2xl font-bold mt-1">
            Performance Stats
          </Text>
        </View>

        {/* Stats Overview */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-bg-card rounded-2xl p-4">
            <Text className="text-accent-gold font-bold text-xl">
              {xp.toLocaleString()}
            </Text>
            <Text className="text-text-muted text-xs mt-1">Total XP</Text>
          </View>
          <View className="flex-1 bg-bg-card rounded-2xl p-4">
            <Text className="text-accent-emerald font-bold text-xl">
              {thisWeekSessions.length}
            </Text>
            <Text className="text-text-muted text-xs mt-1">This Week</Text>
          </View>
        </View>

        {/* Muscle Map */}
        <View className="bg-bg-card rounded-2xl p-5 mb-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-4">
            Muscle Group Map
          </Text>
          <MuscleMap size="large" />
        </View>

        {/* Personal Records */}
        <View className="bg-bg-card rounded-2xl p-5 mb-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-4">
            Personal Records
          </Text>
          {personalRecords.length > 0 ? (
            personalRecords.slice(0, 5).map((pr) => (
              <View key={pr.id} className="flex-row items-center justify-between py-3 border-b border-bg-tertiary">
                <View>
                  <Text className="text-text-primary font-semibold">{pr.exercise_name}</Text>
                  <Text className="text-text-muted text-xs">
                    {new Date(pr.achieved_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text className="text-accent-gold font-bold">
                  {pr.record_type === 'weight' ? `${pr.value}kg` : `${pr.value} ${pr.record_type}`}
                </Text>
              </View>
            ))
          ) : (
            <View className="items-center py-8">
              <Ionicons name="trophy-outline" size={48} color="#64748B" />
              <Text className="text-text-secondary text-sm mt-3 text-center">
                PRs will appear here as you train
              </Text>
            </View>
          )}
        </View>

        {/* Progress Photos */}
        <View className="bg-bg-card rounded-2xl p-5 mb-8">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-4">
            Progress Photos
          </Text>
          <ProgressPhotosView />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

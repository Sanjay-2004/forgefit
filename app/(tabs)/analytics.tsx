import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/app-store';

export default function AnalyticsScreen() {
  const { gamification } = useAppStore();
  const xp = gamification?.xp_total ?? 0;

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
              {gamification?.quests_completed ?? 0}
            </Text>
            <Text className="text-text-muted text-xs mt-1">Workouts</Text>
          </View>
        </View>

        {/* Weekly Volume Chart Placeholder */}
        <View className="bg-bg-card rounded-2xl p-5 mb-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-4">
            Weekly Volume
          </Text>
          <View className="items-center py-12">
            <Ionicons name="bar-chart-outline" size={48} color="#64748B" />
            <Text className="text-text-secondary text-sm mt-3 text-center">
              Complete workouts to see{'\n'}volume trends here
            </Text>
          </View>
        </View>

        {/* Muscle Map Placeholder */}
        <View className="bg-bg-card rounded-2xl p-5 mb-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-4">
            Muscle Group Ranks
          </Text>
          <View className="items-center py-12">
            <Ionicons name="body-outline" size={48} color="#64748B" />
            <Text className="text-text-secondary text-sm mt-3 text-center">
              Train muscles to level them up{'\n'}from E rank to Monarch
            </Text>
          </View>
        </View>

        {/* Personal Records */}
        <View className="bg-bg-card rounded-2xl p-5 mb-8">
          <Text className="text-text-muted text-xs uppercase tracking-widest font-bold mb-4">
            Personal Records
          </Text>
          <View className="items-center py-8">
            <Ionicons name="trophy-outline" size={48} color="#64748B" />
            <Text className="text-text-secondary text-sm mt-3 text-center">
              PRs will appear here as you train
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

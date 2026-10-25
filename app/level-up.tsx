import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RankBadge } from '@/components/ui/RankBadge';
import { getRankColor } from '@/lib/utils';
import type { HunterRank } from '@/types';

export default function LevelUpScreen() {
  const router = useRouter();
  const { level, rank } = useLocalSearchParams<{ level: string; rank: string }>();
  const rankKey = (rank ?? 'E') as HunterRank;
  const rankColor = getRankColor(rankKey);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
  }, []);

  return (
    <LinearGradient
      colors={['#050510', '#0A0A1A', '#0f0f2e']}
      className="flex-1 items-center justify-center"
    >
      {/* Outer glow ring */}
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.15, scale: 2.2 }}
        transition={{ type: 'timing', duration: 1200 }}
        className="absolute w-64 h-64 rounded-full"
        style={{ backgroundColor: rankColor }}
      />

      {/* Main content */}
      <MotiView
        from={{ opacity: 0, translateY: 40 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 14, delay: 200 }}
        className="items-center px-8"
      >
        <MotiView
          from={{ scale: 0.3, rotate: '-20deg' }}
          animate={{ scale: 1, rotate: '0deg' }}
          transition={{ type: 'spring', damping: 10, delay: 400 }}
        >
          <Text className="text-8xl mb-4">⚡</Text>
        </MotiView>

        <Text className="text-neon-cyan text-xs font-bold tracking-[0.5em] uppercase mb-2">
          Level Up!
        </Text>

        <Text className="text-text-primary text-7xl font-bold tracking-tighter mb-2">
          {level}
        </Text>

        <Text className="text-text-secondary text-base mb-6">You have grown stronger</Text>

        <RankBadge rank={rankKey} size="lg" showTitle />

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 800 }}
          className="mt-8 bg-bg-secondary/60 rounded-2xl px-6 py-4 border border-neon-cyan/20"
        >
          <Text className="text-text-secondary text-sm text-center leading-6 italic">
            "Only the strong survive.{'\n'}Keep pushing, Hunter."
          </Text>
        </MotiView>
      </MotiView>

      {/* Continue button */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 1000 }}
        className="absolute bottom-16 left-6 right-6"
      >
        <Pressable
          onPress={() => router.back()}
          className="rounded-2xl py-4 items-center active:opacity-80"
          style={{ backgroundColor: rankColor }}
        >
          <Text className="text-white font-bold text-base tracking-widest uppercase">Continue ⚔️</Text>
        </Pressable>
      </MotiView>
    </LinearGradient>
  );
}

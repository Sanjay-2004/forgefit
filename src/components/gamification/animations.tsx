import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { HunterRank } from '@/types';
import { getRankColor } from '@/lib/utils';

interface XPGainProps {
  amount: number;
  visible: boolean;
  onDismiss: () => void;
}

export function XPGainToast({ amount, visible, onDismiss }: XPGainProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });
      // Auto dismiss after 2s
      const timer = setTimeout(onDismiss, 2000);
      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute bottom-28 left-0 right-0 items-center z-50"
    >
      <View className="bg-accent-gold/20 border border-accent-gold/50 rounded-2xl px-6 py-3 flex-row items-center">
        <Text className="text-accent-gold text-lg font-bold">+{amount} XP</Text>
      </View>
    </Animated.View>
  );
}

interface RankUpProps {
  newRank: HunterRank;
  visible: boolean;
  onDismiss: () => void;
}

export function RankUpCelebration({ newRank, visible, onDismiss }: RankUpProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rankColor = getRankColor(newRank);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const rankStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={containerStyle}
      className="absolute inset-0 bg-black/80 items-center justify-center z-50"
    >
      <View className="items-center px-8">
        {/* System message style */}
        <View className="bg-bg-secondary/90 border border-accent-purple/50 rounded-2xl p-8 items-center w-full">
          <Text className="text-accent-blue text-xs uppercase tracking-[4px] mb-4">
            — SYSTEM NOTIFICATION —
          </Text>

          <Text className="text-text-primary text-lg font-bold mb-6">
            You have leveled up.
          </Text>

          <Animated.View
            style={rankStyle}
            className="items-center justify-center rounded-full mb-6"
          >
            <View
              className="w-28 h-28 rounded-full items-center justify-center"
              style={{
                borderWidth: 3,
                borderColor: rankColor,
                shadowColor: rankColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 20,
              }}
            >
              <Text className="text-4xl font-bold" style={{ color: rankColor }}>
                {newRank}
              </Text>
            </View>
          </Animated.View>

          <Text className="text-text-primary text-xl font-bold mb-1">
            Rank {newRank} Hunter
          </Text>
          <Text className="text-text-secondary text-sm text-center mb-6">
            Your power continues to grow. Keep training to reach the next level.
          </Text>

          <Pressable
            onPress={onDismiss}
            className="bg-accent-purple rounded-xl py-3 px-8 active:opacity-80"
          >
            <Text className="text-white font-bold text-base">Continue</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

interface StreakFlameAnimatedProps {
  count: number;
  isActive: boolean;
}

export function StreakFlameAnimated({ count, isActive }: StreakFlameAnimatedProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive && count > 0) {
      // Pulse animation based on streak length
      const intensity = Math.min(count / 30, 1);
      scale.value = withSequence(
        withSpring(1 + intensity * 0.15, { damping: 4 }),
        withSpring(1, { damping: 8 })
      );
    }
  }, [count, isActive]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={flameStyle} className="items-center">
      <Text className="text-4xl">{isActive ? '🔥' : '💀'}</Text>
      <Text className="text-text-primary font-bold text-xl mt-1">{count}</Text>
      <Text className="text-text-muted text-xs">
        {isActive ? 'day streak' : 'streak lost'}
      </Text>
    </Animated.View>
  );
}

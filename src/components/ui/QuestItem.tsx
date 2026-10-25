import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import type { TargetLog } from '@/types';

interface QuestItemProps {
  target: TargetLog;
  xpValue: number;
  onToggle: () => void;
  disabled?: boolean;
}

export function QuestItem({ target, xpValue, onToggle, disabled = false }: QuestItemProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(target.completed ? 0.6 : 1);

  useEffect(() => {
    opacity.value = withTiming(target.completed ? 0.65 : 1, { duration: 200 });
  }, [target.completed]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  function handlePress() {
    if (disabled) return;
    scale.value = withSpring(0.96, { damping: 10 }, () => { scale.value = withSpring(1); });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  }

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={animStyle}
        className={`flex-row items-center bg-bg-secondary rounded-xl px-4 py-3.5 mb-2 border ${
          target.completed ? 'border-accent-purple/40' : 'border-bg-tertiary'
        }`}
      >
        {/* Checkbox */}
        <View
          className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${
            target.completed ? 'bg-accent-purple border-accent-purple' : 'border-text-muted'
          }`}
        >
          {target.completed && <Text className="text-white text-xs font-bold">✓</Text>}
        </View>

        {/* Name */}
        <Text
          className={`flex-1 text-sm font-medium ${
            target.completed ? 'line-through text-text-muted' : 'text-text-primary'
          }`}
        >
          {target.name}
        </Text>

        {/* XP chip */}
        <View className={`rounded-lg px-2 py-0.5 ${target.completed ? 'bg-accent-purple/20' : 'bg-bg-primary'}`}>
          <Text className={`text-xs font-bold ${target.completed ? 'text-accent-purple' : 'text-text-muted'}`}>
            +{xpValue} XP
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

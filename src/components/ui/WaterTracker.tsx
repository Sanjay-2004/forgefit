import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

interface WaterTrackerProps {
  current: number;     // litres
  target: 3 | 4;
  onUpdate: (liters: number) => void;
  disabled?: boolean;
}

const GLASS_ML = 250;  // each tap = 250ml

export function WaterTracker({ current, target, onUpdate, disabled = false }: WaterTrackerProps) {
  const totalGlasses = (target * 1000) / GLASS_ML;
  const filledGlasses = Math.round((current * 1000) / GLASS_ML);

  function tap() {
    if (disabled) return;
    const next = Math.min(target, current + GLASS_ML / 1000);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(Math.round(next * 1000) / 1000);
  }

  function tapHold() {
    if (disabled) return;
    const prev = Math.max(0, current - GLASS_ML / 1000);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(Math.round(prev * 1000) / 1000);
  }

  const percentage = Math.min(100, (current / target) * 100);

  return (
    <View>
      {/* Progress bar */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-neon-cyan font-bold text-lg">{current.toFixed(1)}L</Text>
        <Text className="text-text-muted text-sm">/ {target}L target</Text>
      </View>
      <View className="h-2 bg-bg-secondary rounded-full overflow-hidden mb-4">
        <View
          className="h-full rounded-full bg-neon-cyan"
          style={{ width: `${percentage}%` }}
        />
      </View>

      {/* Glasses grid */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        {Array.from({ length: totalGlasses }).map((_, i) => (
          <Pressable
            key={i}
            onPress={tap}
            onLongPress={tapHold}
            disabled={disabled}
            className="active:opacity-70"
          >
            <Text className={`text-2xl ${i < filledGlasses ? 'opacity-100' : 'opacity-30'}`}>
              💧
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-text-muted text-xs text-center">
        Tap to add · Hold to remove · {filledGlasses} of {totalGlasses} glasses
      </Text>
    </View>
  );
}

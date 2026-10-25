import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import type { HunterRank } from '@/types';
import { getXPProgressInRank } from '@/lib/utils';
import { getRankColor } from '@/lib/utils';

interface XPBarProps {
  totalXP: number;
  rank: HunterRank;
  level: number;
}

export function XPBar({ totalXP, rank, level }: XPBarProps) {
  const { current, needed, percentage } = getXPProgressInRank(totalXP);
  const color = getRankColor(rank);

  return (
    <View className="w-full">
      <View className="flex-row justify-between items-center mb-1.5">
        <Text className="text-text-secondary text-xs font-medium">
          Level <Text className="text-text-primary font-bold">{level}</Text>
        </Text>
        <Text className="text-text-secondary text-xs">
          {current.toLocaleString()} / {needed > 0 ? needed.toLocaleString() : '∞'} XP to next rank
        </Text>
      </View>
      <View className="h-2.5 bg-bg-secondary rounded-full overflow-hidden border border-bg-tertiary">
        <MotiView
          animate={{ width: `${percentage}%` as any }}
          transition={{ type: 'timing', duration: 600 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </View>
      <Text className="text-text-muted text-xs mt-1 text-right">
        {totalXP.toLocaleString()} total XP
      </Text>
    </View>
  );
}

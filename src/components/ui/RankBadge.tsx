import { View, Text } from 'react-native';
import type { HunterRank } from '@/types';
import { RANK_TITLES } from '@/types';
import { getRankColor } from '@/lib/utils';

interface RankBadgeProps {
  rank: HunterRank;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
}

export function RankBadge({ rank, size = 'md', showTitle = false }: RankBadgeProps) {
  const color = getRankColor(rank);
  const sizes = { sm: 'px-2 py-0.5', md: 'px-3 py-1', lg: 'px-4 py-2' };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <View className="items-start">
      <View
        className={`rounded-lg border ${sizes[size]}`}
        style={{ borderColor: color, backgroundColor: `${color}18` }}
      >
        <Text
          className={`font-bold tracking-widest uppercase ${textSizes[size]}`}
          style={{ color }}
        >
          {rank}-RANK
        </Text>
      </View>
      {showTitle && (
        <Text className="text-text-muted text-xs mt-1" style={{ color }}>
          {RANK_TITLES[rank]}
        </Text>
      )}
    </View>
  );
}

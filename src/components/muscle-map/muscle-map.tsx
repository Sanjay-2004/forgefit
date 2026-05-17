import { View, Text } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import type { MuscleGroup, HunterRank } from '@/types';
import { getRankColor } from '@/lib/utils';

interface MuscleMapProps {
  muscleRanks?: Partial<Record<MuscleGroup, HunterRank>>;
  highlightedMuscles?: MuscleGroup[];
  size?: 'small' | 'large';
  onMusclePress?: (muscle: MuscleGroup) => void;
}

const DEFAULT = '#1F1F3A';
const STROKE = '#3A3A5A';
const SKIN = '#2A2A4A';

// Anatomical muscle group overlays on an athletic male silhouette
// viewBox: 200 x 280
const MUSCLES: Record<string, { d: string; muscles: MuscleGroup[] }> = {
  traps: {
    d: 'M82,52 Q100,46 118,52 L114,62 Q100,58 86,62 Z',
    muscles: ['traps'],
  },
  chestL: {
    d: 'M76,68 Q98,62 100,64 L100,98 Q88,102 76,96 Q72,82 76,68 Z',
    muscles: ['chest'],
  },
  chestR: {
    d: 'M124,68 Q102,62 100,64 L100,98 Q112,102 124,96 Q128,82 124,68 Z',
    muscles: ['chest'],
  },
  frontDeltL: {
    d: 'M62,64 Q70,56 80,60 Q82,72 76,82 Q66,80 60,72 Z',
    muscles: ['front_delts', 'side_delts'],
  },
  frontDeltR: {
    d: 'M138,64 Q130,56 120,60 Q118,72 124,82 Q134,80 140,72 Z',
    muscles: ['front_delts', 'side_delts'],
  },
  bicepL: {
    d: 'M58,82 Q70,82 74,88 L70,116 Q60,116 54,110 Q52,96 58,82 Z',
    muscles: ['biceps'],
  },
  bicepR: {
    d: 'M142,82 Q130,82 126,88 L130,116 Q140,116 146,110 Q148,96 142,82 Z',
    muscles: ['biceps'],
  },
  forearmL: {
    d: 'M54,118 Q62,118 70,120 L68,150 Q60,152 52,148 Q48,134 54,118 Z',
    muscles: ['forearms'],
  },
  forearmR: {
    d: 'M146,118 Q138,118 130,120 L132,150 Q140,152 148,148 Q152,134 146,118 Z',
    muscles: ['forearms'],
  },
  abs: {
    d: 'M86,100 L114,100 L114,138 Q100,144 86,138 Z',
    muscles: ['abs'],
  },
  obliquesL: {
    d: 'M78,100 L86,100 L86,138 Q80,140 76,134 Z',
    muscles: ['obliques'],
  },
  obliquesR: {
    d: 'M122,100 L114,100 L114,138 Q120,140 124,134 Z',
    muscles: ['obliques'],
  },
  hipFlex: {
    d: 'M84,140 L116,140 L114,150 Q100,154 86,150 Z',
    muscles: ['hip_flexors'],
  },
  quadL: {
    d: 'M82,156 Q92,154 96,158 L94,206 Q86,210 78,204 Q76,180 82,156 Z',
    muscles: ['quads'],
  },
  quadR: {
    d: 'M118,156 Q108,154 104,158 L106,206 Q114,210 122,204 Q124,180 118,156 Z',
    muscles: ['quads'],
  },
  calfL: {
    d: 'M82,214 Q88,214 94,216 L92,254 Q86,256 80,252 Q78,232 82,214 Z',
    muscles: ['calves'],
  },
  calfR: {
    d: 'M118,214 Q112,214 106,216 L108,254 Q114,256 120,252 Q122,232 118,214 Z',
    muscles: ['calves'],
  },
};

function colorFor(
  muscles: MuscleGroup[],
  ranks?: Partial<Record<MuscleGroup, HunterRank>>,
  highlights?: MuscleGroup[],
): string {
  if (highlights?.length) {
    return muscles.some((m) => highlights.includes(m)) ? '#7C3AED' : DEFAULT;
  }
  if (ranks) {
    const found = muscles.map((m) => ranks[m]).find(Boolean);
    if (found) return getRankColor(found);
  }
  return DEFAULT;
}

export function MuscleMap({
  muscleRanks,
  highlightedMuscles,
  size = 'large',
  onMusclePress,
}: MuscleMapProps) {
  const width = size === 'large' ? 240 : 120;
  const height = size === 'large' ? 336 : 168;

  return (
    <View className="items-center">
      <Svg width={width} height={height} viewBox="0 0 200 280">
        {/* Head */}
        <Circle cx="100" cy="28" r="20" fill={SKIN} stroke={STROKE} strokeWidth={0.8} />
        {/* Neck */}
        <Path
          d="M92,46 Q100,52 108,46 L108,56 Q100,60 92,56 Z"
          fill={SKIN}
          stroke={STROKE}
          strokeWidth={0.8}
        />
        {/* Torso + legs silhouette */}
        <Path
          d="M70,60 Q100,52 130,60 L138,90 L134,150 L116,154 L116,212 L120,260 L108,262 L102,214 L98,214 L92,262 L80,260 L84,212 L84,154 L66,150 L62,90 Z"
          fill={SKIN}
          stroke={STROKE}
          strokeWidth={0.8}
        />
        {/* Arms silhouette */}
        <Path
          d="M62,68 Q54,80 50,108 L48,150 L56,152 L60,116 Q64,90 70,80 Z"
          fill={SKIN}
          stroke={STROKE}
          strokeWidth={0.8}
        />
        <Path
          d="M138,68 Q146,80 150,108 L152,150 L144,152 L140,116 Q136,90 130,80 Z"
          fill={SKIN}
          stroke={STROKE}
          strokeWidth={0.8}
        />

        {/* Muscle group overlays */}
        <G>
          {Object.entries(MUSCLES).map(([key, { d, muscles }]) => {
            const fill = colorFor(muscles, muscleRanks, highlightedMuscles);
            return (
              <Path
                key={key}
                d={d}
                fill={fill}
                stroke={STROKE}
                strokeWidth={0.4}
                opacity={0.92}
                onPress={() => onMusclePress?.(muscles[0])}
              />
            );
          })}
        </G>

        {/* Anatomical detail lines */}
        <Path d="M100,64 L100,98" stroke={STROKE} strokeWidth={0.6} opacity={0.6} />
        <Path d="M100,100 L100,138" stroke={STROKE} strokeWidth={0.6} opacity={0.7} />
        <Path d="M86,114 L114,114" stroke={STROKE} strokeWidth={0.5} opacity={0.5} />
        <Path d="M86,124 L114,124" stroke={STROKE} strokeWidth={0.5} opacity={0.5} />
      </Svg>

      {muscleRanks && size === 'large' && (
        <View className="flex-row flex-wrap justify-center mt-3 gap-2">
          {Object.entries(muscleRanks)
            .slice(0, 6)
            .map(([muscle, rank]) => (
              <View key={muscle} className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: getRankColor(rank) }}
                />
                <Text className="text-text-muted text-xs">{muscle.replace(/_/g, ' ')}</Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

export function MuscleMapMini({ highlightedMuscles }: { highlightedMuscles?: MuscleGroup[] }) {
  return <MuscleMap highlightedMuscles={highlightedMuscles} size="small" />;
}

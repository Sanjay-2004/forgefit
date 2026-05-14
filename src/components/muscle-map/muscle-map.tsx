import { View, Text, Pressable } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import type { MuscleGroup, HunterRank } from '@/types';
import { getRankColor } from '@/lib/utils';

interface MuscleMapProps {
  muscleRanks?: Partial<Record<MuscleGroup, HunterRank>>;
  highlightedMuscles?: MuscleGroup[];
  size?: 'small' | 'large';
  onMusclePress?: (muscle: MuscleGroup) => void;
}

// Simplified body outline with muscle group regions
const MUSCLE_PATHS: Record<string, { path: string; muscles: MuscleGroup[] }> = {
  // Front view - upper body
  chest: {
    path: 'M35,28 L45,28 L47,38 L33,38 Z',
    muscles: ['chest'],
  },
  leftShoulder: {
    path: 'M28,25 L35,25 L35,32 L28,30 Z',
    muscles: ['front_delts', 'side_delts'],
  },
  rightShoulder: {
    path: 'M45,25 L52,25 L52,30 L45,32 Z',
    muscles: ['front_delts', 'side_delts'],
  },
  leftArm: {
    path: 'M25,32 L29,32 L28,45 L24,45 Z',
    muscles: ['biceps', 'triceps'],
  },
  rightArm: {
    path: 'M51,32 L55,32 L56,45 L52,45 Z',
    muscles: ['biceps', 'triceps'],
  },
  leftForearm: {
    path: 'M23,45 L28,45 L27,55 L22,55 Z',
    muscles: ['forearms'],
  },
  rightForearm: {
    path: 'M52,45 L57,45 L58,55 L53,55 Z',
    muscles: ['forearms'],
  },
  abs: {
    path: 'M36,38 L44,38 L44,52 L36,52 Z',
    muscles: ['abs', 'obliques'],
  },
  // Lower body
  leftQuad: {
    path: 'M33,54 L40,54 L39,72 L32,72 Z',
    muscles: ['quads'],
  },
  rightQuad: {
    path: 'M40,54 L47,54 L48,72 L41,72 Z',
    muscles: ['quads'],
  },
  leftCalf: {
    path: 'M33,74 L38,74 L37,88 L34,88 Z',
    muscles: ['calves'],
  },
  rightCalf: {
    path: 'M42,74 L47,74 L46,88 L43,88 Z',
    muscles: ['calves'],
  },
  // Back view regions
  upperBack: {
    path: 'M35,28 L45,28 L45,35 L35,35 Z',
    muscles: ['upper_back', 'traps'],
  },
  lats: {
    path: 'M33,35 L47,35 L46,48 L34,48 Z',
    muscles: ['lats'],
  },
  lowerBack: {
    path: 'M36,48 L44,48 L44,54 L36,54 Z',
    muscles: ['lower_back'],
  },
  glutes: {
    path: 'M34,54 L46,54 L46,62 L34,62 Z',
    muscles: ['glutes'],
  },
  leftHamstring: {
    path: 'M33,62 L39,62 L38,75 L34,75 Z',
    muscles: ['hamstrings'],
  },
  rightHamstring: {
    path: 'M41,62 L47,62 L46,75 L42,75 Z',
    muscles: ['hamstrings'],
  },
};

function getMuscleColor(
  muscles: MuscleGroup[],
  muscleRanks?: Partial<Record<MuscleGroup, HunterRank>>,
  highlightedMuscles?: MuscleGroup[]
): string {
  // Check if any muscle in this group is highlighted
  if (highlightedMuscles) {
    const isHighlighted = muscles.some((m) => highlightedMuscles.includes(m));
    if (isHighlighted) return '#4F46E5'; // accent purple
    return '#1A1A3A'; // bg-tertiary (dimmed)
  }

  // Color by rank
  if (muscleRanks) {
    const ranks = muscles.map((m) => muscleRanks[m]).filter(Boolean);
    if (ranks.length > 0) {
      return getRankColor(ranks[0]!);
    }
  }

  return '#2A2A4A'; // default unfilled
}

export function MuscleMap({ muscleRanks, highlightedMuscles, size = 'large', onMusclePress }: MuscleMapProps) {
  const scale = size === 'large' ? 3.5 : 2;
  const width = 80 * scale;
  const height = 95 * scale;

  return (
    <View className="items-center">
      <Svg width={width} height={height} viewBox="0 0 80 95">
        {/* Body outline */}
        <Path
          d="M40,5 C45,5 48,8 48,12 C48,16 45,19 40,19 C35,19 32,16 32,12 C32,8 35,5 40,5"
          fill="#2A2A4A"
          stroke="#3A3A5A"
          strokeWidth={0.5}
        />
        {/* Neck */}
        <Path d="M38,19 L42,19 L42,24 L38,24 Z" fill="#2A2A4A" stroke="#3A3A5A" strokeWidth={0.3} />

        {/* Muscle regions */}
        {Object.entries(MUSCLE_PATHS).map(([key, { path, muscles }]) => {
          const color = getMuscleColor(muscles, muscleRanks, highlightedMuscles);
          return (
            <Path
              key={key}
              d={path}
              fill={color}
              stroke="#3A3A5A"
              strokeWidth={0.3}
              opacity={0.85}
              onPress={() => onMusclePress?.(muscles[0])}
            />
          );
        })}
      </Svg>

      {/* Legend */}
      {muscleRanks && size === 'large' && (
        <View className="flex-row flex-wrap justify-center mt-3 gap-2">
          {Object.entries(muscleRanks).slice(0, 6).map(([muscle, rank]) => (
            <View key={muscle} className="flex-row items-center">
              <View
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: getRankColor(rank) }}
              />
              <Text className="text-text-muted text-xs">
                {muscle.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// Mini version for dashboard
export function MuscleMapMini({ highlightedMuscles }: { highlightedMuscles?: MuscleGroup[] }) {
  return <MuscleMap highlightedMuscles={highlightedMuscles} size="small" />;
}

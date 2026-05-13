'use client';

import { motion } from 'framer-motion';
import type { MuscleGroup } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MuscleMapProps {
  activeMuscles?: MuscleGroup[];
  intensityMap?: Partial<Record<MuscleGroup, number>>; // 0-1
  onMuscleClick?: (muscle: MuscleGroup) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

// Muscle path data for front and back views
const FRONT_MUSCLES: Record<string, { path: string; label: string; group: MuscleGroup }> = {
  chest_left: {
    path: 'M85,95 Q90,85 105,82 Q115,80 120,85 Q125,95 120,108 Q115,115 105,112 Q90,110 85,100Z',
    label: 'Chest',
    group: 'chest',
  },
  chest_right: {
    path: 'M155,95 Q150,85 135,82 Q125,80 120,85 Q115,95 120,108 Q125,115 135,112 Q150,110 155,100Z',
    label: 'Chest',
    group: 'chest',
  },
  front_delt_left: {
    path: 'M78,80 Q75,72 80,65 Q88,60 95,65 Q98,72 95,82 Q90,88 82,85Z',
    label: 'Front Delt',
    group: 'front_delts',
  },
  front_delt_right: {
    path: 'M162,80 Q165,72 160,65 Q152,60 145,65 Q142,72 145,82 Q150,88 158,85Z',
    label: 'Front Delt',
    group: 'front_delts',
  },
  side_delt_left: {
    path: 'M72,75 Q68,68 72,60 Q78,55 82,60 Q80,68 78,78Z',
    label: 'Side Delt',
    group: 'side_delts',
  },
  side_delt_right: {
    path: 'M168,75 Q172,68 168,60 Q162,55 158,60 Q160,68 162,78Z',
    label: 'Side Delt',
    group: 'side_delts',
  },
  bicep_left: {
    path: 'M72,95 Q68,88 70,82 Q75,78 80,82 Q82,90 80,100 Q78,108 72,105Z',
    label: 'Bicep',
    group: 'biceps',
  },
  bicep_right: {
    path: 'M168,95 Q172,88 170,82 Q165,78 160,82 Q158,90 160,100 Q162,108 168,105Z',
    label: 'Bicep',
    group: 'biceps',
  },
  forearm_left: {
    path: 'M65,115 Q62,108 66,100 Q72,96 76,100 Q78,108 74,118 Q70,125 65,122Z',
    label: 'Forearm',
    group: 'forearms',
  },
  forearm_right: {
    path: 'M175,115 Q178,108 174,100 Q168,96 164,100 Q162,108 166,118 Q170,125 175,122Z',
    label: 'Forearm',
    group: 'forearms',
  },
  abs: {
    path: 'M105,115 Q100,112 98,120 Q96,135 98,150 Q100,160 105,165 Q112,168 120,168 Q128,168 135,165 Q140,160 142,150 Q144,135 142,120 Q140,112 135,115Z',
    label: 'Abs',
    group: 'abs',
  },
  obliques_left: {
    path: 'M88,115 Q85,120 84,135 Q85,150 88,158 Q92,162 96,158 Q98,150 96,135 Q98,120 95,115Z',
    label: 'Obliques',
    group: 'obliques',
  },
  obliques_right: {
    path: 'M152,115 Q155,120 156,135 Q155,150 152,158 Q148,162 144,158 Q142,150 144,135 Q142,120 145,115Z',
    label: 'Obliques',
    group: 'obliques',
  },
  quad_left: {
    path: 'M92,175 Q88,170 86,180 Q84,200 86,220 Q88,235 92,240 Q98,245 105,242 Q110,238 112,225 Q114,210 112,195 Q110,180 108,175Z',
    label: 'Quad',
    group: 'quads',
  },
  quad_right: {
    path: 'M148,175 Q152,170 154,180 Q156,200 154,220 Q152,235 148,240 Q142,245 135,242 Q130,238 128,225 Q126,210 128,195 Q130,180 132,175Z',
    label: 'Quad',
    group: 'quads',
  },
  calf_left: {
    path: 'M90,255 Q88,248 89,260 Q88,278 90,290 Q93,298 97,295 Q100,288 100,275 Q100,260 98,250Z',
    label: 'Calf',
    group: 'calves',
  },
  calf_right: {
    path: 'M150,255 Q152,248 151,260 Q152,278 150,290 Q147,298 143,295 Q140,288 140,275 Q140,260 142,250Z',
    label: 'Calf',
    group: 'calves',
  },
};

const BACK_MUSCLES: Record<string, { path: string; label: string; group: MuscleGroup }> = {
  traps: {
    path: 'M100,55 Q105,48 120,45 Q135,48 140,55 Q138,62 130,68 Q120,72 110,68 Q102,62 100,55Z',
    label: 'Traps',
    group: 'traps',
  },
  rear_delt_left: {
    path: 'M78,72 Q75,65 80,58 Q88,55 92,60 Q90,68 85,75Z',
    label: 'Rear Delt',
    group: 'rear_delts',
  },
  rear_delt_right: {
    path: 'M162,72 Q165,65 160,58 Q152,55 148,60 Q150,68 155,75Z',
    label: 'Rear Delt',
    group: 'rear_delts',
  },
  upper_back_left: {
    path: 'M88,78 Q92,72 102,70 Q108,72 110,80 Q108,95 100,100 Q92,98 88,90Z',
    label: 'Upper Back',
    group: 'upper_back',
  },
  upper_back_right: {
    path: 'M152,78 Q148,72 138,70 Q132,72 130,80 Q132,95 140,100 Q148,98 152,90Z',
    label: 'Upper Back',
    group: 'upper_back',
  },
  lats_left: {
    path: 'M82,88 Q78,95 80,110 Q82,125 86,135 Q92,140 98,135 Q102,125 102,110 Q100,95 95,88Z',
    label: 'Lats',
    group: 'lats',
  },
  lats_right: {
    path: 'M158,88 Q162,95 160,110 Q158,125 154,135 Q148,140 142,135 Q138,125 138,110 Q140,95 145,88Z',
    label: 'Lats',
    group: 'lats',
  },
  lower_back: {
    path: 'M102,135 Q108,130 120,128 Q132,130 138,135 Q140,145 138,155 Q132,162 120,165 Q108,162 102,155 Q100,145 102,135Z',
    label: 'Lower Back',
    group: 'lower_back',
  },
  tricep_left: {
    path: 'M70,82 Q66,88 68,100 Q70,110 74,112 Q78,110 80,100 Q80,88 76,82Z',
    label: 'Tricep',
    group: 'triceps',
  },
  tricep_right: {
    path: 'M170,82 Q174,88 172,100 Q170,110 166,112 Q162,110 160,100 Q160,88 164,82Z',
    label: 'Tricep',
    group: 'triceps',
  },
  glute_left: {
    path: 'M92,168 Q88,172 86,182 Q88,195 92,200 Q100,205 108,200 Q112,195 112,185 Q110,175 105,168Z',
    label: 'Glute',
    group: 'glutes',
  },
  glute_right: {
    path: 'M148,168 Q152,172 154,182 Q152,195 148,200 Q140,205 132,200 Q128,195 128,185 Q130,175 135,168Z',
    label: 'Glute',
    group: 'glutes',
  },
  hamstring_left: {
    path: 'M90,210 Q88,205 87,215 Q86,235 88,250 Q92,258 98,255 Q102,248 102,235 Q102,218 100,210Z',
    label: 'Hamstring',
    group: 'hamstrings',
  },
  hamstring_right: {
    path: 'M150,210 Q152,205 153,215 Q154,235 152,250 Q148,258 142,255 Q138,248 138,235 Q138,218 140,210Z',
    label: 'Hamstring',
    group: 'hamstrings',
  },
};

function getIntensityColor(intensity: number): string {
  if (intensity >= 0.8) return '#0c93e9';
  if (intensity >= 0.5) return '#36adf8';
  if (intensity >= 0.3) return '#7cc8fc';
  return '#bae0fd';
}

export function MuscleMap({
  activeMuscles = [],
  intensityMap = {},
  onMuscleClick,
  size = 'md',
  showLabels = false,
}: MuscleMapProps) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  const muscles = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;

  const sizeClasses = {
    sm: 'w-40 h-56',
    md: 'w-56 h-80',
    lg: 'w-72 h-96',
  };

  const viewBox = '60 35 120 280';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-surface-elevated rounded-lg">
        <button
          onClick={() => setView('front')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            view === 'front'
              ? 'bg-forge-500/20 text-forge-400'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          Front
        </button>
        <button
          onClick={() => setView('back')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            view === 'back'
              ? 'bg-forge-500/20 text-forge-400'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          Back
        </button>
      </div>

      {/* Body SVG */}
      <svg
        viewBox={viewBox}
        className={cn(sizeClasses[size], 'drop-shadow-lg')}
      >
        {/* Body outline */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A2A3A" />
            <stop offset="100%" stopColor="#1A1A25" />
          </linearGradient>
        </defs>

        {/* Head */}
        <ellipse cx="120" cy="42" rx="12" ry="14" fill="#2A2A3A" stroke="#3A3A4A" strokeWidth="0.5" />
        {/* Neck */}
        <rect x="114" y="53" width="12" height="8" fill="#2A2A3A" rx="2" />
        {/* Torso */}
        <path
          d="M85,62 Q80,58 72,58 Q65,62 62,72 Q60,85 62,100 Q60,115 62,130 Q64,145 68,155 Q72,160 80,162 Q88,165 96,168 Q105,170 120,170 Q135,170 144,168 Q152,165 160,162 Q168,160 172,155 Q176,145 178,130 Q180,115 178,100 Q180,85 178,72 Q175,62 168,58 Q160,58 155,62Z"
          fill="url(#bodyGradient)"
          stroke="#3A3A4A"
          strokeWidth="0.5"
        />
        {/* Arms */}
        <path d="M72,62 Q60,65 55,78 Q52,95 55,115 Q58,130 60,140" fill="none" stroke="#3A3A4A" strokeWidth="8" strokeLinecap="round" />
        <path d="M168,62 Q180,65 185,78 Q188,95 185,115 Q182,130 180,140" fill="none" stroke="#3A3A4A" strokeWidth="8" strokeLinecap="round" />
        {/* Legs */}
        <path d="M100,168 Q95,175 90,190 Q85,210 86,230 Q87,250 88,270 Q88,290 90,305" fill="none" stroke="#3A3A4A" strokeWidth="12" strokeLinecap="round" />
        <path d="M140,168 Q145,175 150,190 Q155,210 154,230 Q153,250 152,270 Q152,290 150,305" fill="none" stroke="#3A3A4A" strokeWidth="12" strokeLinecap="round" />

        {/* Muscle groups */}
        {Object.entries(muscles).map(([key, muscle]) => {
          const isActive = activeMuscles.includes(muscle.group);
          const intensity = intensityMap[muscle.group] ?? (isActive ? 0.6 : 0);
          const color = getIntensityColor(intensity);
          const isHovered = hoveredMuscle === key;

          return (
            <motion.path
              key={key}
              d={muscle.path}
              fill={isActive ? color : 'transparent'}
              fillOpacity={isActive ? 0.6 + intensity * 0.4 : 0}
              stroke={isActive ? color : 'transparent'}
              strokeWidth={isHovered ? 1.5 : 0.5}
              strokeOpacity={0.8}
              filter={isActive ? 'url(#glow)' : undefined}
              className={cn(
                'transition-all cursor-pointer',
                isActive && 'muscle-active'
              )}
              onMouseEnter={() => setHoveredMuscle(key)}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onMuscleClick?.(muscle.group)}
              initial={false}
              animate={{
                fillOpacity: isActive ? 0.5 + intensity * 0.5 : 0,
                scale: isHovered ? 1.02 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          );
        })}

        {/* Hover label */}
        {hoveredMuscle && muscles[hoveredMuscle] && showLabels && (
          <text
            x="120"
            y="320"
            textAnchor="middle"
            fill="#F5F5F7"
            fontSize="8"
            fontWeight="600"
          >
            {muscles[hoveredMuscle].label}
          </text>
        )}
      </svg>
    </div>
  );
}

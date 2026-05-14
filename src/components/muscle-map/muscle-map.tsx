'use client';

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

// ─────────────────────────────────────────────
// Clean anatomical muscle regions
// Viewbox: 0 0 200 400 per side
// Body center: x=100, head to toe: y=10..390
// ─────────────────────────────────────────────

interface MuscleRegion {
  path: string;
  label: string;
  group: MuscleGroup;
}

const FRONT_BODY_OUTLINE =
  // Head
  'M88,28 C88,16 93,8 100,8 C107,8 112,16 112,28 C112,38 107,44 100,44 C93,44 88,38 88,28Z ' +
  // Neck
  'M94,44 L106,44 L107,52 L93,52Z ' +
  // Shoulders + Torso
  'M93,52 C86,52 72,54 64,58 C56,62 52,66 50,72 ' +
  // Left arm
  'C48,80 46,90 46,98 C44,108 42,118 42,128 C40,138 40,148 42,156 C42,162 44,166 48,168 C46,174 44,182 42,190 C40,198 40,206 42,212 ' +
  // Left hand
  'C44,218 46,220 48,218 ' +
  // Back up torso left
  'M50,72 C52,78 56,82 60,84 ' +
  // Torso bottom left
  'M60,84 C62,90 64,100 66,110 C68,120 70,134 72,148 C74,162 76,172 80,180 C84,188 88,192 94,196 L100,198 ' +
  // Mirror right side
  'L106,196 C112,192 116,188 120,180 C124,172 126,162 128,148 C130,134 132,120 134,110 C136,100 138,90 140,84 ' +
  // Right arm
  'M140,84 C144,82 148,78 150,72 C152,66 156,62 164,58 C172,54 186,52 193,52 L193,52 ' +
  // Right outer arm
  'M150,72 C152,80 154,90 154,98 C156,108 158,118 158,128 C160,138 160,148 158,156 C158,162 156,166 152,168 C154,174 156,182 158,190 C160,198 160,206 158,212 C156,218 154,220 152,218 ' +
  // Left leg
  'M94,196 C92,206 88,220 86,236 C84,252 82,268 82,280 C82,292 84,300 86,306 ' +
  'C86,312 86,324 86,336 C86,350 86,362 88,374 C88,380 90,384 94,386 L100,386 ' +
  // Right leg
  'L106,386 C110,384 112,380 112,374 C114,362 114,350 114,336 C114,324 114,312 114,306 ' +
  'C116,300 118,292 118,280 C118,268 116,252 114,236 C112,220 108,206 106,196';

const BACK_BODY_OUTLINE = FRONT_BODY_OUTLINE; // Same silhouette

const FRONT_MUSCLES: MuscleRegion[] = [
  // Chest
  {
    path: 'M76,74 C80,68 88,64 100,66 L100,72 C100,80 98,88 94,94 C90,98 84,100 78,96 C74,92 72,86 72,80 C72,78 74,76 76,74Z',
    label: 'Chest',
    group: 'chest',
  },
  {
    path: 'M124,74 C120,68 112,64 100,66 L100,72 C100,80 102,88 106,94 C110,98 116,100 122,96 C126,92 128,86 128,80 C128,78 126,76 124,74Z',
    label: 'Chest',
    group: 'chest',
  },
  // Front Delts
  {
    path: 'M64,60 C58,64 54,70 52,76 C54,82 58,86 62,86 C66,84 70,78 72,72 C74,68 72,64 68,60 L64,60Z',
    label: 'Front Delt',
    group: 'front_delts',
  },
  {
    path: 'M136,60 C142,64 146,70 148,76 C146,82 142,86 138,86 C134,84 130,78 128,72 C126,68 128,64 132,60 L136,60Z',
    label: 'Front Delt',
    group: 'front_delts',
  },
  // Side Delts
  {
    path: 'M56,58 C52,60 50,66 50,72 C52,74 54,74 56,72 C58,68 60,64 62,60 C60,58 58,58 56,58Z',
    label: 'Side Delt',
    group: 'side_delts',
  },
  {
    path: 'M144,58 C148,60 150,66 150,72 C148,74 146,74 144,72 C142,68 140,64 138,60 C140,58 142,58 144,58Z',
    label: 'Side Delt',
    group: 'side_delts',
  },
  // Biceps
  {
    path: 'M48,86 C46,92 44,100 44,108 C44,118 44,126 46,132 C48,136 50,138 52,136 C56,132 58,124 58,114 C58,104 56,96 54,88 L48,86Z',
    label: 'Bicep',
    group: 'biceps',
  },
  {
    path: 'M152,86 C154,92 156,100 156,108 C156,118 156,126 154,132 C152,136 150,138 148,136 C144,132 142,124 142,114 C142,104 144,96 146,88 L152,86Z',
    label: 'Bicep',
    group: 'biceps',
  },
  // Forearms
  {
    path: 'M44,136 C42,144 40,154 40,164 C40,172 40,178 42,182 C44,186 46,186 48,184 C50,178 52,168 52,158 C52,148 50,140 48,136 L44,136Z',
    label: 'Forearm',
    group: 'forearms',
  },
  {
    path: 'M156,136 C158,144 160,154 160,164 C160,172 160,178 158,182 C156,186 154,186 152,184 C150,178 148,168 148,158 C148,148 150,140 152,136 L156,136Z',
    label: 'Forearm',
    group: 'forearms',
  },
  // Abs (segmented 6-pack look)
  {
    path: 'M94,100 L106,100 C108,106 108,112 108,118 L108,170 C108,176 106,180 104,184 L96,184 C94,180 92,176 92,170 L92,118 C92,112 92,106 94,100Z',
    label: 'Abs',
    group: 'abs',
  },
  // Obliques
  {
    path: 'M78,98 L92,100 L92,118 L92,170 C92,176 94,180 96,184 L86,186 C82,180 80,172 78,162 C76,150 76,138 76,126 C76,116 76,108 78,98Z',
    label: 'Obliques',
    group: 'obliques',
  },
  {
    path: 'M122,98 L108,100 L108,118 L108,170 C108,176 106,180 104,184 L114,186 C118,180 120,172 122,162 C124,150 124,138 124,126 C124,116 124,108 122,98Z',
    label: 'Obliques',
    group: 'obliques',
  },
  // Quads
  {
    path: 'M86,198 C90,194 96,192 100,194 L100,200 C100,220 98,244 96,264 C94,276 92,286 90,294 L84,294 C82,286 80,276 80,264 C80,248 80,228 82,212 C82,206 84,202 86,198Z',
    label: 'Quad',
    group: 'quads',
  },
  {
    path: 'M114,198 C110,194 104,192 100,194 L100,200 C100,220 102,244 104,264 C106,276 108,286 110,294 L116,294 C118,286 120,276 120,264 C120,248 120,228 118,212 C118,206 116,202 114,198Z',
    label: 'Quad',
    group: 'quads',
  },
  // Calves
  {
    path: 'M84,306 C82,300 84,296 86,296 L92,296 C94,296 96,300 94,306 C96,316 96,328 94,342 C92,354 90,364 88,372 C86,364 84,354 82,342 C80,328 82,316 84,306Z',
    label: 'Calf',
    group: 'calves',
  },
  {
    path: 'M116,306 C118,300 116,296 114,296 L108,296 C106,296 104,300 106,306 C104,316 104,328 106,342 C108,354 110,364 112,372 C114,364 116,354 118,342 C120,328 118,316 116,306Z',
    label: 'Calf',
    group: 'calves',
  },
];

const BACK_MUSCLES: MuscleRegion[] = [
  // Traps
  {
    path: 'M84,56 C90,52 96,50 100,48 C104,50 110,52 116,56 L116,66 C112,72 106,76 100,78 C94,76 88,72 84,66 L84,56Z',
    label: 'Traps',
    group: 'traps',
  },
  // Rear Delts
  {
    path: 'M56,62 C52,66 50,72 50,76 C52,80 56,82 60,82 C64,80 68,76 70,70 C72,66 70,62 66,58 L56,62Z',
    label: 'Rear Delt',
    group: 'rear_delts',
  },
  {
    path: 'M144,62 C148,66 150,72 150,76 C148,80 144,82 140,82 C136,80 132,76 130,70 C128,66 130,62 134,58 L144,62Z',
    label: 'Rear Delt',
    group: 'rear_delts',
  },
  // Upper Back / Rhomboids
  {
    path: 'M82,68 C86,72 92,76 100,78 L100,100 C96,100 90,98 86,94 C82,90 80,84 78,78 L82,68Z',
    label: 'Upper Back',
    group: 'upper_back',
  },
  {
    path: 'M118,68 C114,72 108,76 100,78 L100,100 C104,100 110,98 114,94 C118,90 120,84 122,78 L118,68Z',
    label: 'Upper Back',
    group: 'upper_back',
  },
  // Lats
  {
    path: 'M74,86 C76,94 78,100 82,106 L92,104 L100,102 L100,152 L90,154 C84,150 80,142 78,132 C76,122 74,110 74,100 C74,94 74,90 74,86Z',
    label: 'Lats',
    group: 'lats',
  },
  {
    path: 'M126,86 C124,94 122,100 118,106 L108,104 L100,102 L100,152 L110,154 C116,150 120,142 122,132 C124,122 126,110 126,100 C126,94 126,90 126,86Z',
    label: 'Lats',
    group: 'lats',
  },
  // Lower Back / Erectors
  {
    path: 'M90,154 L110,154 C112,162 112,170 110,178 C106,184 104,188 100,190 C96,188 94,184 90,178 C88,170 88,162 90,154Z',
    label: 'Lower Back',
    group: 'lower_back',
  },
  // Triceps
  {
    path: 'M48,82 C46,90 44,100 44,110 C44,120 44,128 46,134 C48,138 50,140 52,138 C56,134 58,126 58,116 C58,106 56,96 54,88 L48,82Z',
    label: 'Tricep',
    group: 'triceps',
  },
  {
    path: 'M152,82 C154,90 156,100 156,110 C156,120 156,128 154,134 C152,138 150,140 148,138 C144,134 142,126 142,116 C142,106 144,96 146,88 L152,82Z',
    label: 'Tricep',
    group: 'triceps',
  },
  // Glutes
  {
    path: 'M86,190 C90,188 96,186 100,188 L100,212 C96,214 92,214 88,212 C84,208 82,202 80,196 C80,194 82,192 86,190Z',
    label: 'Glute',
    group: 'glutes',
  },
  {
    path: 'M114,190 C110,188 104,186 100,188 L100,212 C104,214 108,214 112,212 C116,208 118,202 120,196 C120,194 118,192 114,190Z',
    label: 'Glute',
    group: 'glutes',
  },
  // Hamstrings
  {
    path: 'M84,214 C88,214 94,214 100,214 L100,218 C100,238 98,258 96,274 C94,284 92,290 90,296 L84,296 C82,288 80,278 80,266 C80,250 80,234 82,220 C82,218 82,216 84,214Z',
    label: 'Hamstring',
    group: 'hamstrings',
  },
  {
    path: 'M116,214 C112,214 106,214 100,214 L100,218 C100,238 102,258 104,274 C106,284 108,290 110,296 L116,296 C118,288 120,278 120,266 C120,250 120,234 118,220 C118,218 118,216 116,214Z',
    label: 'Hamstring',
    group: 'hamstrings',
  },
  // Calves (back)
  {
    path: 'M84,306 C82,300 84,296 86,296 L92,296 C94,296 96,300 94,306 C96,316 96,328 94,342 C92,354 90,364 88,372 C86,364 84,354 82,342 C80,328 82,316 84,306Z',
    label: 'Calf',
    group: 'calves',
  },
  {
    path: 'M116,306 C118,300 116,296 114,296 L108,296 C106,296 104,300 106,306 C104,316 104,328 106,342 C108,354 110,364 112,372 C114,364 116,354 118,342 C120,328 118,316 116,306Z',
    label: 'Calf',
    group: 'calves',
  },
];

// Silhouette: a single clean filled body outline
function BodySilhouette() {
  return (
    <g>
      {/* Head */}
      <ellipse cx="100" cy="28" rx="14" ry="18" fill="#1E1E2E" stroke="#333346" strokeWidth="0.6" />
      {/* Neck */}
      <rect x="94" y="44" width="12" height="10" rx="2" fill="#1E1E2E" stroke="#333346" strokeWidth="0.6" />
      {/* Torso */}
      <path
        d="M64,58 C58,62 54,68 52,76 C54,80 58,84 64,86
           L64,86 C68,98 72,118 74,140 C76,158 78,174 82,186
           C86,194 92,198 100,200
           C108,198 114,194 118,186
           C122,174 124,158 126,140 C128,118 132,98 136,86
           L136,86 C142,84 146,80 148,76 C146,68 142,62 136,58
           C128,54 116,52 100,52 C84,52 72,54 64,58Z"
        fill="#1E1E2E" stroke="#333346" strokeWidth="0.6"
      />
      {/* Left upper arm */}
      <path
        d="M52,76 C48,84 46,94 46,106 C44,118 44,128 46,136
           C48,140 50,142 54,140 C58,136 60,126 60,114
           C60,102 58,92 54,84 L52,76Z"
        fill="#1E1E2E" stroke="#333346" strokeWidth="0.6"
      />
      {/* Left forearm */}
      <path
        d="M46,138 C44,146 42,158 42,168 C42,178 42,186 44,192
           C46,198 48,200 52,196 C54,190 56,180 56,168
           C56,156 54,146 52,140 L46,138Z"
        fill="#1E1E2E" stroke="#333346" strokeWidth="0.6"
      />
      {/* Right upper arm */}
      <path
        d="M148,76 C152,84 154,94 154,106 C156,118 156,128 154,136
           C152,140 150,142 146,140 C142,136 140,126 140,114
           C140,102 142,92 146,84 L148,76Z"
        fill="#1E1E2E" stroke="#333346" strokeWidth="0.6"
      />
      {/* Right forearm */}
      <path
        d="M154,138 C156,146 158,158 158,168 C158,178 158,186 156,192
           C154,198 152,200 148,196 C146,190 144,180 144,168
           C144,156 146,146 148,140 L154,138Z"
        fill="#1E1E2E" stroke="#333346" strokeWidth="0.6"
      />
      {/* Left thigh */}
      <path
        d="M88,196 C84,202 82,214 80,230 C80,248 80,264 82,278
           C84,290 86,296 90,298 L96,298
           C96,296 96,296 96,296 L100,200Z"
        fill="#1E1E2E" stroke="#333346" strokeWidth="0.6"
      />
      {/* Right thigh */}
      <path
        d="M112,196 C116,202 118,214 120,230 C120,248 120,264 118,278
           C116,290 114,296 110,298 L104,298
           C104,296 104,296 104,296 L100,200Z"
        fill="#1E1E2E" stroke="#333346" strokeWidth="0.6"
      />
      {/* Left calf */}
      <path
        d="M84,298 C82,304 82,316 84,332 C86,348 88,362 90,374
           C90,380 92,384 96,386 L100,386 L100,386
           C100,380 98,370 96,356 C94,340 92,320 94,304
           C94,300 92,298 90,298 L84,298Z"
        fill="#1E1E2E" stroke="#333346" strokeWidth="0.6"
      />
      {/* Right calf */}
      <path
        d="M116,298 C118,304 118,316 116,332 C114,348 112,362 110,374
           C110,380 108,384 104,386 L100,386 L100,386
           C100,380 102,370 104,356 C106,340 108,320 106,304
           C106,300 108,298 110,298 L116,298Z"
        fill="#1E1E2E" stroke="#333346" strokeWidth="0.6"
      />
    </g>
  );
}

// Intensity → color
function getMuscleColor(intensity: number): string {
  if (intensity >= 0.8) return '#22D3EE'; // cyan-400
  if (intensity >= 0.5) return '#38BDF8'; // sky-400
  if (intensity >= 0.3) return '#7DD3FC'; // sky-300
  return '#BAE6FD'; // sky-200
}

// Single body view (front or back)
function BodyView({
  muscles,
  activeMuscles,
  intensityMap,
  hoveredMuscle,
  setHoveredMuscle,
  onMuscleClick,
  idPrefix,
}: {
  muscles: MuscleRegion[];
  activeMuscles: MuscleGroup[];
  intensityMap: Partial<Record<MuscleGroup, number>>;
  hoveredMuscle: string | null;
  setHoveredMuscle: (m: string | null) => void;
  onMuscleClick?: (m: MuscleGroup) => void;
  idPrefix: string;
}) {
  return (
    <svg viewBox="30 0 140 400" className="w-full h-full">
      <defs>
        <filter id={`${idPrefix}Glow`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <BodySilhouette />

      {muscles.map((muscle, i) => {
        const key = `${idPrefix}-${muscle.group}-${i}`;
        const isActive = activeMuscles.includes(muscle.group);
        const intensity = intensityMap[muscle.group] ?? (isActive ? 0.6 : 0);
        const color = getMuscleColor(intensity);
        const isHovered = hoveredMuscle === key;

        return (
          <path
            key={key}
            d={muscle.path}
            fill={isActive ? color : '#252538'}
            fillOpacity={isActive ? 0.55 + intensity * 0.45 : 0.4}
            stroke={isActive ? color : '#3A3A50'}
            strokeWidth={isHovered ? 1.4 : 0.5}
            strokeOpacity={isActive ? 1 : 0.4}
            filter={isActive ? `url(#${idPrefix}Glow)` : undefined}
            className={cn(
              'transition-all duration-200',
              onMuscleClick && 'cursor-pointer'
            )}
            onMouseEnter={() => setHoveredMuscle(key)}
            onMouseLeave={() => setHoveredMuscle(null)}
            onClick={() => onMuscleClick?.(muscle.group)}
          />
        );
      })}
    </svg>
  );
}

export function MuscleMap({
  activeMuscles = [],
  intensityMap = {},
  onMuscleClick,
  size = 'md',
  showLabels = false,
}: MuscleMapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'max-w-[240px]',
    md: 'max-w-[320px]',
    lg: 'max-w-[400px]',
  };

  // Resolve hovered label
  const allMuscles = [...FRONT_MUSCLES, ...BACK_MUSCLES];
  const hoveredRegion = hoveredMuscle
    ? allMuscles.find((_, i) => {
        const prefix = hoveredMuscle.startsWith('front') ? 'front' : 'back';
        return hoveredMuscle === `${prefix}-${allMuscles[i]?.group}-${i}`;
      })
    : null;

  // Simpler label resolution
  let hoveredLabel: string | null = null;
  if (hoveredMuscle) {
    const frontMatch = FRONT_MUSCLES.find(
      (m, i) => hoveredMuscle === `front-${m.group}-${i}`
    );
    const backMatch = BACK_MUSCLES.find(
      (m, i) => hoveredMuscle === `back-${m.group}-${i}`
    );
    hoveredLabel = frontMatch?.label ?? backMatch?.label ?? null;
  }

  return (
    <div className={cn('mx-auto', sizeClasses[size])}>
      {/* Labels */}
      <div className="flex justify-between px-4 mb-1">
        <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-medium">Front</span>
        <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-medium">Back</span>
      </div>

      {/* Side-by-side front + back */}
      <div className="flex gap-1">
        <div className="flex-1">
          <BodyView
            muscles={FRONT_MUSCLES}
            activeMuscles={activeMuscles}
            intensityMap={intensityMap}
            hoveredMuscle={hoveredMuscle}
            setHoveredMuscle={setHoveredMuscle}
            onMuscleClick={onMuscleClick}
            idPrefix="front"
          />
        </div>
        <div className="flex-1">
          <BodyView
            muscles={BACK_MUSCLES}
            activeMuscles={activeMuscles}
            intensityMap={intensityMap}
            hoveredMuscle={hoveredMuscle}
            setHoveredMuscle={setHoveredMuscle}
            onMuscleClick={onMuscleClick}
            idPrefix="back"
          />
        </div>
      </div>

      {/* Hovered label */}
      {showLabels && hoveredLabel && (
        <div className="text-center mt-2">
          <span className="text-xs font-medium text-forge-400 bg-forge-500/10 px-3 py-1 rounded-full">
            {hoveredLabel}
          </span>
        </div>
      )}

      {/* Legend */}
      {activeMuscles.length > 0 && (
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-300" />
            <span className="text-[10px] text-text-tertiary">Trained</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#252538] border border-[#3A3A50]" />
            <span className="text-[10px] text-text-tertiary">Untrained</span>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import type { MuscleGroup } from '@/types';
import { cn } from '@/lib/utils';

interface MuscleMapMiniProps {
  activeMuscles: MuscleGroup[];
  className?: string;
}

const MUSCLE_POSITIONS: Record<MuscleGroup, { x: number; y: number; label: string }> = {
  chest: { x: 50, y: 25, label: 'Chest' },
  front_delts: { x: 20, y: 15, label: 'Front Delts' },
  side_delts: { x: 15, y: 18, label: 'Side Delts' },
  rear_delts: { x: 85, y: 15, label: 'Rear Delts' },
  triceps: { x: 10, y: 30, label: 'Triceps' },
  biceps: { x: 12, y: 28, label: 'Biceps' },
  forearms: { x: 8, y: 38, label: 'Forearms' },
  upper_back: { x: 80, y: 22, label: 'Upper Back' },
  lats: { x: 78, y: 32, label: 'Lats' },
  lower_back: { x: 82, y: 40, label: 'Lower Back' },
  traps: { x: 50, y: 10, label: 'Traps' },
  abs: { x: 50, y: 38, label: 'Abs' },
  obliques: { x: 38, y: 36, label: 'Obliques' },
  glutes: { x: 75, y: 50, label: 'Glutes' },
  quads: { x: 40, y: 60, label: 'Quads' },
  hamstrings: { x: 70, y: 58, label: 'Hamstrings' },
  calves: { x: 55, y: 78, label: 'Calves' },
  hip_flexors: { x: 45, y: 50, label: 'Hip Flexors' },
  neck: { x: 50, y: 5, label: 'Neck' },
};

export function MuscleMapMini({ activeMuscles, className }: MuscleMapMiniProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {Object.entries(MUSCLE_POSITIONS).map(([key, { label }]) => {
        const isActive = activeMuscles.includes(key as MuscleGroup);
        return (
          <span
            key={key}
            className={cn(
              'px-2 py-1 rounded-md text-xs font-medium transition-all',
              isActive
                ? 'bg-forge-500/15 text-forge-400 border border-forge-500/30'
                : 'bg-surface-elevated text-text-tertiary border border-surface-border'
            )}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

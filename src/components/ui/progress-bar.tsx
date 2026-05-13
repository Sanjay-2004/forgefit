'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  color = 'blue',
  size = 'md',
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colors = {
    blue: 'bg-gradient-to-r from-forge-500 to-forge-400',
    green: 'bg-gradient-to-r from-accent-green to-emerald-400',
    orange: 'bg-gradient-to-r from-accent-orange to-amber-400',
    red: 'bg-gradient-to-r from-accent-red to-rose-400',
    purple: 'bg-gradient-to-r from-accent-purple to-violet-400',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-surface-elevated rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

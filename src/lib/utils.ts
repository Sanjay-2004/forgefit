import type { HunterRank } from '@/types';
import { RANK_ORDER, RANK_XP_THRESHOLDS } from '@/types';

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export function formatWeight(kg: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (unit === 'lbs') return `${Math.round(kg * 2.205)}lbs`;
  return `${kg}kg`;
}

export function calculateVolume(sets: { weight_kg: number | null; reps: number | null }[]): number {
  return sets.reduce((total, set) => {
    return total + (set.weight_kg ?? 0) * (set.reps ?? 0);
  }, 0);
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function getRankFromXP(xp: number): HunterRank {
  let rank: HunterRank = 'E';
  for (const r of RANK_ORDER) {
    if (xp >= RANK_XP_THRESHOLDS[r]) {
      rank = r;
    } else {
      break;
    }
  }
  return rank;
}

export function getXPProgressInRank(xp: number): { current: number; needed: number; percentage: number } {
  const rank = getRankFromXP(xp);
  const rankIndex = RANK_ORDER.indexOf(rank);
  const currentThreshold = RANK_XP_THRESHOLDS[rank];

  if (rankIndex === RANK_ORDER.length - 1) {
    return { current: xp - currentThreshold, needed: 0, percentage: 100 };
  }

  const nextThreshold = RANK_XP_THRESHOLDS[RANK_ORDER[rankIndex + 1]];
  const xpInRank = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const percentage = Math.min(100, Math.round((xpInRank / xpNeeded) * 100));

  return { current: xpInRank, needed: xpNeeded, percentage };
}

export function calculateSetXP(weightKg: number | null, reps: number | null, rpe: number | null): number {
  const base = 10;
  const weightMultiplier = Math.max(1, (weightKg ?? 0) / 20); // 1x at 0-20kg, 5x at 100kg
  const rpeBonus = rpe && rpe >= 8 ? 1.5 : 1;
  const repBonus = Math.max(1, (reps ?? 0) / 8);
  return Math.round(base * weightMultiplier * rpeBonus * repBonus);
}

export function isStreakActive(lastWorkoutDate: string | null): boolean {
  if (!lastWorkoutDate) return false;
  const last = new Date(lastWorkoutDate);
  const now = new Date();
  const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
  return diffHours < 48; // 48 hour window to maintain streak
}

export function getRankColor(rank: HunterRank): string {
  const colors: Record<HunterRank, string> = {
    E: '#9CA3AF',
    D: '#6EE7B7',
    C: '#60A5FA',
    B: '#A78BFA',
    A: '#F59E0B',
    S: '#F97316',
    SS: '#EF4444',
    SSS: '#EC4899',
    National: '#8B5CF6',
    World: '#06B6D4',
    Monarch: '#FFD700',
  };
  return colors[rank];
}

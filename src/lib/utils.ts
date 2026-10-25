import type { HunterRank } from '@/types';
import { RANK_ORDER, RANK_XP_THRESHOLDS } from '@/types';

// ============================================
// Formatting
// ============================================

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ============================================
// Rank / XP helpers
// ============================================

export function getRankFromXP(xp: number): HunterRank {
  let rank: HunterRank = 'E';
  for (const r of RANK_ORDER) {
    if (xp >= RANK_XP_THRESHOLDS[r]) rank = r;
    else break;
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
  return { current: xpInRank, needed: xpNeeded, percentage: Math.min(100, Math.round((xpInRank / xpNeeded) * 100)) };
}

export function getLevel(totalXP: number): number {
  return Math.floor(totalXP / 150) + 1;
}

export function getRankColor(rank: HunterRank): string {
  const colors: Record<HunterRank, string> = {
    E: '#9CA3AF', D: '#6EE7B7', C: '#60A5FA', B: '#A78BFA',
    A: '#F59E0B', S: '#F97316', SS: '#EF4444', SSS: '#EC4899',
    National: '#8B5CF6', World: '#06B6D4', Monarch: '#FFD700',
  };
  return colors[rank] ?? '#9CA3AF';
}

// ============================================
// 75 Hard helpers
// ============================================

export function getDayNumber(startDate: string): number {
  // Use the calendar date portion only, so timezone offsets can't shift the day
  const [y, m, d] = startDate.slice(0, 10).split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


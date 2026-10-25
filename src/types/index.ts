// ============================================
// Gamification — ranks & XP
// ============================================

export type HunterRank =
  | 'E' | 'D' | 'C' | 'B' | 'A'
  | 'S' | 'SS' | 'SSS'
  | 'National' | 'World' | 'Monarch';

export const RANK_ORDER: HunterRank[] = [
  'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'National', 'World', 'Monarch',
];

export const RANK_XP_THRESHOLDS: Record<HunterRank, number> = {
  E: 0, D: 500, C: 1500, B: 4000, A: 10000, S: 25000,
  SS: 60000, SSS: 150000, National: 350000, World: 750000, Monarch: 1500000,
};

export const RANK_TITLES: Record<HunterRank, string> = {
  E: 'E-Rank Hunter', D: 'D-Rank Hunter', C: 'C-Rank Hunter', B: 'B-Rank Hunter',
  A: 'A-Rank Hunter', S: 'S-Rank Hunter', SS: 'SS-Rank Hunter', SSS: 'SSS-Rank Hunter',
  National: 'National-Level Hunter', World: 'World-Level Hunter', Monarch: 'Monarch',
};

// ============================================
// 75 Hard Challenge Types
// ============================================

export interface Target {
  _id: string;
  name: string;
  type: 'workout' | 'reading' | 'nutrition' | 'discipline' | 'photo' | 'custom';
  xpValue: number;
  order: number;
}

export interface Challenge {
  _id: string;
  userId: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  waterTarget: 3 | 4;
  dailyTargets: Target[];
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
}

export interface TargetLog {
  targetId: string;
  name: string;
  completed: boolean;
  xpEarned: number;
  completedAt?: string;
}

export interface BonusChallenge {
  _id: string;
  title: string;
  description: string;
  xpValue: number;
  completed: boolean;
  completedAt?: string;
}

export interface DailyLog {
  _id: string;
  userId: string;
  challengeId: string;
  date: string;
  dayNumber: number;
  targetsCompleted: TargetLog[];
  waterIntake: number;
  progressPhotoUrl?: string;
  allCompleted: boolean;
  bonusChallenges: BonusChallenge[];
  totalXPEarnedToday: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  _id: string;
  supabaseId: string;
  email: string;
  name: string;
  avatar?: string;
  level: number;
  totalXP: number;
  rank: HunterRank;
  createdAt: string;
}

// ============================================
// Onboarding
// ============================================

export const DEFAULT_TARGETS: Omit<Target, '_id'>[] = [
  { name: 'Outdoor Workout (45 min)', type: 'workout', xpValue: 30, order: 0 },
  { name: 'Indoor Workout (45 min)', type: 'workout', xpValue: 30, order: 1 },
  { name: 'Read 10 Pages', type: 'reading', xpValue: 20, order: 2 },
  { name: 'Follow Diet', type: 'nutrition', xpValue: 25, order: 3 },
  { name: 'No Alcohol', type: 'discipline', xpValue: 10, order: 4 },
  { name: 'Progress Photo', type: 'photo', xpValue: 10, order: 5 },
];

export const CHALLENGE_DURATIONS = [21, 30, 60, 75, 90, 100] as const;
export type ChallengeDuration = (typeof CHALLENGE_DURATIONS)[number];

export interface OnboardingData {
  durationDays: ChallengeDuration;
  startDate: string;
  waterTarget: 3 | 4;
  dailyTargets: Omit<Target, '_id'>[];
}

// ============================================
// Stats
// ============================================

export interface CalendarDay {
  date: string;
  dayNumber: number;
  allCompleted: boolean;
}

export interface ProgressStats {
  calendarDays: CalendarDay[];
  currentStreak: number;
  longestStreak: number;
  totalDaysCompleted: number;
  totalXP: number;
  level: number;
  rank: HunterRank;
}

// Returned by toggle-target and complete-bonus endpoints
export interface XPResponse {
  log: DailyLog;
  leveledUp: boolean;
  newLevel: number;
  newRank: HunterRank;
  newXP: number;
}

// ---- end of file ----

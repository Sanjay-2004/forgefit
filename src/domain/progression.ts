import type { ExerciseLog } from '@/types';

interface ProgressionResult {
  action: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload';
  suggestedWeight?: number;
  suggestedReps?: string;
  reason: string;
}

/**
 * Deterministic progression logic — runs without LLM
 * Applies double progression: increase reps within range, then increase weight
 */
export function calculateProgression(
  _exerciseName: string,
  recentLogs: ExerciseLog[],
  targetRepRange: string,
  currentWeight: number
): ProgressionResult {
  if (recentLogs.length < 3) {
    return { action: 'maintain', reason: 'Insufficient data for progression' };
  }

  const [minReps, maxReps] = targetRepRange.split('-').map(Number);

  const lastThreeSessions = recentLogs.slice(0, 9);
  const completedSets = lastThreeSessions.filter((l) => l.is_completed);

  if (completedSets.length === 0) {
    return { action: 'maintain', reason: 'No completed sets found' };
  }

  const avgReps =
    completedSets.reduce((sum, l) => sum + (l.reps ?? 0), 0) / completedSets.length;

  const rpeValues = completedSets.filter((l) => l.rpe != null);
  const avgRpe =
    rpeValues.length > 0
      ? rpeValues.reduce((sum, l) => sum + (l.rpe ?? 0), 0) / rpeValues.length
      : 7;

  const firstHalf = completedSets.slice(0, Math.floor(completedSets.length / 2));
  const secondHalf = completedSets.slice(Math.floor(completedSets.length / 2));

  const firstHalfAvg =
    firstHalf.reduce((s, l) => s + (l.reps ?? 0), 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((s, l) => s + (l.reps ?? 0), 0) / secondHalf.length;

  if (secondHalfAvg < firstHalfAvg * 0.85 && avgRpe > 8.5) {
    return {
      action: 'deload',
      suggestedWeight: Math.round(currentWeight * 0.85),
      reason: 'Performance declining and high perceived effort — recommend deload week',
    };
  }

  if (avgReps >= maxReps && avgRpe <= 8) {
    const increment = currentWeight < 40 ? 2.5 : 5;
    return {
      action: 'increase_weight',
      suggestedWeight: currentWeight + increment,
      suggestedReps: `${minReps}-${maxReps}`,
      reason: `Consistently hitting ${maxReps} reps — increase weight by ${increment}kg`,
    };
  }

  if (avgReps <= minReps && avgRpe >= 9) {
    return {
      action: 'maintain',
      reason: 'At minimum reps with high effort — maintain weight and build reps',
    };
  }

  if (avgReps < minReps) {
    return {
      action: 'deload',
      suggestedWeight: Math.round(currentWeight * 0.9),
      reason: 'Falling below target rep range — reduce weight by 10%',
    };
  }

  return {
    action: 'increase_reps',
    suggestedReps: `Aim for ${Math.min(Math.ceil(avgReps) + 1, maxReps)} reps`,
    reason: 'Good progress — focus on adding reps before increasing weight',
  };
}

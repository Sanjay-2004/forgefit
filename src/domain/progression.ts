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
  exerciseName: string,
  recentLogs: ExerciseLog[],
  targetRepRange: string,
  currentWeight: number
): ProgressionResult {
  if (recentLogs.length < 3) {
    return { action: 'maintain', reason: 'Insufficient data for progression' };
  }

  const [minReps, maxReps] = targetRepRange.split('-').map(Number);

  // Get last 3 sessions of this exercise
  const lastThreeSessions = recentLogs.slice(0, 9); // ~3 sets x 3 sessions
  const completedSets = lastThreeSessions.filter((l) => l.is_completed);

  if (completedSets.length === 0) {
    return { action: 'maintain', reason: 'No completed sets found' };
  }

  // Average reps across recent sets
  const avgReps =
    completedSets.reduce((sum, l) => sum + (l.reps ?? 0), 0) /
    completedSets.length;

  // Average RPE
  const rpeValues = completedSets.filter((l) => l.rpe != null);
  const avgRpe =
    rpeValues.length > 0
      ? rpeValues.reduce((sum, l) => sum + (l.rpe ?? 0), 0) / rpeValues.length
      : 7;

  // Check for declining performance (potential overtraining)
  const firstHalf = completedSets.slice(
    0,
    Math.floor(completedSets.length / 2)
  );
  const secondHalf = completedSets.slice(Math.floor(completedSets.length / 2));

  const firstHalfAvg =
    firstHalf.reduce((s, l) => s + (l.reps ?? 0), 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((s, l) => s + (l.reps ?? 0), 0) / secondHalf.length;

  // If performance declining significantly
  if (secondHalfAvg < firstHalfAvg * 0.85 && avgRpe > 8.5) {
    return {
      action: 'deload',
      suggestedWeight: Math.round(currentWeight * 0.85),
      reason:
        'Performance declining and high perceived effort — recommend deload week',
    };
  }

  // If hitting top of rep range consistently
  if (avgReps >= maxReps && avgRpe <= 8) {
    const increment = currentWeight < 40 ? 2.5 : 5;
    return {
      action: 'increase_weight',
      suggestedWeight: currentWeight + increment,
      suggestedReps: `${minReps}-${maxReps}`,
      reason: `Consistently hitting ${maxReps} reps — increase weight by ${increment}kg`,
    };
  }

  // If hitting bottom of rep range but high RPE
  if (avgReps <= minReps && avgRpe >= 9) {
    return {
      action: 'maintain',
      reason:
        'At minimum reps with high effort — maintain weight and build reps',
    };
  }

  // If below minimum reps
  if (avgReps < minReps) {
    return {
      action: 'deload',
      suggestedWeight: Math.round(currentWeight * 0.9),
      reason: `Falling below target rep range — reduce weight by 10%`,
    };
  }

  return {
    action: 'increase_reps',
    suggestedReps: `Aim for ${Math.min(Math.ceil(avgReps) + 1, maxReps)} reps`,
    reason: 'Good progress — focus on adding reps before increasing weight',
  };
}

/**
 * Calculate recovery score for a muscle group based on training history
 */
export function calculateMuscleRecovery(
  lastTrainedHoursAgo: number,
  totalVolume: number,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
): number {
  const recoveryRates = {
    beginner: 72,
    intermediate: 48,
    advanced: 36,
  };

  const baseRecoveryTime = recoveryRates[experienceLevel];
  const volumeFactor = Math.min(totalVolume / 5000, 1.5); // High volume = longer recovery
  const adjustedRecoveryTime = baseRecoveryTime * volumeFactor;

  const recovery = Math.min(
    (lastTrainedHoursAgo / adjustedRecoveryTime) * 100,
    100
  );

  return Math.round(recovery);
}

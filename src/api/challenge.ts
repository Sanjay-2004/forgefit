import { apiFetch } from '@/lib/api';
import { toLocalDateString } from '@/lib/utils';
import type { Challenge, OnboardingData, Target } from '@/types';

export function createChallenge(data: OnboardingData): Promise<Challenge> {
  return apiFetch<Challenge>('/api/challenge', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getActiveChallenge(): Promise<Challenge> {
  return apiFetch<Challenge>('/api/challenge/active');
}

export function updateChallenge(
  id: string,
  data: Pick<Challenge, 'waterTarget'> & { dailyTargets: Array<Partial<Target> & { name: string; xpValue: number }> },
): Promise<Challenge> {
  return apiFetch<Challenge>(`/api/challenge/${id}?date=${toLocalDateString()}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

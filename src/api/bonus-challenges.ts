import { apiFetch } from '@/lib/api';
import type { DailyLog, XPResponse } from '@/types';

export function generateBonusChallenges(logId: string): Promise<DailyLog> {
  return apiFetch<DailyLog>('/api/bonus-challenges/generate', {
    method: 'POST',
    body: JSON.stringify({ logId }),
  });
}

export function completeBonusChallenge(logId: string, challengeId: string): Promise<XPResponse> {
  return apiFetch<XPResponse>(`/api/bonus-challenges/${challengeId}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ logId }),
  });
}

import { apiFetch } from '@/lib/api';
import { toLocalDateString } from '@/lib/utils';
import type { ProgressStats } from '@/types';

export function getProgressStats(): Promise<ProgressStats> {
  return apiFetch<ProgressStats>(`/api/stats/progress?date=${toLocalDateString()}`);
}

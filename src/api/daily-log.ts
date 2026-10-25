import { apiFetch } from '@/lib/api';
import { toLocalDateString } from '@/lib/utils';
import type { DailyLog, XPResponse } from '@/types';

export function getToday(): Promise<DailyLog> {
  return apiFetch<DailyLog>(`/api/daily-log/today?date=${toLocalDateString()}`);
}

export function toggleTarget(logId: string, targetId: string): Promise<XPResponse> {
  return apiFetch<XPResponse>(`/api/daily-log/${logId}/target/${targetId}`, { method: 'PATCH' });
}

export function updateWater(logId: string, liters: number): Promise<DailyLog> {
  return apiFetch<DailyLog>(`/api/daily-log/${logId}/water`, {
    method: 'PATCH',
    body: JSON.stringify({ waterIntake: liters }),
  });
}

export function uploadPhoto(logId: string, photoUrl: string): Promise<DailyLog> {
  return apiFetch<DailyLog>(`/api/daily-log/${logId}/photo`, {
    method: 'POST',
    body: JSON.stringify({ photoUrl }),
  });
}

import { apiFetch } from '@/lib/api';
import type { UserProfile } from '@/types';

export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/user/me');
}

export function updateName(name: string): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/user/me', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

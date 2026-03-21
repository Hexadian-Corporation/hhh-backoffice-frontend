import type { User, VerificationResult } from '@/types/user';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8006';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getUsers(): Promise<User[]> {
  return request<User[]>('/auth/users');
}

export async function getUser(id: string): Promise<User> {
  return request<User>(`/auth/users/${id}`);
}

export async function startVerification(userId: string, rsiHandle: string): Promise<VerificationResult> {
  return request<VerificationResult>(
    `/auth/verify/start?user_id=${encodeURIComponent(userId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ rsi_handle: rsiHandle }),
    },
  );
}

export async function confirmVerification(userId: string): Promise<VerificationResult> {
  return request<VerificationResult>(
    `/auth/verify/confirm?user_id=${encodeURIComponent(userId)}`,
    { method: 'POST' },
  );
}

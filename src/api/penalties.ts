import type { PenaltyConfig, PenaltyConfigUpdate } from '@/types/penalty';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_ROUTES_API_URL ?? 'http://localhost:8005';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getPenaltyConfig(): Promise<PenaltyConfig> {
  return request<PenaltyConfig>('/penalties');
}

export async function updatePenaltyConfig(data: PenaltyConfigUpdate): Promise<PenaltyConfig> {
  return request<PenaltyConfig>('/penalties', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

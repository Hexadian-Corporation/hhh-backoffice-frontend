import type { AlgorithmConfig, AlgorithmConfigUpdate } from '@/types/algorithm';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_ROUTES_API_URL ?? 'http://localhost:8005';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function getAlgorithmConfig(): Promise<AlgorithmConfig> {
  return request<AlgorithmConfig>('/algorithms/');
}

export function updateAlgorithmConfig(data: AlgorithmConfigUpdate): Promise<AlgorithmConfig> {
  return request<AlgorithmConfig>('/algorithms/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

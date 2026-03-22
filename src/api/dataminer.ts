import type { SyncResult, SyncResponse, SourcesResponse } from '@/types/dataminer';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_DATAMINER_API_URL ?? 'http://localhost:8008';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function syncAll(): Promise<SyncResponse> {
  return request<SyncResponse>('/sync', { method: 'POST' });
}

export async function syncEntity(entity: string): Promise<SyncResult> {
  return request<SyncResult>(`/sync/${encodeURIComponent(entity)}`, { method: 'POST' });
}

export async function syncEntityFromSource(entity: string, source: string): Promise<SyncResult> {
  return request<SyncResult>(`/sync/${encodeURIComponent(entity)}/${encodeURIComponent(source)}`, { method: 'POST' });
}

export async function listSources(): Promise<SourcesResponse> {
  return request<SourcesResponse>('/sources');
}

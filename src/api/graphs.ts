import type { Graph } from '@/types/graph';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_GRAPHS_API_URL ?? 'http://localhost:8004';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function listGraphs(): Promise<Graph[]> {
  return request<Graph[]>('/graphs');
}

export async function getGraph(id: string): Promise<Graph> {
  return request<Graph>(`/graphs/${id}`);
}

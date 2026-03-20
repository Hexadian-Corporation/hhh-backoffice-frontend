import type { LocationDistance, DistanceCreate } from '@/types/distance';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_MAPS_API_URL ?? 'http://localhost:8003';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** Get all distances FROM a specific location to its reachable neighbors */
export async function getLocationDistances(locationId: string): Promise<LocationDistance[]> {
  return request<LocationDistance[]>(`/locations/${locationId}/distances`);
}

/** List all distances */
export async function listDistances(): Promise<LocationDistance[]> {
  return request<LocationDistance[]>('/distances/');
}

/** Get a single distance record by ID */
export async function getDistance(id: string): Promise<LocationDistance> {
  return request<LocationDistance>(`/distances/${id}`);
}

/** Create or update a distance (upsert by from+to+travel_type pair) */
export async function createDistance(data: DistanceCreate): Promise<LocationDistance> {
  return request<LocationDistance>('/distances/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Delete a distance record by ID */
export async function deleteDistance(id: string): Promise<void> {
  const res = await authenticatedFetch(`${BASE}/distances/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
}

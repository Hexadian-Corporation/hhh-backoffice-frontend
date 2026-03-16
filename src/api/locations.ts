import type { Location, LocationCreate, LocationUpdate } from '@/types/location';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_MAPS_API_URL ?? 'http://localhost:8003';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function listLocations(params?: { location_type?: string; parent_id?: string }): Promise<Location[]> {
  const query = new URLSearchParams();
  if (params?.location_type) query.set('location_type', params.location_type);
  if (params?.parent_id) query.set('parent_id', params.parent_id);
  const qs = query.toString();
  return request<Location[]>(`/locations${qs ? `?${qs}` : ''}`);
}

export async function getLocation(id: string): Promise<Location> {
  return request<Location>(`/locations/${id}`);
}

export async function createLocation(data: LocationCreate): Promise<Location> {
  return request<Location>('/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLocation(id: string, data: LocationUpdate): Promise<Location> {
  return request<Location>(`/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLocation(id: string): Promise<void> {
  const res = await authenticatedFetch(`${BASE}/locations/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
}

export async function searchLocations(query: string): Promise<Location[]> {
  return request<Location[]>(`/locations/search?q=${encodeURIComponent(query)}`);
}

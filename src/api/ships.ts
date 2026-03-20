import type { Ship, ShipCreate, ShipUpdate } from '@/types/ship';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_SHIPS_API_URL ?? 'http://localhost:8002';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function listShips(): Promise<Ship[]> {
  return request<Ship[]>('/ships');
}

export async function getShip(id: string): Promise<Ship> {
  return request<Ship>(`/ships/${id}`);
}

export async function createShip(data: ShipCreate): Promise<Ship> {
  return request<Ship>('/ships', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateShip(id: string, data: ShipUpdate): Promise<Ship> {
  return request<Ship>(`/ships/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteShip(id: string): Promise<void> {
  const res = await authenticatedFetch(`${BASE}/ships/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
}

export async function searchShips(query: string): Promise<Ship[]> {
  return request<Ship[]>(`/ships/search?q=${encodeURIComponent(query)}`);
}

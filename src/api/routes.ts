import type { Route, RouteCreate } from '@/types/route';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_ROUTES_API_URL ?? 'http://localhost:8005';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function listRoutes(): Promise<Route[]> {
  return request<Route[]>('/routes');
}

export async function getRoute(id: string): Promise<Route> {
  return request<Route>(`/routes/${id}`);
}

export async function createRoute(data: RouteCreate): Promise<Route> {
  return request<Route>('/routes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteRoute(id: string): Promise<void> {
  const res = await authenticatedFetch(`${BASE}/routes/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
}

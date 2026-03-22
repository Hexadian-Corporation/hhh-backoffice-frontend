import type { FlightPlan, FlightPlanCreate, FlightPlanCreateResponse } from '@/types/flight-plan';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_ROUTES_API_URL ?? 'http://localhost:8005';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function listFlightPlans(): Promise<FlightPlan[]> {
  return request<FlightPlan[]>('/flight-plans');
}

export async function getFlightPlan(id: string): Promise<FlightPlan> {
  return request<FlightPlan>(`/flight-plans/${id}`);
}

export async function createFlightPlan(data: FlightPlanCreate): Promise<FlightPlanCreateResponse> {
  return request<FlightPlanCreateResponse>('/flight-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteFlightPlan(id: string): Promise<void> {
  const res = await authenticatedFetch(`${BASE}/flight-plans/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
}

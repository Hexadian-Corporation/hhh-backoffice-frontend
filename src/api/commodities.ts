import type { Commodity, CommodityCreate, CommodityUpdate } from '@/types/commodity';
import { authenticatedFetch } from '@/lib/api-client';

const BASE = import.meta.env.VITE_COMMODITIES_API_URL ?? 'http://localhost:8007';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(`${BASE}${path}`, init);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function listCommodities(): Promise<Commodity[]> {
  return request<Commodity[]>('/commodities');
}

export async function getCommodity(id: string): Promise<Commodity> {
  return request<Commodity>(`/commodities/${id}`);
}

export async function createCommodity(data: CommodityCreate): Promise<Commodity> {
  return request<Commodity>('/commodities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCommodity(id: string, data: CommodityUpdate): Promise<Commodity> {
  return request<Commodity>(`/commodities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCommodity(id: string): Promise<void> {
  const res = await authenticatedFetch(`${BASE}/commodities/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
}

export async function searchCommodities(query: string): Promise<Commodity[]> {
  return request<Commodity[]>(`/commodities/search?q=${encodeURIComponent(query)}`);
}

import type { Contract, ContractCreate, ContractUpdate } from '@/types/contract';

const BASE = import.meta.env.VITE_CONTRACTS_API_URL ?? 'http://localhost:8001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function listContracts(): Promise<Contract[]> {
  return request<Contract[]>('/contracts');
}

export async function getContract(id: string): Promise<Contract> {
  return request<Contract>(`/contracts/${id}`);
}

export async function createContract(data: ContractCreate): Promise<Contract> {
  return request<Contract>('/contracts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContract(id: string, data: ContractUpdate): Promise<Contract> {
  return request<Contract>(`/contracts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteContract(id: string): Promise<void> {
  const res = await fetch(`${BASE}/contracts/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
}

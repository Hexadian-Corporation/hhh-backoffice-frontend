import { vi, type Mock } from 'vitest';
import {
  listContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
} from '@/api/contracts';
import type { Contract, ContractCreate, ContractUpdate } from '@/types/contract';

const mockContract: Contract = {
  id: '1',
  title: 'Test Haul',
  description: 'Move cargo',
  faction: 'haul',
  hauling_orders: [
    {
      commodity: 'Laranite',
      scu_min: 50,
      scu_max: 100,
      max_container_scu: 32,
      pickup_location_id: 'loc-1',
      delivery_location_id: 'loc-2',
    },
  ],
  reward_uec: 50000,
  collateral_uec: 10000,
  deadline: '2026-06-01T12:00:00Z',
  requirements: {
    min_reputation: 3,
    required_ship_tags: ['cargo'],
    max_crew_size: null,
  },
  status: 'draft',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const BASE = 'http://localhost:8001';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockContract),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('listContracts', () => {
  it('sends GET /contracts and returns Contract[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockContract]),
    });

    const result = await listContracts();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/contracts`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual([mockContract]);
  });
});

describe('getContract', () => {
  it('sends GET /contracts/:id and returns Contract', async () => {
    const result = await getContract('1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/contracts/1`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual(mockContract);
  });
});

describe('createContract', () => {
  it('sends POST /contracts with body and returns Contract', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, created_at: _ca, updated_at: _ua, ...createData } = mockContract;
    const payload: ContractCreate = createData;

    const result = await createContract(payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockContract);
  });
});

describe('updateContract', () => {
  it('sends PUT /contracts/:id with body and returns Contract', async () => {
    const payload: ContractUpdate = { title: 'Updated Haul' };

    const result = await updateContract('1', payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/contracts/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockContract);
  });
});

describe('deleteContract', () => {
  it('sends DELETE /contracts/:id', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
    });

    await deleteContract('1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/contracts/1`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('error handling', () => {
  it('throws on non-ok response from request helper', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getContract('missing')).rejects.toThrow('API 404: Not Found');
  });

  it('throws on non-ok response from deleteContract', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(deleteContract('bad')).rejects.toThrow(
      'API 500: Internal Server Error',
    );
  });
});

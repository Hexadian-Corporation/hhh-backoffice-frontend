import { vi, type Mock } from 'vitest';
import {
  listShips,
  getShip,
  createShip,
  updateShip,
  deleteShip,
  searchShips,
} from '@/api/ships';
import type { Ship, ShipCreate, ShipUpdate } from '@/types/ship';

const mockShip: Ship = {
  id: 'ship-1',
  name: 'Caterpillar',
  manufacturer: 'Drake Interplanetary',
  cargo_holds: [{ name: 'Main Hold', volume_scu: 576 }],
  total_scu: 576,
  scm_speed: 110,
  quantum_speed: 217000000,
  landing_time_seconds: 120,
  loading_time_per_scu_seconds: 1,
};

const BASE = 'http://localhost:8002';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockShip),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('listShips', () => {
  it('sends GET /ships and returns Ship[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockShip]),
    });

    const result = await listShips();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/ships`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual([mockShip]);
  });
});

describe('getShip', () => {
  it('sends GET /ships/:id and returns Ship', async () => {
    const result = await getShip('ship-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/ships/ship-1`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual(mockShip);
  });
});

describe('createShip', () => {
  it('sends POST /ships with body and returns Ship', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...createData } = mockShip;
    const payload: ShipCreate = createData;

    const result = await createShip(payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/ships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockShip);
  });
});

describe('updateShip', () => {
  it('sends PUT /ships/:id with body and returns Ship', async () => {
    const payload: ShipUpdate = { name: 'Caterpillar Mk2' };

    const result = await updateShip('ship-1', payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/ships/ship-1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockShip);
  });
});

describe('deleteShip', () => {
  it('sends DELETE /ships/:id', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
    });

    await deleteShip('ship-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/ships/ship-1`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

describe('searchShips', () => {
  it('sends GET /ships/search?q=query and returns Ship[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockShip]),
    });

    const result = await searchShips('cater');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/ships/search?q=cater`,
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(result).toEqual([mockShip]);
  });

  it('encodes special characters in query', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await searchShips('drake & misc');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/ships/search?q=drake%20%26%20misc`,
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(result).toEqual([]);
  });
});

describe('error handling', () => {
  it('throws on non-ok response from request helper', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getShip('missing')).rejects.toThrow('API 404: Not Found');
  });

  it('throws on non-ok response from deleteShip', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(deleteShip('bad')).rejects.toThrow(
      'API 500: Internal Server Error',
    );
  });
});

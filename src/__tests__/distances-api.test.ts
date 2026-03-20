import { vi, type Mock } from 'vitest';
import {
  getLocationDistances,
  listDistances,
  getDistance,
  createDistance,
  deleteDistance,
} from '@/api/distances';
import type { LocationDistance, DistanceCreate } from '@/types/distance';

const mockDistance: LocationDistance = {
  id: 'dist-1',
  from_location_id: 'loc-1',
  to_location_id: 'loc-2',
  distance: 1500000,
  travel_type: 'quantum',
};

const BASE = 'http://localhost:8003';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockDistance),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getLocationDistances', () => {
  it('sends GET /locations/:id/distances and returns LocationDistance[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockDistance]),
    });

    const result = await getLocationDistances('loc-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/locations/loc-1/distances`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual([mockDistance]);
  });
});

describe('listDistances', () => {
  it('sends GET /distances/ and returns LocationDistance[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockDistance]),
    });

    const result = await listDistances();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/distances/`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual([mockDistance]);
  });
});

describe('getDistance', () => {
  it('sends GET /distances/:id and returns LocationDistance', async () => {
    const result = await getDistance('dist-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/distances/dist-1`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual(mockDistance);
  });
});

describe('createDistance', () => {
  it('sends POST /distances/ with body and returns LocationDistance', async () => {
    const payload: DistanceCreate = {
      from_location_id: 'loc-1',
      to_location_id: 'loc-2',
      distance: 1500000,
      travel_type: 'quantum',
    };

    const result = await createDistance(payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/distances/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockDistance);
  });
});

describe('deleteDistance', () => {
  it('sends DELETE /distances/:id', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
    });

    await deleteDistance('dist-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/distances/dist-1`, {
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

    await expect(getDistance('missing')).rejects.toThrow('API 404: Not Found');
  });

  it('throws on non-ok response from deleteDistance', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(deleteDistance('bad')).rejects.toThrow(
      'API 500: Internal Server Error',
    );
  });
});

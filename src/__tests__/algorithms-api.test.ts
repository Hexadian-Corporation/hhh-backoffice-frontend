import { vi, type Mock } from 'vitest';
import { getAlgorithmConfig, updateAlgorithmConfig } from '@/api/algorithms';
import type { AlgorithmConfig } from '@/types/algorithm';

vi.mock('@/lib/api-client', () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const mockConfig: AlgorithmConfig = {
  id: 'algo-config-1',
  entries: [
    { algorithm: 'dijkstra', enabled: true, complexity_min: 0, complexity_max: 100 },
    { algorithm: 'astar', enabled: true, complexity_min: 50, complexity_max: null },
    { algorithm: 'aco', enabled: false, complexity_min: 200, complexity_max: null },
    { algorithm: 'ford_fulkerson', enabled: false, complexity_min: 100, complexity_max: 500 },
  ],
};

const BASE = 'http://localhost:8005';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockConfig),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getAlgorithmConfig', () => {
  it('sends GET /algorithms/ and returns AlgorithmConfig', async () => {
    const result = await getAlgorithmConfig();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/algorithms/`, undefined);
    expect(result).toEqual(mockConfig);
  });
});

describe('updateAlgorithmConfig', () => {
  it('sends PUT /algorithms/ with entries payload', async () => {
    const update = { entries: mockConfig.entries };
    const result = await updateAlgorithmConfig(update);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/algorithms/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    expect(result).toEqual(mockConfig);
  });
});

describe('error handling', () => {
  it('throws on non-ok response for getAlgorithmConfig', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(getAlgorithmConfig()).rejects.toThrow('API 500: Internal Server Error');
  });

  it('throws on non-ok response for updateAlgorithmConfig', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
    });

    await expect(updateAlgorithmConfig({ entries: [] })).rejects.toThrow(
      'API 422: Unprocessable Entity',
    );
  });
});

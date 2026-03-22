import { vi, type Mock } from 'vitest';
import { listGraphs, getGraph } from '@/api/graphs';
import type { Graph } from '@/types/graph';

vi.mock('@/lib/api-client', () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const mockGraph: Graph = {
  id: 'graph-1',
  name: 'Inner Systems',
  hash: 'abc123',
  nodes: [
    { location_id: 'loc-1', label: 'Stanton' },
    { location_id: 'loc-2', label: 'Pyro' },
  ],
  edges: [
    {
      source_id: 'loc-1',
      target_id: 'loc-2',
      distance: 1234567,
      travel_type: 'quantum',
      travel_time_seconds: 300,
    },
  ],
};

const BASE = 'http://localhost:8004';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockGraph),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('listGraphs', () => {
  it('sends GET /graphs and returns Graph[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockGraph]),
    });

    const result = await listGraphs();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/graphs`, undefined);
    expect(result).toEqual([mockGraph]);
  });
});

describe('getGraph', () => {
  it('sends GET /graphs/:id and returns Graph', async () => {
    const result = await getGraph('graph-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/graphs/graph-1`, undefined);
    expect(result).toEqual(mockGraph);
  });
});

describe('error handling', () => {
  it('throws on non-ok response', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getGraph('missing')).rejects.toThrow('API 404: Not Found');
  });
});

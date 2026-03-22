import { vi, type Mock } from 'vitest';
import { syncAll, syncEntity, syncEntityFromSource, listSources } from '@/api/dataminer';

vi.mock('@/lib/api-client', () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const BASE = 'http://localhost:8008';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({}),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('syncAll', () => {
  it('sends POST /sync and returns SyncResponse', async () => {
    const mockResponse = { results: [{ entity: 'locations', count: 42 }] };
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await syncAll();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/sync`, { method: 'POST' });
    expect(result).toEqual(mockResponse);
  });

  it('throws on non-ok response', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: () => Promise.resolve('Forbidden'),
    });

    await expect(syncAll()).rejects.toThrow('API 403: Forbidden');
  });
});

describe('syncEntity', () => {
  it('sends POST /sync/{entity} and returns SyncResult', async () => {
    const mockResult = { entity: 'ships', count: 15 };
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    const result = await syncEntity('ships');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/sync/ships`, { method: 'POST' });
    expect(result).toEqual(mockResult);
  });
});

describe('syncEntityFromSource', () => {
  it('sends POST /sync/{entity}/{source} and returns SyncResult', async () => {
    const mockResult = { entity: 'commodities', count: 7 };
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    const result = await syncEntityFromSource('commodities', 'uex');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/sync/commodities/uex`, { method: 'POST' });
    expect(result).toEqual(mockResult);
  });
});

describe('listSources', () => {
  it('sends GET /sources and returns SourcesResponse', async () => {
    const mockResponse = { sources: [{ name: 'uex', available: true }] };
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await listSources();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/sources`, undefined);
    expect(result).toEqual(mockResponse);
  });
});

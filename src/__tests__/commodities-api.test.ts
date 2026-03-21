import { vi, type Mock } from 'vitest';
import {
  listCommodities,
  getCommodity,
  createCommodity,
  updateCommodity,
  deleteCommodity,
  searchCommodities,
} from '@/api/commodities';
import type { Commodity, CommodityCreate, CommodityUpdate } from '@/types/commodity';

vi.mock('@/lib/api-client', () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const mockCommodity: Commodity = {
  id: 'comm-1',
  name: 'Laranite',
  code: 'LARA',
};

const BASE = 'http://localhost:8007';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockCommodity),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('listCommodities', () => {
  it('sends GET /commodities and returns Commodity[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockCommodity]),
    });

    const result = await listCommodities();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/commodities`, undefined);
    expect(result).toEqual([mockCommodity]);
  });
});

describe('getCommodity', () => {
  it('sends GET /commodities/:id and returns Commodity', async () => {
    const result = await getCommodity('comm-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/commodities/comm-1`, undefined);
    expect(result).toEqual(mockCommodity);
  });
});

describe('createCommodity', () => {
  it('sends POST /commodities with body and returns Commodity', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...createData } = mockCommodity;
    const payload: CommodityCreate = createData;

    const result = await createCommodity(payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/commodities`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockCommodity);
  });
});

describe('updateCommodity', () => {
  it('sends PUT /commodities/:id with body and returns Commodity', async () => {
    const payload: CommodityUpdate = { name: 'Updated Laranite' };

    const result = await updateCommodity('comm-1', payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/commodities/comm-1`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockCommodity);
  });
});

describe('deleteCommodity', () => {
  it('sends DELETE /commodities/:id', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
    });

    await deleteCommodity('comm-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/commodities/comm-1`, {
      method: 'DELETE',
    });
  });
});

describe('searchCommodities', () => {
  it('sends GET /commodities/search?q=query and returns Commodity[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockCommodity]),
    });

    const result = await searchCommodities('lara');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/commodities/search?q=lara`,
      undefined,
    );
    expect(result).toEqual([mockCommodity]);
  });

  it('encodes special characters in query', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await searchCommodities('gold & silver');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/commodities/search?q=gold%20%26%20silver`,
      undefined,
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

    await expect(getCommodity('missing')).rejects.toThrow('API 404: Not Found');
  });

  it('throws on non-ok response from deleteCommodity', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(deleteCommodity('bad')).rejects.toThrow(
      'API 500: Internal Server Error',
    );
  });
});

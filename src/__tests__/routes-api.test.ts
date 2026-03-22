import { vi, type Mock } from 'vitest';
import { listRoutes, getRoute, createRoute, deleteRoute } from '@/api/routes';
import type { Route, RouteCreate } from '@/types/route';

vi.mock('@/lib/api-client', () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const mockRoute: Route = {
  id: 'route-1',
  stops: [
    {
      location_id: 'loc-1',
      location_name: 'Port Olisar',
      action: 'pickup',
      contract_id: 'contract-1',
      cargo_name: 'Laranite',
      cargo_scu: 32,
    },
  ],
  legs: [
    {
      from_location_id: 'loc-1',
      to_location_id: 'loc-2',
      distance: 1000000,
      travel_time_seconds: 300,
      travel_type: 'quantum',
    },
  ],
  total_distance: 1000000,
  total_time_seconds: 300,
  contracts_fulfilled: 1,
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
        json: () => Promise.resolve(mockRoute),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('listRoutes', () => {
  it('sends GET /routes and returns Route[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockRoute]),
    });

    const result = await listRoutes();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/routes`, undefined);
    expect(result).toEqual([mockRoute]);
  });
});

describe('getRoute', () => {
  it('sends GET /routes/:id and returns Route', async () => {
    const result = await getRoute('route-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/routes/route-1`, undefined);
    expect(result).toEqual(mockRoute);
  });
});

describe('createRoute', () => {
  it('sends POST /routes with body and returns Route', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...rest } = mockRoute;
    const payload: RouteCreate = {
      flight_plan_id: 'fp-1',
      strategy: 'min_time',
      ...rest,
    };

    const result = await createRoute(payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/routes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockRoute);
  });
});

describe('deleteRoute', () => {
  it('sends DELETE /routes/:id', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
    });

    await deleteRoute('route-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/routes/route-1`, {
      method: 'DELETE',
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

    await expect(getRoute('missing')).rejects.toThrow('API 404: Not Found');
  });

  it('throws on non-ok response from deleteRoute', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(deleteRoute('bad')).rejects.toThrow(
      'API 500: Internal Server Error',
    );
  });
});

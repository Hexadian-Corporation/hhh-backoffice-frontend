import { vi, type Mock } from 'vitest';
import {
  listFlightPlans,
  getFlightPlan,
  createFlightPlan,
  deleteFlightPlan,
} from '@/api/flight-plans';
import type {
  FlightPlan,
  FlightPlanCreate,
  FlightPlanCreateResponse,
  PrecomputedData,
} from '@/types/flight-plan';

vi.mock('@/lib/api-client', () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const mockFlightPlan: FlightPlan = {
  id: 'fp-1',
  contract_ids: ['contract-1'],
  ship_id: 'ship-1',
  cargo_limit_scu: null,
  distance_graph_id: 'graph-1',
  distance_route: null,
  time_route: null,
};

const mockPrecomputed: PrecomputedData = {
  flight_plan_id: 'fp-1',
  ship_total_scu: 576,
  cargo_limit_scu: null,
  distance_graph_id: 'graph-1',
  distance_edges: [],
  time_edges: [],
  hauling_orders: [],
  locations: [],
};

const mockCreateResponse: FlightPlanCreateResponse = {
  flight_plan: mockFlightPlan,
  precomputed: mockPrecomputed,
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
        json: () => Promise.resolve(mockFlightPlan),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('listFlightPlans', () => {
  it('sends GET /flight-plans and returns FlightPlan[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockFlightPlan]),
    });

    const result = await listFlightPlans();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/flight-plans`, undefined);
    expect(result).toEqual([mockFlightPlan]);
  });
});

describe('getFlightPlan', () => {
  it('sends GET /flight-plans/:id and returns FlightPlan', async () => {
    const result = await getFlightPlan('fp-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/flight-plans/fp-1`, undefined);
    expect(result).toEqual(mockFlightPlan);
  });
});

describe('createFlightPlan', () => {
  it('sends POST /flight-plans with body and returns FlightPlanCreateResponse', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCreateResponse),
    });

    const payload: FlightPlanCreate = {
      contract_ids: ['contract-1'],
      ship_id: 'ship-1',
    };

    const result = await createFlightPlan(payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/flight-plans`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockCreateResponse);
  });
});

describe('deleteFlightPlan', () => {
  it('sends DELETE /flight-plans/:id', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: 'No Content',
    });

    await deleteFlightPlan('fp-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/flight-plans/fp-1`, {
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

    await expect(getFlightPlan('missing')).rejects.toThrow('API 404: Not Found');
  });

  it('throws on non-ok response from deleteFlightPlan', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(deleteFlightPlan('bad')).rejects.toThrow(
      'API 500: Internal Server Error',
    );
  });
});

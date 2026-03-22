import { vi, type Mock } from 'vitest';
import { getPenaltyConfig, updatePenaltyConfig } from '@/api/penalties';
import type { PenaltyConfig, PenaltyConfigUpdate } from '@/types/penalty';

vi.mock('@/lib/api-client', () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const mockPenaltyConfig: PenaltyConfig = {
  id: 'penalty-1',
  time_base_per_scu: 10,
  box_size_penalties: [
    { box_size_scu: 1, multiplier: 1.0 },
    { box_size_scu: 32, multiplier: 1.5 },
  ],
  ship_penalties: [
    { ship_id: 'ship-1', multiplier: 1.2 },
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
        json: () => Promise.resolve(mockPenaltyConfig),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getPenaltyConfig', () => {
  it('sends GET /penalties and returns PenaltyConfig', async () => {
    const result = await getPenaltyConfig();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/penalties`, undefined);
    expect(result).toEqual(mockPenaltyConfig);
  });
});

describe('updatePenaltyConfig', () => {
  it('sends PUT /penalties with body and returns PenaltyConfig', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = mockPenaltyConfig;
    const payload: PenaltyConfigUpdate = updateData;

    const result = await updatePenaltyConfig(payload);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/penalties`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(mockPenaltyConfig);
  });
});

describe('error handling', () => {
  it('throws on non-ok response', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(getPenaltyConfig()).rejects.toThrow(
      'API 500: Internal Server Error',
    );
  });
});

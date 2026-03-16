import { vi, type Mock } from 'vitest';
import {
  exchangeCode,
  refreshToken,
  revokeToken,
} from '@/api/auth';

const BASE = 'http://localhost:8006';

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

describe('exchangeCode', () => {
  it('sends POST /auth/token/exchange with code and redirect_uri', async () => {
    const tokenResponse = {
      access_token: 'access-123',
      refresh_token: 'refresh-456',
    };
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(tokenResponse),
    });

    const result = await exchangeCode('auth-code', 'http://localhost:3001/callback');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/auth/token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'auth-code',
        redirect_uri: 'http://localhost:3001/callback',
      }),
    });
    expect(result).toEqual(tokenResponse);
  });

  it('throws on non-ok response', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    await expect(exchangeCode('bad', 'http://localhost:3001/callback'))
      .rejects.toThrow('API 400: Bad Request');
  });
});

describe('refreshToken', () => {
  it('sends POST /auth/token/refresh with refresh_token', async () => {
    const tokenResponse = {
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    };
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(tokenResponse),
    });

    const result = await refreshToken('old-refresh');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: 'old-refresh' }),
    });
    expect(result).toEqual(tokenResponse);
  });

  it('throws on non-ok response', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(refreshToken('expired')).rejects.toThrow('API 401: Unauthorized');
  });
});

describe('revokeToken', () => {
  it('sends POST /auth/token/revoke with refresh_token', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await revokeToken('refresh-to-revoke');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/auth/token/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: 'refresh-to-revoke' }),
    });
  });

  it('throws on non-ok response', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(revokeToken('bad')).rejects.toThrow('API 500: Internal Server Error');
  });
});

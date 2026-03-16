import { vi, type Mock } from 'vitest';
import { authenticatedFetch } from '@/lib/api-client';
import * as authLib from '@/lib/auth';

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

beforeEach(() => {
  localStorage.clear();
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

describe('authenticatedFetch', () => {
  it('adds Authorization header when a valid token exists', async () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    authLib.storeTokens(token, 'refresh');

    await authenticatedFetch('http://localhost:8001/contracts');

    expect(fetch).toHaveBeenCalledWith('http://localhost:8001/contracts', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  });

  it('makes request without Authorization when no token exists', async () => {
    await authenticatedFetch('http://localhost:8001/contracts');

    expect(fetch).toHaveBeenCalledWith('http://localhost:8001/contracts', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('passes through method and body', async () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    authLib.storeTokens(token, 'refresh');

    await authenticatedFetch('http://localhost:8001/contracts', {
      method: 'POST',
      body: JSON.stringify({ title: 'test' }),
    });

    expect(fetch).toHaveBeenCalledWith('http://localhost:8001/contracts', {
      method: 'POST',
      body: JSON.stringify({ title: 'test' }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  });

  it('refreshes token when access token is expired', async () => {
    const expiredToken = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    const newToken = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });

    authLib.storeTokens(expiredToken, 'valid-refresh');

    // First call: refresh token API
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: newToken,
            refresh_token: 'new-refresh',
          }),
      })
      // Second call: actual API request
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'result' }),
      });

    const res = await authenticatedFetch('http://localhost:8001/contracts');

    // First call should be to refresh endpoint
    expect((fetch as Mock).mock.calls[0][0]).toBe('http://localhost:8006/auth/token/refresh');
    // Second call should be the actual request with new token
    expect((fetch as Mock).mock.calls[1][0]).toBe('http://localhost:8001/contracts');
    expect((fetch as Mock).mock.calls[1][1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
      },
    });
    expect(res.ok).toBe(true);
  });

  it('clears tokens when refresh fails', async () => {
    const expiredToken = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    authLib.storeTokens(expiredToken, 'bad-refresh');

    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    await authenticatedFetch('http://localhost:8001/contracts');

    expect(authLib.getAccessToken()).toBeNull();
    expect(authLib.getRefreshToken()).toBeNull();
  });

  it('makes request without auth when no refresh token available and access expired', async () => {
    const expiredToken = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    localStorage.setItem('access_token', expiredToken);
    // No refresh token

    await authenticatedFetch('http://localhost:8001/contracts');

    expect(fetch).toHaveBeenCalledWith('http://localhost:8001/contracts', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
});

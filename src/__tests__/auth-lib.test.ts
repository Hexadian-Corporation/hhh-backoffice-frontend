import { vi } from 'vitest';
import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearTokens,
  isTokenExpired,
  getUserContext,
  storeState,
  getStoredState,
  clearState,
  storeReturnUrl,
  getReturnUrl,
  clearReturnUrl,
  redirectToLogin,
} from '@/lib/auth';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('storeTokens / getAccessToken / getRefreshToken', () => {
  it('stores and retrieves tokens', () => {
    storeTokens('access-123', 'refresh-456');
    expect(getAccessToken()).toBe('access-123');
    expect(getRefreshToken()).toBe('refresh-456');
  });

  it('returns null when no tokens stored', () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

describe('clearTokens', () => {
  it('removes stored tokens', () => {
    storeTokens('a', 'r');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

describe('isTokenExpired', () => {
  function makeJwt(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
  }

  it('returns false for a non-expired token', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for an expired token', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true when exp is missing', () => {
    const token = makeJwt({ sub: 'user-1' });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true for malformed token', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isTokenExpired('')).toBe(true);
  });
});

describe('getUserContext', () => {
  function makeJwt(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
  }

  it('returns null when no token is stored', () => {
    expect(getUserContext()).toBeNull();
  });

  it('decodes JWT claims into UserContext', () => {
    const token = makeJwt({
      sub: 'user-42',
      username: 'pilotx',
      groups: ['admins'],
      roles: ['admin'],
      permissions: ['contracts:write'],
      rsi_handle: 'PilotX',
      rsi_verified: true,
    });
    storeTokens(token, 'refresh');

    const ctx = getUserContext();
    expect(ctx).toEqual({
      userId: 'user-42',
      username: 'pilotx',
      groups: ['admins'],
      roles: ['admin'],
      permissions: ['contracts:write'],
      rsiHandle: 'PilotX',
      rsiVerified: true,
    });
  });

  it('uses defaults for missing claims', () => {
    const token = makeJwt({ sub: 'u1' });
    storeTokens(token, 'refresh');

    const ctx = getUserContext();
    expect(ctx).toEqual({
      userId: 'u1',
      username: '',
      groups: [],
      roles: [],
      permissions: [],
      rsiHandle: null,
      rsiVerified: false,
    });
  });

  it('returns null for malformed token', () => {
    localStorage.setItem('access_token', 'broken');
    expect(getUserContext()).toBeNull();
  });
});

describe('state management', () => {
  it('stores and retrieves state', () => {
    storeState('abc-123');
    expect(getStoredState()).toBe('abc-123');
  });

  it('clears state', () => {
    storeState('abc');
    clearState();
    expect(getStoredState()).toBeNull();
  });
});

describe('returnUrl management', () => {
  it('stores and retrieves return URL', () => {
    storeReturnUrl('/contracts?page=2');
    expect(getReturnUrl()).toBe('/contracts?page=2');
  });

  it('clears return URL', () => {
    storeReturnUrl('/x');
    clearReturnUrl();
    expect(getReturnUrl()).toBeNull();
  });
});

describe('redirectToLogin', () => {
  it('stores state and return URL in sessionStorage', () => {
    const mockUUID = 'mock-uuid-1234';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID as `${string}-${string}-${string}-${string}-${string}`);

    redirectToLogin('/contracts');

    expect(getStoredState()).toBe(mockUUID);
    expect(getReturnUrl()).toBe('/contracts');
  });

  it('does not store return URL if not provided', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('uuid' as `${string}-${string}-${string}-${string}-${string}`);

    redirectToLogin();

    expect(getReturnUrl()).toBeNull();
    expect(getStoredState()).toBe('uuid');
  });
});

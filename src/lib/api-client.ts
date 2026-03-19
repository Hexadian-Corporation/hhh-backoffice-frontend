import { getAccessToken, getRefreshToken, storeTokens, clearTokens, isTokenExpired } from './auth';
import type { TokenResponse } from '@/types/auth';

const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8006';

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(refreshTok: string): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_BASE}/auth/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshTok }),
  });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
  return res.json() as Promise<TokenResponse>;
}

async function getValidToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token && !isTokenExpired(token)) return token;

  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(refresh)
      .then(result => {
        storeTokens(result.access_token, result.refresh_token);
        refreshPromise = null;
        return result.access_token;
      })
      .catch(() => {
        clearTokens();
        refreshPromise = null;
        return null;
      });
  }

  return refreshPromise;
}

export async function authenticatedFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await getValidToken();
  return fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}

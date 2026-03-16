import type { UserContext } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const STATE_KEY = 'auth_state';
const RETURN_URL_KEY = 'auth_return_url';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (typeof payload.exp !== 'number') return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function getUserContext(): UserContext | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.sub ?? payload.user_id ?? '',
      username: payload.username ?? '',
      groups: payload.groups ?? [],
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
      rsiHandle: payload.rsi_handle ?? null,
      rsiVerified: payload.rsi_verified ?? false,
    };
  } catch {
    return null;
  }
}

export function storeState(state: string): void {
  sessionStorage.setItem(STATE_KEY, state);
}

export function getStoredState(): string | null {
  return sessionStorage.getItem(STATE_KEY);
}

export function clearState(): void {
  sessionStorage.removeItem(STATE_KEY);
}

export function storeReturnUrl(url: string): void {
  sessionStorage.setItem(RETURN_URL_KEY, url);
}

export function getReturnUrl(): string | null {
  return sessionStorage.getItem(RETURN_URL_KEY);
}

export function clearReturnUrl(): void {
  sessionStorage.removeItem(RETURN_URL_KEY);
}

const AUTH_PORTAL_URL = import.meta.env.VITE_AUTH_PORTAL_URL ?? 'http://localhost:3003';

export function redirectToLogin(returnUrl?: string): void {
  if (returnUrl) {
    storeReturnUrl(returnUrl);
  }
  const state = crypto.randomUUID();
  storeState(state);
  const callbackUrl = `${window.location.origin}/callback`;
  window.location.href = `${AUTH_PORTAL_URL}/login?redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}`;
}

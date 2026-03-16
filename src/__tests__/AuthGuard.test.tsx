import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import AuthGuard from '@/components/AuthGuard';
import * as authLib from '@/lib/auth';
import * as authApi from '@/api/auth';

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

vi.mock('@/api/auth', () => ({
  refreshToken: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AuthGuard', () => {
  it('renders children when a valid token exists', async () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    authLib.storeTokens(token, 'refresh');

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthGuard>
          <p>Protected Content</p>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    // No token — will eventually redirect, but first shows loading
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthGuard>
          <p>Protected Content</p>
        </AuthGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('refreshes expired token and renders children', async () => {
    const expiredToken = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    const newToken = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    authLib.storeTokens(expiredToken, 'valid-refresh');

    vi.mocked(authApi.refreshToken).mockResolvedValueOnce({
      access_token: newToken,
      refresh_token: 'new-refresh',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthGuard>
          <p>Protected Content</p>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(authApi.refreshToken).toHaveBeenCalledWith('valid-refresh');
    expect(authLib.getAccessToken()).toBe(newToken);
  });

  it('redirects to login when no token and no refresh', async () => {
    const mockUUID = 'test-state-uuid';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID as `${string}-${string}-${string}-${string}-${string}`);

    render(
      <MemoryRouter initialEntries={['/contracts']}>
        <AuthGuard>
          <p>Protected Content</p>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(authLib.getStoredState()).toBe(mockUUID);
    });

    expect(authLib.getReturnUrl()).toBe('/contracts');
  });

  it('redirects to login when refresh fails', async () => {
    const expiredToken = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    authLib.storeTokens(expiredToken, 'bad-refresh');

    vi.mocked(authApi.refreshToken).mockRejectedValueOnce(new Error('Refresh failed'));
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('state-id' as `${string}-${string}-${string}-${string}-${string}`);

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthGuard>
          <p>Protected Content</p>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(authLib.getStoredState()).toBe('state-id');
    });

    expect(authLib.getAccessToken()).toBeNull();
  });
});

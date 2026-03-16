import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { vi, type Mock } from 'vitest';
import CallbackPage from '@/pages/CallbackPage';
import * as authLib from '@/lib/auth';

vi.mock('@/api/auth', () => ({
  exchangeCode: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Dynamically import after mock is set up
async function getExchangeCode() {
  const mod = await import('@/api/auth');
  return mod.exchangeCode as Mock;
}

function renderCallback(searchParams: string) {
  return render(
    <MemoryRouter initialEntries={[`/callback${searchParams}`]}>
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/" element={<p>Dashboard</p>} />
        <Route path="/contracts" element={<p>Contracts Page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CallbackPage', () => {
  it('shows error when code is missing', async () => {
    renderCallback('?state=abc');

    await waitFor(() => {
      expect(screen.getByText('Missing code or state parameter')).toBeInTheDocument();
    });
  });

  it('shows error when state is missing', async () => {
    renderCallback('?code=auth-code');

    await waitFor(() => {
      expect(screen.getByText('Missing code or state parameter')).toBeInTheDocument();
    });
  });

  it('shows error when state does not match', async () => {
    authLib.storeState('expected-state');

    renderCallback('?code=auth-code&state=wrong-state');

    await waitFor(() => {
      expect(screen.getByText('Invalid state parameter')).toBeInTheDocument();
    });
  });

  it('exchanges code and redirects to stored return URL', async () => {
    const exchangeCode = await getExchangeCode();
    exchangeCode.mockResolvedValueOnce({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    });

    authLib.storeState('valid-state');
    authLib.storeReturnUrl('/contracts');

    renderCallback('?code=auth-code&state=valid-state');

    await waitFor(() => {
      expect(screen.getByText('Contracts Page')).toBeInTheDocument();
    });

    expect(exchangeCode).toHaveBeenCalledWith('auth-code', expect.stringContaining('/callback'));
    expect(authLib.getAccessToken()).toBe('new-access');
    expect(authLib.getRefreshToken()).toBe('new-refresh');
    expect(authLib.getStoredState()).toBeNull();
    expect(authLib.getReturnUrl()).toBeNull();
  });

  it('redirects to / when no return URL is stored', async () => {
    const exchangeCode = await getExchangeCode();
    exchangeCode.mockResolvedValueOnce({
      access_token: 'access',
      refresh_token: 'refresh',
    });

    authLib.storeState('state-1');

    renderCallback('?code=code-1&state=state-1');

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('shows error when exchange fails', async () => {
    const exchangeCode = await getExchangeCode();
    exchangeCode.mockRejectedValueOnce(new Error('Exchange failed'));

    authLib.storeState('state-1');

    renderCallback('?code=bad-code&state=state-1');

    await waitFor(() => {
      expect(screen.getByText('Failed to exchange authorization code')).toBeInTheDocument();
    });
  });

  it('shows Authenticating… while processing', () => {
    authLib.storeState('state-1');

    renderCallback('?code=code-1&state=state-1');

    expect(screen.getByText('Authenticating…')).toBeInTheDocument();
  });
});

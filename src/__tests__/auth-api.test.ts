import { vi, type Mock } from 'vitest';
import {
  getUsers,
  getUser,
  startVerification,
  confirmVerification,
} from '@/api/auth';
import type { User, VerificationResult } from '@/types/user';

const mockUser: User = {
  _id: 'user-1',
  username: 'testpilot',
  email: 'test@example.com',
  roles: ['user'],
  is_active: true,
  rsi_handle: 'TestPilot',
  rsi_verified: false,
};

const mockVerification: VerificationResult = {
  verification_code: 'abc123',
  verified: false,
  message: 'Code generated',
};

const BASE = 'http://localhost:8006';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockUser),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getUsers', () => {
  it('sends GET /auth/users and returns User[]', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockUser]),
    });

    const result = await getUsers();

    expect(fetch).toHaveBeenCalledWith(`${BASE}/auth/users`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual([mockUser]);
  });
});

describe('getUser', () => {
  it('sends GET /auth/users/:id and returns User', async () => {
    const result = await getUser('user-1');

    expect(fetch).toHaveBeenCalledWith(`${BASE}/auth/users/user-1`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual(mockUser);
  });
});

describe('startVerification', () => {
  it('sends POST /auth/verify/start with user_id and body', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVerification),
    });

    const result = await startVerification('user-1', 'TestPilot');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/auth/verify/start?user_id=user-1`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsi_handle: 'TestPilot' }),
      },
    );
    expect(result).toEqual(mockVerification);
  });

  it('encodes special characters in user_id', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVerification),
    });

    await startVerification('user id&special', 'Handle');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/auth/verify/start?user_id=user%20id%26special`,
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('confirmVerification', () => {
  it('sends POST /auth/verify/confirm with user_id', async () => {
    const confirmResult: VerificationResult = {
      verification_code: null,
      verified: true,
      message: 'Verified',
    };
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(confirmResult),
    });

    const result = await confirmVerification('user-1');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/auth/verify/confirm?user_id=user-1`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    );
    expect(result).toEqual(confirmResult);
  });
});

describe('error handling', () => {
  it('throws on non-ok response', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getUser('missing')).rejects.toThrow('API 404: Not Found');
  });

  it('throws on non-ok response from startVerification', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(startVerification('user-1', 'Handle')).rejects.toThrow(
      'API 500: Internal Server Error',
    );
  });
});

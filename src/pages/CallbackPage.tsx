import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import {
  getStoredState,
  clearState,
  getReturnUrl,
  clearReturnUrl,
  storeTokens,
} from '@/lib/auth';
import { exchangeCode } from '@/api/auth';

function getCallbackUrl(): string {
  return `${window.location.origin}/callback`;
}

export default function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        setError('Missing code or state parameter');
        return;
      }

      const storedState = getStoredState();
      if (state !== storedState) {
        setError('Invalid state parameter');
        return;
      }

      clearState();

      try {
        const result = await exchangeCode(code, getCallbackUrl());
        storeTokens(result.access_token, result.refresh_token);
        const returnUrl = getReturnUrl() ?? '/';
        clearReturnUrl();
        navigate(returnUrl, { replace: true });
      } catch {
        setError('Failed to exchange authorization code');
      }
    }

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Authentication Error</p>
          <p className="text-[var(--color-text-muted)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
      <p className="text-[var(--color-text-muted)]">Authenticating…</p>
    </div>
  );
}

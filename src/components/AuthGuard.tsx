import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import {
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  storeTokens,
  clearTokens,
  redirectToLogin,
  hasAnyPermission,
} from '@/lib/auth';
import { refreshToken } from '@/api/auth';
import ForbiddenPage from '@/pages/ForbiddenPage';

const BACKOFFICE_PERMISSIONS = [
  "hhh:locations:write",
  "hhh:commodities:write",
  "hhh:ships:write",
  "hhh:graphs:write",
  "hhh:routes:write",
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const token = getAccessToken();

      if (token && !isTokenExpired(token)) {
        if (!cancelled) setIsAuthenticated(true);
        return;
      }

      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const result = await refreshToken(refresh);
          storeTokens(result.access_token, result.refresh_token);
          if (!cancelled) setIsAuthenticated(true);
          return;
        } catch {
          clearTokens();
        }
      }

      if (!cancelled) {
        redirectToLogin(location.pathname + location.search);
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-muted)]">Loading…</p>
      </div>
    );
  }

  if (!hasAnyPermission(BACKOFFICE_PERMISSIONS)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}

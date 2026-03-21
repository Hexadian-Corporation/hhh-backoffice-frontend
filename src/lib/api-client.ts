import {
  createLocalStorage,
  createAuthApiClient,
  createAuthenticatedFetch,
} from '@hexadian-corporation/auth-core';

const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8006';

const tokenStorage = createLocalStorage();
const authApiClient = createAuthApiClient(AUTH_BASE);

export const authenticatedFetch = createAuthenticatedFetch({
  tokenStorage,
  authApiClient,
});

import type { AuthApiClient } from './api.js';
import type { TokenStorage } from './storage.js';
export interface AuthenticatedFetchOptions {
    tokenStorage: TokenStorage;
    authApiClient: AuthApiClient;
    onAuthFailure?: () => void;
}
export declare function createAuthenticatedFetch(options: AuthenticatedFetchOptions): typeof fetch;
//# sourceMappingURL=authenticated-fetch.d.ts.map
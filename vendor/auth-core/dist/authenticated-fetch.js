import { isTokenExpired } from './jwt.js';
export function createAuthenticatedFetch(options) {
    const { tokenStorage, authApiClient, onAuthFailure } = options;
    let refreshPromise = null;
    async function doRefresh() {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
            tokenStorage.clearTokens();
            onAuthFailure?.();
            throw new Error('No refresh token available');
        }
        try {
            const tokenPair = await authApiClient.refreshToken(refreshToken);
            tokenStorage.storeTokens(tokenPair.accessToken, tokenPair.refreshToken);
        }
        catch (err) {
            tokenStorage.clearTokens();
            onAuthFailure?.();
            throw err;
        }
    }
    function ensureRefreshed() {
        if (!refreshPromise) {
            refreshPromise = doRefresh().finally(() => {
                refreshPromise = null;
            });
        }
        return refreshPromise;
    }
    function buildHeaders(initHeaders, token) {
        const headers = new Headers(initHeaders);
        if (token !== null) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }
    return async function authenticatedFetch(input, init) {
        const currentToken = tokenStorage.getAccessToken();
        if (currentToken !== null && isTokenExpired(currentToken)) {
            await ensureRefreshed();
        }
        const accessToken = tokenStorage.getAccessToken();
        const response = await fetch(input, {
            ...init,
            headers: buildHeaders(init?.headers, accessToken),
        });
        if (response.status === 401) {
            try {
                await ensureRefreshed();
            }
            catch {
                return response;
            }
            const newToken = tokenStorage.getAccessToken();
            return fetch(input, {
                ...init,
                headers: buildHeaders(init?.headers, newToken),
            });
        }
        return response;
    };
}
//# sourceMappingURL=authenticated-fetch.js.map
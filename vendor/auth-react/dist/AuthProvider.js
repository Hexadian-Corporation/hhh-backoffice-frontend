import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useMemo, useState, } from 'react';
import { createLocalStorage, createAuthApiClient, createOAuthStateManager, createAuthenticatedFetch, extractUserContext, redirectToLogin, hasPermission as coreHasPermission, hasAnyPermission as coreHasAnyPermission, isTokenExpired, } from '@hexadian-corporation/auth-core';
import { AuthContext } from './AuthContext.js';
export function AuthProvider({ config, children, LoadingComponent, }) {
    const tokenStorage = useMemo(() => {
        const prefix = config.storagePrefix
            ? `${config.storagePrefix}_`
            : undefined;
        return createLocalStorage(prefix);
    }, [config.storagePrefix]);
    const [user, setUser] = useState(() => {
        const token = tokenStorage.getAccessToken();
        return token ? extractUserContext(token) : null;
    });
    const services = useMemo(() => {
        const authApiClient = createAuthApiClient(config.authServiceUrl);
        const oauthStateManager = createOAuthStateManager();
        const authFetch = createAuthenticatedFetch({
            tokenStorage,
            authApiClient,
            onAuthFailure: () => setUser(null),
        });
        return { tokenStorage, authApiClient, oauthStateManager, authFetch };
    }, [config.authServiceUrl, tokenStorage]);
    const login = useCallback((returnUrl) => {
        redirectToLogin(config, services.oauthStateManager, returnUrl);
    }, [config, services.oauthStateManager]);
    const tryRefresh = useCallback(async () => {
        const refreshToken = services.tokenStorage.getRefreshToken();
        if (!refreshToken)
            return false;
        const accessToken = services.tokenStorage.getAccessToken();
        if (accessToken && !isTokenExpired(accessToken))
            return true;
        try {
            const tokenPair = await services.authApiClient.refreshToken(refreshToken);
            services.tokenStorage.storeTokens(tokenPair.accessToken, tokenPair.refreshToken);
            const userCtx = extractUserContext(tokenPair.accessToken);
            if (userCtx)
                setUser(userCtx);
            return userCtx !== null;
        }
        catch {
            return false;
        }
    }, [services]);
    const logout = useCallback(async () => {
        const refreshToken = services.tokenStorage.getRefreshToken();
        if (refreshToken) {
            try {
                await services.authApiClient.revokeToken(refreshToken);
            }
            catch {
                // Ignore revocation errors
            }
        }
        services.tokenStorage.clearTokens();
        setUser(null);
    }, [services]);
    const handleCallback = useCallback(async (code, state) => {
        const { valid, returnUrl } = services.oauthStateManager.validate(state);
        if (!valid)
            throw new Error('Invalid OAuth state (CSRF check failed)');
        services.oauthStateManager.clear();
        const tokenPair = await services.authApiClient.exchangeCode(code, config.redirectUri);
        services.tokenStorage.storeTokens(tokenPair.accessToken, tokenPair.refreshToken);
        const userCtx = extractUserContext(tokenPair.accessToken);
        if (userCtx)
            setUser(userCtx);
        return { returnUrl: returnUrl || '/' };
    }, [config.redirectUri, services]);
    const contextValue = useMemo(() => ({
        user,
        isAuthenticated: user !== null,
        isLoading: false,
        login,
        logout,
        tryRefresh,
        authFetch: services.authFetch,
        hasPermission: (permission) => coreHasPermission(user?.permissions ?? [], permission),
        hasAnyPermission: (permissions) => coreHasAnyPermission(user?.permissions ?? [], permissions),
        handleCallback,
    }), [user, login, logout, tryRefresh, services.authFetch, handleCallback]);
    if (contextValue.isLoading && LoadingComponent) {
        return _jsx(LoadingComponent, {});
    }
    return (_jsx(AuthContext.Provider, { value: contextValue, children: children }));
}
//# sourceMappingURL=AuthProvider.js.map
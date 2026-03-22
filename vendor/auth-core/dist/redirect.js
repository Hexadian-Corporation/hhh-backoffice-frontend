export function buildLoginUrl(config, returnUrl) {
    const url = new URL('/login', config.authPortalUrl ?? config.authServiceUrl);
    url.searchParams.set('redirect_uri', config.redirectUri);
    if (returnUrl !== undefined) {
        url.searchParams.set('return_url', returnUrl);
    }
    return url.toString();
}
export function redirectToLogin(config, stateManager, returnUrl) {
    const state = stateManager.generateAndStore(returnUrl ?? '');
    const url = new URL('/login', config.authPortalUrl ?? config.authServiceUrl);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('state', state);
    globalThis.location.href = url.toString();
}
//# sourceMappingURL=redirect.js.map
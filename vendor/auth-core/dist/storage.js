export function createLocalStorage(prefix = 'hexadian_auth_') {
    const accessKey = `${prefix}access_token`;
    const refreshKey = `${prefix}refresh_token`;
    return {
        getAccessToken() {
            return localStorage.getItem(accessKey);
        },
        getRefreshToken() {
            return localStorage.getItem(refreshKey);
        },
        storeTokens(accessToken, refreshToken) {
            localStorage.setItem(accessKey, accessToken);
            localStorage.setItem(refreshKey, refreshToken);
        },
        clearTokens() {
            localStorage.removeItem(accessKey);
            localStorage.removeItem(refreshKey);
        },
    };
}
//# sourceMappingURL=storage.js.map
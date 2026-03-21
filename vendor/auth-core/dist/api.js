export class AuthApiError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = 'AuthApiError';
    }
}
export function createAuthApiClient(baseUrl) {
    const base = baseUrl.replace(/\/+$/, '');
    async function post(path, body) {
        const response = await fetch(`${base}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            let message = response.statusText;
            try {
                const json = (await response.json());
                message = json.detail ?? json.message ?? message;
            }
            catch {
                // ignore parse errors
            }
            throw new AuthApiError(response.status, message);
        }
        return response.json();
    }
    function toTokenPair(raw) {
        return { accessToken: raw.access_token, refreshToken: raw.refresh_token };
    }
    return {
        async exchangeCode(code, redirectUri) {
            const raw = await post('/auth/token/exchange', {
                code,
                redirect_uri: redirectUri,
            });
            return toTokenPair(raw);
        },
        async refreshToken(refreshToken) {
            const raw = await post('/auth/token/refresh', {
                refresh_token: refreshToken,
            });
            return toTokenPair(raw);
        },
        async revokeToken(refreshToken) {
            await post('/auth/token/revoke', { refresh_token: refreshToken });
        },
    };
}
//# sourceMappingURL=api.js.map
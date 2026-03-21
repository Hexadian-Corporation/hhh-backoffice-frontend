export function decodeJwtPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const json = atob(padded);
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
export function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number')
        return true;
    return payload.exp * 1000 <= Date.now();
}
export function extractUserContext(token) {
    const payload = decodeJwtPayload(token);
    if (!payload)
        return null;
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
        return null;
    }
    if (typeof payload.sub !== 'string' || typeof payload.username !== 'string') {
        return null;
    }
    return {
        userId: payload.sub,
        username: payload.username,
        groups: asStringArray(payload.groups),
        roles: asStringArray(payload.roles),
        permissions: asStringArray(payload.permissions),
        rsiHandle: typeof payload.rsi_handle === 'string' ? payload.rsi_handle : null,
        rsiVerified: payload.rsi_verified === true,
    };
}
function asStringArray(value) {
    return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
}
//# sourceMappingURL=jwt.js.map
export interface UserContext {
    userId: string;
    username: string;
    groups: string[];
    roles: string[];
    permissions: string[];
    rsiHandle: string | null;
    rsiVerified: boolean;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}
export interface AuthConfig {
    authServiceUrl: string;
    /** Base URL of the auth portal frontend. Used for login redirects. Defaults to authServiceUrl. */
    authPortalUrl?: string;
    clientId: string;
    redirectUri: string;
    storagePrefix?: string;
    autoRefresh?: boolean;
}
//# sourceMappingURL=types.d.ts.map
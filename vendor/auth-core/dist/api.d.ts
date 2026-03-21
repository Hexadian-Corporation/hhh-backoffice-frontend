import type { TokenPair } from './types.js';
export declare class AuthApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
export interface AuthApiClient {
    exchangeCode(code: string, redirectUri: string): Promise<TokenPair>;
    refreshToken(refreshToken: string): Promise<TokenPair>;
    revokeToken(refreshToken: string): Promise<void>;
}
export declare function createAuthApiClient(baseUrl: string): AuthApiClient;
//# sourceMappingURL=api.d.ts.map
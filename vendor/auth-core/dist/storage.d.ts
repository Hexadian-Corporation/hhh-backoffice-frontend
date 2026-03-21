export interface TokenStorage {
    getAccessToken(): string | null;
    getRefreshToken(): string | null;
    storeTokens(accessToken: string, refreshToken: string): void;
    clearTokens(): void;
}
export declare function createLocalStorage(prefix?: string): TokenStorage;
//# sourceMappingURL=storage.d.ts.map
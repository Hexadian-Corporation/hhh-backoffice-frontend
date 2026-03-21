export interface OAuthStateManager {
    generateAndStore(returnUrl: string): string;
    validate(state: string): {
        valid: boolean;
        returnUrl: string | null;
    };
    clear(): void;
}
export declare function createOAuthStateManager(storage?: Storage): OAuthStateManager;
//# sourceMappingURL=oauth-state.d.ts.map
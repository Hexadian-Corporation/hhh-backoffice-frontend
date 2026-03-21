import type { OAuthStateManager } from './oauth-state.js';
import type { AuthConfig } from './types.js';
export declare function buildLoginUrl(config: AuthConfig, returnUrl?: string): string;
export declare function redirectToLogin(config: AuthConfig, stateManager: OAuthStateManager, returnUrl?: string): void;
//# sourceMappingURL=redirect.d.ts.map
import type { UserContext } from '@hexadian-corporation/auth-core';
export interface AuthContextValue {
    user: UserContext | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (returnUrl?: string) => void;
    logout: () => Promise<void>;
    tryRefresh: () => Promise<boolean>;
    authFetch: typeof fetch;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    handleCallback: (code: string, state: string) => Promise<{
        returnUrl: string;
    }>;
}
export declare const AuthContext: import("react").Context<AuthContextValue | null>;
//# sourceMappingURL=AuthContext.d.ts.map
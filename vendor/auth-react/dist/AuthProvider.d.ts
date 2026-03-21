import type { ReactNode, ComponentType } from 'react';
import type { AuthConfig } from '@hexadian-corporation/auth-core';
export interface AuthProviderProps {
    config: AuthConfig;
    children: ReactNode;
    LoadingComponent?: ComponentType;
}
export declare function AuthProvider({ config, children, LoadingComponent, }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AuthProvider.d.ts.map
import type { ReactNode } from 'react';
export interface AuthGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
}
export declare function AuthGuard({ children, fallback }: AuthGuardProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=AuthGuard.d.ts.map
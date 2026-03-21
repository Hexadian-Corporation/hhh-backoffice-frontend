import type { ReactNode } from 'react';
export interface PermissionGuardProps {
    required: string | string[];
    children: ReactNode;
    fallback?: ReactNode;
}
export declare function PermissionGuard({ required, children, fallback, }: PermissionGuardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=PermissionGuard.d.ts.map
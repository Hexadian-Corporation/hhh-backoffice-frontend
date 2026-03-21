import type { ComponentType } from 'react';
export interface CallbackHandlerProps {
    onSuccess?: (returnUrl: string) => void;
    onError?: (error: Error) => void;
    LoadingComponent?: ComponentType;
    ErrorComponent?: ComponentType<{
        error: Error;
    }>;
}
export declare function CallbackHandler({ onSuccess, onError, LoadingComponent, ErrorComponent, }: CallbackHandlerProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=CallbackHandler.d.ts.map
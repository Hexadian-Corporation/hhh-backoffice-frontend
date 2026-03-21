import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth.js';
export function CallbackHandler({ onSuccess, onError, LoadingComponent, ErrorComponent, }) {
    const { handleCallback } = useAuth();
    const [error, setError] = useState(() => {
        const params = new URLSearchParams(globalThis.location.search);
        if (!params.get('code') || !params.get('state')) {
            return new Error('Missing code or state in callback URL');
        }
        return null;
    });
    const [done, setDone] = useState(false);
    const hasRun = useRef(false);
    useEffect(() => {
        if (hasRun.current)
            return;
        hasRun.current = true;
        if (error) {
            onError?.(error);
            return;
        }
        const params = new URLSearchParams(globalThis.location.search);
        const code = params.get('code');
        const state = params.get('state');
        handleCallback(code, state)
            .then(({ returnUrl }) => {
            setDone(true);
            if (onSuccess) {
                onSuccess(returnUrl);
            }
            else {
                globalThis.location.href = returnUrl;
            }
        })
            .catch((err) => {
            const callbackError = err instanceof Error ? err : new Error(String(err));
            setError(callbackError);
            onError?.(callbackError);
        });
    }, [handleCallback, onSuccess, onError, error]);
    if (error && ErrorComponent) {
        return _jsx(ErrorComponent, { error: error });
    }
    if (!done && !error && LoadingComponent) {
        return _jsx(LoadingComponent, {});
    }
    return null;
}
//# sourceMappingURL=CallbackHandler.js.map
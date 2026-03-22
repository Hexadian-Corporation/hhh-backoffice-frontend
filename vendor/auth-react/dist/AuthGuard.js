import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth.js';
export function AuthGuard({ children, fallback = null }) {
    const { isAuthenticated, isLoading, login, tryRefresh } = useAuth();
    const [isChecking, setIsChecking] = useState(!isAuthenticated);
    const hasChecked = useRef(false);
    useEffect(() => {
        if (isAuthenticated || hasChecked.current)
            return;
        hasChecked.current = true;
        tryRefresh().then((refreshed) => {
            if (!refreshed) {
                login(window.location.pathname + window.location.search + window.location.hash);
            }
            setIsChecking(false);
        });
    }, [isAuthenticated, login, tryRefresh]);
    if (isLoading || (isChecking && !isAuthenticated)) {
        return _jsx(_Fragment, { children: fallback });
    }
    if (!isAuthenticated) {
        return null;
    }
    return _jsx(_Fragment, { children: children });
}
//# sourceMappingURL=AuthGuard.js.map
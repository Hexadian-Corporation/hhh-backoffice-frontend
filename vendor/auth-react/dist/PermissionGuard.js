import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useAuth } from './useAuth.js';
export function PermissionGuard({ required, children, fallback = null, }) {
    const { hasPermission, hasAnyPermission } = useAuth();
    const permitted = Array.isArray(required)
        ? hasAnyPermission(required)
        : hasPermission(required);
    if (!permitted) {
        return _jsx(_Fragment, { children: fallback });
    }
    return _jsx(_Fragment, { children: children });
}
//# sourceMappingURL=PermissionGuard.js.map
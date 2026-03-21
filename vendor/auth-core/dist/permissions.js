export function hasPermission(permissions, permission) {
    return permissions.includes(permission);
}
export function hasAnyPermission(permissions, required) {
    return required.some((p) => permissions.includes(p));
}
export function hasAllPermissions(permissions, required) {
    return required.every((p) => permissions.includes(p));
}
//# sourceMappingURL=permissions.js.map
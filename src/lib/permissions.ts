import { getUserContext, hasPermission as authHasPermission, hasAnyPermission as authHasAnyPermission } from '@/lib/auth';

export { authHasPermission as hasPermission, authHasAnyPermission as hasAnyPermission };

export function usePermissions(): string[] {
  const ctx = getUserContext();
  return ctx?.permissions ?? [];
}

import { getUserContext } from '@/lib/auth';

export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function hasAnyPermission(permissions: string[], required: string[]): boolean {
  return required.some((p) => permissions.includes(p));
}

export function usePermissions(): string[] {
  const ctx = getUserContext();
  return ctx?.permissions ?? [];
}

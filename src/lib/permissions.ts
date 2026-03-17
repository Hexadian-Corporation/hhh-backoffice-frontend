import { getUserContext } from '@/lib/auth';

export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required);
}

export function hasAnyPermission(permissions: string[], required: string[]): boolean {
  return required.some((p) => permissions.includes(p));
}

export function usePermissions(): string[] {
  const ctx = getUserContext();
  return ctx?.permissions ?? [];
}

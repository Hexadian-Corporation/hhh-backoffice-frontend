import { usePermissions, hasAnyPermission } from '@/lib/permissions';
import InsufficientPermissionsPage from '@/pages/InsufficientPermissionsPage';

interface PermissionGuardProps {
  required: string[];
  children: React.ReactNode;
}

export default function PermissionGuard({ required, children }: PermissionGuardProps) {
  const permissions = usePermissions();

  if (!hasAnyPermission(permissions, required)) {
    return <InsufficientPermissionsPage />;
  }

  return <>{children}</>;
}

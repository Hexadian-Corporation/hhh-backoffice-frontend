import { usePermissions, hasAnyPermission } from '@/lib/permissions';
import ForbiddenPage from '@/pages/ForbiddenPage';

interface PermissionGuardProps {
  required: string[];
  children: React.ReactNode;
}

export default function PermissionGuard({ required, children }: PermissionGuardProps) {
  const permissions = usePermissions();

  if (!hasAnyPermission(permissions, required)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}

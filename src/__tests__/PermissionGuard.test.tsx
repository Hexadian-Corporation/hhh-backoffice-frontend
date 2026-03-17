import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

const mockUsePermissions = vi.fn<() => string[]>(() => []);
const mockHasAnyPermission = vi.fn(
  (perms: string[], req: string[]) => req.some((p: string) => perms.includes(p)),
);

vi.mock("@/lib/permissions", () => ({
  usePermissions: (...args: unknown[]) => mockUsePermissions(...(args as [])),
  hasAnyPermission: (...args: unknown[]) => mockHasAnyPermission(...(args as [string[], string[]])),
}));

import PermissionGuard from "@/components/PermissionGuard";

afterEach(() => {
  vi.clearAllMocks();
});

describe("PermissionGuard", () => {
  it("renders children when user has the required permission", () => {
    mockUsePermissions.mockReturnValue(["hhh:contracts:read", "hhh:contracts:write"]);

    render(
      <MemoryRouter>
        <PermissionGuard required={["hhh:contracts:read"]}>
          <p>Protected Content</p>
        </PermissionGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("renders InsufficientPermissionsPage when user lacks the required permission", () => {
    mockUsePermissions.mockReturnValue(["hhh:locations:read"]);

    render(
      <MemoryRouter>
        <PermissionGuard required={["hhh:contracts:read"]}>
          <p>Protected Content</p>
        </PermissionGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText("Insufficient Permissions")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders InsufficientPermissionsPage when user has no permissions", () => {
    mockUsePermissions.mockReturnValue([]);

    render(
      <MemoryRouter>
        <PermissionGuard required={["auth:users:read"]}>
          <p>Admin Panel</p>
        </PermissionGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText("Insufficient Permissions")).toBeInTheDocument();
    expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
  });

  it("renders children when user has any of the required permissions", () => {
    mockUsePermissions.mockReturnValue(["hhh:contracts:write"]);

    render(
      <MemoryRouter>
        <PermissionGuard required={["hhh:contracts:read", "hhh:contracts:write"]}>
          <p>Editable Content</p>
        </PermissionGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText("Editable Content")).toBeInTheDocument();
  });
});

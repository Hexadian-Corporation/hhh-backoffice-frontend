import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const mockHasAnyPermission = vi.fn<(ps: string[]) => boolean>(() => false);

vi.mock("@hexadian-corporation/auth-react", () => ({
  useAuth: () => ({
    user: { username: "admin", permissions: [] },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    tryRefresh: vi.fn(),
    authFetch: vi.fn(),
    hasPermission: vi.fn(() => false),
    hasAnyPermission: (...args: unknown[]) => mockHasAnyPermission(...(args as [string[]])),
    handleCallback: vi.fn(),
  }),
  PermissionGuard: ({ required, children }: { required: string[]; children: React.ReactNode }) =>
    mockHasAnyPermission(required)
      ? children
      : (<p>Insufficient Permissions</p>),
}));

import { PermissionGuard } from "@hexadian-corporation/auth-react";

afterEach(() => {
  vi.clearAllMocks();
});

describe("PermissionGuard", () => {
  it("renders children when user has the required permission", () => {
    const perms = ["hhh:contracts:read", "hhh:contracts:write"];
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

    render(
      <PermissionGuard required={["hhh:contracts:read"]}>
        <p>Protected Content</p>
      </PermissionGuard>,
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("renders InsufficientPermissionsPage when user lacks the required permission", () => {
    const perms = ["hhh:locations:read"];
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

    render(
      <PermissionGuard required={["hhh:contracts:read"]}>
        <p>Protected Content</p>
      </PermissionGuard>,
    );

    expect(screen.getByText("Insufficient Permissions")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders InsufficientPermissionsPage when user has no permissions", () => {
    mockHasAnyPermission.mockReturnValue(false);

    render(
      <PermissionGuard required={["auth:users:read"]}>
        <p>Admin Panel</p>
      </PermissionGuard>,
    );

    expect(screen.getByText("Insufficient Permissions")).toBeInTheDocument();
    expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
  });

  it("renders children when user has any of the required permissions", () => {
    const perms = ["hhh:contracts:write"];
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

    render(
      <PermissionGuard required={["hhh:contracts:read", "hhh:contracts:write"]}>
        <p>Editable Content</p>
      </PermissionGuard>,
    );

    expect(screen.getByText("Editable Content")).toBeInTheDocument();
  });
});

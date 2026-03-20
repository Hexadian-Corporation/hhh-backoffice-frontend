import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

const mockUsePermissions = vi.fn<() => string[]>(() => []);
const mockHasAnyPermission = vi.fn(
  (perms: string[], req: string[]) => req.some((p: string) => perms.includes(p)),
);

vi.mock("@/lib/auth", () => ({
  getUserContext: vi.fn(() => ({ username: "admin", permissions: [] })),
  getAccessToken: vi.fn(() => null),
  clearTokens: vi.fn(),
  getRefreshToken: vi.fn(() => null),
  redirectToLogin: vi.fn(),
}));

vi.mock("@/api/auth", () => ({
  revokeToken: vi.fn(),
}));

vi.mock("@/lib/permissions", () => ({
  usePermissions: (...args: unknown[]) => mockUsePermissions(...(args as [])),
  hasAnyPermission: (...args: unknown[]) => mockHasAnyPermission(...(args as [string[], string[]])),
}));

import RootLayout from "@/layouts/RootLayout";

afterEach(() => {
  vi.clearAllMocks();
});

describe("RootLayout permission filtering", () => {
  it("hides Contratos nav item when user lacks contracts:write", () => {
    mockUsePermissions.mockReturnValue(["hhh:locations:write"]);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Ubicaciones")).toBeInTheDocument();
    expect(screen.queryByText("Contratos")).not.toBeInTheDocument();
    expect(screen.queryByText("Mercancías")).not.toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });

  it("always shows Dashboard nav item regardless of permissions", () => {
    mockUsePermissions.mockReturnValue([]);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows all nav items when user has all required permissions", () => {
    mockUsePermissions.mockReturnValue([
      "hhh:contracts:write",
      "hhh:locations:write",
      "hhh:commodities:write",
      "hhh:ships:write",
      "auth:users:read",
    ]);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Contratos")).toBeInTheDocument();
    expect(screen.getByText("Ubicaciones")).toBeInTheDocument();
    expect(screen.getByText("Mercancías")).toBeInTheDocument();
    expect(screen.getByText("Naves")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
  });
});

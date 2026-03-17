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

import RootLayout from "@/layouts/RootLayout";

afterEach(() => {
  vi.clearAllMocks();
});

describe("RootLayout permission filtering", () => {
  it("hides Contratos nav item when user lacks contracts:read", () => {
    mockUsePermissions.mockReturnValue(["locations:read"]);

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

  it("shows all nav items when user has all read permissions", () => {
    mockUsePermissions.mockReturnValue([
      "contracts:read",
      "locations:read",
      "commodities:read",
      "users:read",
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
    expect(screen.getByText("Users")).toBeInTheDocument();
  });
});

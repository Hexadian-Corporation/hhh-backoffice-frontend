import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

const mockHasPermission = vi.fn<(p: string) => boolean>(() => false);
const mockHasAnyPermission = vi.fn<(ps: string[]) => boolean>(() => false);

vi.mock("@hexadian-corporation/auth-react", () => ({
  useAuth: () => ({
    user: { username: "admin", rsiHandle: null, permissions: [] },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    tryRefresh: vi.fn(),
    authFetch: vi.fn(),
    hasPermission: (...args: unknown[]) => mockHasPermission(...(args as [string])),
    hasAnyPermission: (...args: unknown[]) => mockHasAnyPermission(...(args as [string[]])),
    handleCallback: vi.fn(),
  }),
}));

import RootLayout from "@/layouts/RootLayout";

afterEach(() => {
  vi.clearAllMocks();
});

describe("RootLayout permission filtering", () => {
  it("hides Contratos nav item when user lacks contracts:write", () => {
    const perms = ["hhh:locations:write"];
    mockHasPermission.mockImplementation((p) => perms.includes(p));
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

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
    mockHasPermission.mockReturnValue(false);
    mockHasAnyPermission.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <RootLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows all nav items when user has all required permissions", () => {
    const perms = [
      "hhh:contracts:write",
      "hhh:locations:write",
      "hhh:commodities:write",
      "hhh:ships:write",
      "hhh:graphs:read",
      "hhh:routes:read",
      "hhh:routes:write",
      "auth:users:read",
    ];
    mockHasPermission.mockImplementation((p) => perms.includes(p));
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

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
    expect(screen.getByText("Grafos")).toBeInTheDocument();
    expect(screen.getByText("Planes de Vuelo")).toBeInTheDocument();
    expect(screen.getByText("Penalizaciones")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
  });
});

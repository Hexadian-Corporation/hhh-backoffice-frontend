import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi, type Mock } from "vitest";

const mockHasPermission = vi.fn<(p: string) => boolean>(() => false);
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
    hasPermission: (...args: unknown[]) => mockHasPermission(...(args as [string])),
    hasAnyPermission: (...args: unknown[]) => mockHasAnyPermission(...(args as [string[]])),
    handleCallback: vi.fn(),
  }),
}));

vi.mock("@/api/contracts", () => ({
  listContracts: vi.fn(),
}));
vi.mock("@/api/locations", () => ({
  listLocations: vi.fn(),
}));
vi.mock("@/api/commodities", () => ({
  listCommodities: vi.fn(),
}));
vi.mock("@/api/health", () => ({
  DEFAULT_SERVICES: [],
  checkAllServices: vi.fn().mockResolvedValue([]),
}));

import DashboardPage from "@/pages/DashboardPage";
import { listContracts } from "@/api/contracts";
import { listLocations } from "@/api/locations";
import { listCommodities } from "@/api/commodities";

beforeEach(() => {
  (listContracts as Mock).mockResolvedValue([]);
  (listLocations as Mock).mockResolvedValue([]);
  (listCommodities as Mock).mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("DashboardPage permission filtering", () => {
  it("hides quick action links when user lacks write permissions", () => {
    const perms = ["hhh:contracts:read", "hhh:locations:read", "hhh:commodities:read"];
    mockHasPermission.mockImplementation((p) => perms.includes(p));
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText("New Contract")).not.toBeInTheDocument();
    expect(screen.queryByText("New Location")).not.toBeInTheDocument();
    expect(screen.queryByText("New Commodity")).not.toBeInTheDocument();
  });

  it("shows quick action links when user has write permissions", () => {
    const perms = [
      "hhh:contracts:read", "hhh:contracts:write",
      "hhh:locations:read", "hhh:locations:write",
      "hhh:commodities:read", "hhh:commodities:write",
    ];
    mockHasPermission.mockImplementation((p) => perms.includes(p));
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("New Contract")).toBeInTheDocument();
    expect(screen.getByText("New Location")).toBeInTheDocument();
    expect(screen.getByText("New Commodity")).toBeInTheDocument();
  });

  it("shows only permitted quick action links", () => {
    const perms = ["hhh:contracts:write", "hhh:locations:read"];
    mockHasPermission.mockImplementation((p) => perms.includes(p));
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("New Contract")).toBeInTheDocument();
    expect(screen.queryByText("New Location")).not.toBeInTheDocument();
    expect(screen.queryByText("New Commodity")).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi, type Mock } from "vitest";

const mockUsePermissions = vi.fn<() => string[]>(() => []);
const mockHasPermission = vi.fn(
  (perms: string[], req: string) => perms.includes(req),
);

vi.mock("@/lib/permissions", () => ({
  usePermissions: (...args: unknown[]) => mockUsePermissions(...(args as [])),
  hasPermission: (...args: unknown[]) => mockHasPermission(...(args as [string[], string])),
  hasAnyPermission: () => true,
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
    mockUsePermissions.mockReturnValue(["hhh:contracts:read", "hhh:locations:read", "hhh:commodities:read"]);

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
    mockUsePermissions.mockReturnValue([
      "hhh:contracts:read", "hhh:contracts:write",
      "hhh:locations:read", "hhh:locations:write",
      "hhh:commodities:read", "hhh:commodities:write",
    ]);

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
    mockUsePermissions.mockReturnValue(["hhh:contracts:write", "hhh:locations:read"]);

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

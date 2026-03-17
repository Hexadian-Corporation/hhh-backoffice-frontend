import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import type { Contract } from "@/types/contract";

const mockUsePermissions = vi.fn<() => string[]>(() => []);
const mockHasPermission = vi.fn(
  (perms: string[], req: string) => perms.includes(req),
);

vi.mock("@/lib/permissions", () => ({
  usePermissions: (...args: unknown[]) => mockUsePermissions(...(args as [])),
  hasPermission: (...args: unknown[]) => mockHasPermission(...(args as [string[], string])),
  hasAnyPermission: () => true,
}));

import ContractListPage from "@/pages/ContractListPage";

const makeContract = (overrides: Partial<Contract> = {}): Contract => ({
  id: "con-1",
  title: "Laranite Haul",
  description: "Transport laranite",
  faction: "UEE",
  hauling_orders: [
    {
      commodity_id: "comm-1",
      scu_min: 10,
      scu_max: 50,
      max_container_scu: 32,
      pickup_location_id: "loc-1",
      delivery_location_id: "loc-2",
    },
  ],
  reward_uec: 25000,
  collateral_uec: 5000,
  deadline: "2950-06-15T00:00:00Z",
  requirements: {
    min_reputation: 2,
    required_ship_tags: [],
    max_crew_size: null,
  },
  status: "active",
  created_at: "2950-01-01T00:00:00Z",
  updated_at: "2950-01-01T00:00:00Z",
  ...overrides,
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/contracts"]}>
      <Routes>
        <Route path="/contracts" element={<ContractListPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () =>
          Promise.resolve([
            makeContract(),
            makeContract({ id: "con-2", title: "Titanium Express", status: "draft" }),
          ]),
      }),
    ) as Mock,
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ContractListPage permission filtering", () => {
  it("hides New Contract button and action buttons when user lacks contracts:write", async () => {
    mockUsePermissions.mockReturnValue(["hhh:contracts:read"]);

    renderPage();
    await screen.findByText("Contratos");

    expect(screen.queryByText("New Contract")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete Laranite Haul")).not.toBeInTheDocument();
    expect(screen.queryByText("Activate")).not.toBeInTheDocument();
  });

  it("shows New Contract button and action buttons when user has contracts:write", async () => {
    mockUsePermissions.mockReturnValue(["hhh:contracts:read", "hhh:contracts:write"]);

    renderPage();
    await screen.findByText("Contratos");

    expect(screen.getByText("New Contract")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete Laranite Haul")).toBeInTheDocument();
    expect(screen.getByText("Activate")).toBeInTheDocument();
  });
});

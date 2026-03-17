import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { vi, type Mock } from "vitest"
import DashboardPage from "@/pages/DashboardPage"
import type { Contract } from "@/types/contract"
import type { Location } from "@/types/location"
import type { Commodity } from "@/types/commodity"

vi.mock("@/lib/permissions", () => ({
  usePermissions: () => [
    "contracts:read", "contracts:write",
    "locations:read", "locations:write",
    "commodities:read", "commodities:write",
    "users:read", "users:admin",
  ],
  hasPermission: () => true,
  hasAnyPermission: () => true,
}))

vi.mock("@/api/contracts", () => ({
  listContracts: vi.fn(),
}))
vi.mock("@/api/locations", () => ({
  listLocations: vi.fn(),
}))
vi.mock("@/api/commodities", () => ({
  listCommodities: vi.fn(),
}))
vi.mock("@/api/health", () => ({
  DEFAULT_SERVICES: [{ name: "TestSvc", url: "http://localhost:9999" }],
  checkAllServices: vi.fn().mockResolvedValue([
    { name: "TestSvc", url: "http://localhost:9999", status: "healthy", latencyMs: 10, errorMessage: null },
  ]),
}))

import { listContracts } from "@/api/contracts"
import { listLocations } from "@/api/locations"
import { listCommodities } from "@/api/commodities"

const mockContracts: Contract[] = [
  {
    id: "1", title: "Haul A", description: "", faction: "haul",
    hauling_orders: [], reward_uec: 1000, collateral_uec: 500,
    deadline: "2026-06-01T00:00:00Z", requirements: { min_reputation: 0, required_ship_tags: [], max_crew_size: null },
    status: "draft", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "2", title: "Haul B", description: "", faction: "haul",
    hauling_orders: [], reward_uec: 2000, collateral_uec: 1000,
    deadline: "2026-06-01T00:00:00Z", requirements: { min_reputation: 0, required_ship_tags: [], max_crew_size: null },
    status: "active", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  },
]

const mockLocations: Location[] = [
  { id: "1", name: "Stanton", location_type: "system", parent_id: null, coordinates: { x: 0, y: 0, z: 0 }, has_trade_terminal: false, has_landing_pad: false, landing_pad_size: null },
  { id: "2", name: "Hurston", location_type: "planet", parent_id: "1", coordinates: { x: 1, y: 0, z: 0 }, has_trade_terminal: false, has_landing_pad: false, landing_pad_size: null },
]

const mockCommodities: Commodity[] = [
  { id: "1", name: "Laranite", code: "LAR" },
  { id: "2", name: "Agricium", code: "AGR" },
  { id: "3", name: "Titanium", code: "TIT" },
]

beforeEach(() => {
  (listContracts as Mock).mockResolvedValue(mockContracts);
  (listLocations as Mock).mockResolvedValue(mockLocations);
  (listCommodities as Mock).mockResolvedValue(mockCommodities);
})

afterEach(() => {
  vi.clearAllMocks();
})

describe("DashboardPage", () => {
  it("renders the dashboard heading and welcome text", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Welcome to the Hexadian Backoffice.")).toBeInTheDocument()
  })

  it("displays KPI counts after data loads", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("Contracts")).toBeInTheDocument()
      // 2 contracts, 2 locations, 3 commodities
      expect(screen.getAllByText("2")).toHaveLength(2) // contracts + locations
      expect(screen.getByText("3")).toBeInTheDocument() // commodities
    })
  })

  it("shows contract status breakdown", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("draft: 1")).toBeInTheDocument()
      expect(screen.getByText("active: 1")).toBeInTheDocument()
    })
  })

  it("shows location type breakdown", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("system: 1")).toBeInTheDocument()
      expect(screen.getByText("planet: 1")).toBeInTheDocument()
    })
  })

  it("renders quick action links", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText("New Contract")).toBeInTheDocument()
    expect(screen.getByText("New Location")).toBeInTheDocument()
    expect(screen.getByText("New Commodity")).toBeInTheDocument()
  })

  it("quick action links have correct hrefs", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText("New Contract").closest("a")).toHaveAttribute("href", "/contracts/new")
    expect(screen.getByText("New Location").closest("a")).toHaveAttribute("href", "/locations/new")
    expect(screen.getByText("New Commodity").closest("a")).toHaveAttribute("href", "/commodities/new")
  })

  it("shows loading state while data is fetching", () => {
    (listContracts as Mock).mockReturnValue(new Promise(() => {}))
    ;(listLocations as Mock).mockReturnValue(new Promise(() => {}))
    ;(listCommodities as Mock).mockReturnValue(new Promise(() => {}))

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getAllByText("Loading…")).toHaveLength(3)
  })

  it("shows error when API fails", async () => {
    (listContracts as Mock).mockRejectedValue(new Error("API 500: Internal Server Error"));
    (listLocations as Mock).mockRejectedValue(new Error("Network error"));
    (listCommodities as Mock).mockRejectedValue(new Error("Timeout"));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("API 500: Internal Server Error")).toBeInTheDocument()
      expect(screen.getByText("Network error")).toBeInTheDocument()
      expect(screen.getByText("Timeout")).toBeInTheDocument()
    })
  })

  it("renders the system health panel", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText("System Health")).toBeInTheDocument()
  })
})

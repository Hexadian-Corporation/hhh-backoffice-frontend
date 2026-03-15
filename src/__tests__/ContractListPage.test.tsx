import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import ContractListPage from "@/pages/ContractListPage";
import type { Contract } from "@/types/contract";

const mockContracts: Contract[] = [
  {
    id: "con-1",
    title: "Laranite Haul",
    description: "Transport laranite",
    faction: "United Empire of Earth",
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
  },
  {
    id: "con-2",
    title: "Titanium Express",
    description: "Deliver titanium quickly",
    faction: "Crusader Industries",
    hauling_orders: [
      {
        commodity_id: "comm-2",
        scu_min: 5,
        scu_max: 20,
        max_container_scu: 16,
        pickup_location_id: "loc-3",
        delivery_location_id: "loc-4",
      },
      {
        commodity_id: "comm-3",
        scu_min: 5,
        scu_max: 10,
        max_container_scu: 16,
        pickup_location_id: "loc-5",
        delivery_location_id: "loc-6",
      },
    ],
    reward_uec: 50000,
    collateral_uec: 10000,
    deadline: "2950-07-01T00:00:00Z",
    requirements: {
      min_reputation: 3,
      required_ship_tags: ["cargo"],
      max_crew_size: 4,
    },
    status: "draft",
    created_at: "2950-01-02T00:00:00Z",
    updated_at: "2950-01-02T00:00:00Z",
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/contracts"]}>
      <Routes>
        <Route path="/contracts" element={<ContractListPage />} />
        <Route path="/contracts/new" element={<p>New Contract Page</p>} />
        <Route path="/contracts/:id" element={<p>Edit Contract Page</p>} />
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
        json: () => Promise.resolve(mockContracts),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContractListPage", () => {
  // -- Loading & Fetch --
  it("shows loading skeleton then renders the cards", async () => {
    renderPage();
    expect(screen.getAllByTestId("skeleton-card")).toHaveLength(3);
    expect(await screen.findByText("Contratos")).toBeInTheDocument();
  });

  it("renders contracts from API as cards", async () => {
    renderPage();
    await screen.findByText("Contratos");

    expect(screen.getByText("Laranite Haul")).toBeInTheDocument();
    expect(screen.getByText("United Empire of Earth")).toBeInTheDocument();
    expect(screen.getByText("Titanium Express")).toBeInTheDocument();
    expect(screen.getByText("Crusader Industries")).toBeInTheDocument();
  });

  it("shows empty state when no contracts", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderPage();
    expect(
      await screen.findByText("No contracts found."),
    ).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderPage();
    expect(
      await screen.findByText("Failed to load contracts"),
    ).toBeInTheDocument();
  });

  it("shows retry button on error and retries on click", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContracts),
      });

    renderPage();
    expect(
      await screen.findByText("Failed to load contracts"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByText("Retry"));
    expect(await screen.findByText("Laranite Haul")).toBeInTheDocument();
  });

  // -- Status badges --
  it("displays status badges with correct statuses", async () => {
    renderPage();
    await screen.findByText("Contratos");

    expect(screen.getByTestId("status-badge-active")).toHaveTextContent("active");
    expect(screen.getByTestId("status-badge-draft")).toHaveTextContent("draft");
  });

  // -- Reward & deadline --
  it("displays reward in UEC and deadline", async () => {
    renderPage();
    await screen.findByText("Contratos");

    expect(screen.getByText(/25,000/)).toBeInTheDocument();
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it("displays hauling order counts", async () => {
    renderPage();
    await screen.findByText("Contratos");

    expect(screen.getByText("1 hauling order")).toBeInTheDocument();
    expect(screen.getByText("2 hauling orders")).toBeInTheDocument();
  });

  // -- Status filter --
  it("renders status filter buttons", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const filterGroup = screen.getByRole("group", { name: "Filter by status" });
    expect(filterGroup).toBeInTheDocument();
    expect(within(filterGroup).getByText("all")).toBeInTheDocument();
    expect(within(filterGroup).getByText("draft")).toBeInTheDocument();
    expect(within(filterGroup).getByText("active")).toBeInTheDocument();
    expect(within(filterGroup).getByText("expired")).toBeInTheDocument();
    expect(within(filterGroup).getByText("cancelled")).toBeInTheDocument();
  });

  it("filters contracts by status", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const filterGroup = screen.getByRole("group", { name: "Filter by status" });

    // Click "active" filter
    await userEvent.click(within(filterGroup).getByText("active"));
    expect(screen.getByText("Laranite Haul")).toBeInTheDocument();
    expect(screen.queryByText("Titanium Express")).not.toBeInTheDocument();

    // Click "draft" filter
    await userEvent.click(within(filterGroup).getByText("draft"));
    expect(screen.queryByText("Laranite Haul")).not.toBeInTheDocument();
    expect(screen.getByText("Titanium Express")).toBeInTheDocument();

    // Click "all" to reset
    await userEvent.click(within(filterGroup).getByText("all"));
    expect(screen.getByText("Laranite Haul")).toBeInTheDocument();
    expect(screen.getByText("Titanium Express")).toBeInTheDocument();
  });

  it("shows empty message when filter matches no contracts", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const filterGroup = screen.getByRole("group", { name: "Filter by status" });
    await userEvent.click(within(filterGroup).getByText("expired"));
    expect(screen.getByText("No contracts found.")).toBeInTheDocument();
  });

  // -- Navigation --
  it("navigates to new contract page on button click", async () => {
    renderPage();
    await screen.findByText("Contratos");

    await userEvent.click(screen.getByText("New Contract"));
    expect(
      await screen.findByText("New Contract Page"),
    ).toBeInTheDocument();
  });

  it("navigates to edit page when clicking a card", async () => {
    renderPage();
    await screen.findByText("Contratos");

    await userEvent.click(screen.getByText("Laranite Haul"));
    expect(
      await screen.findByText("Edit Contract Page"),
    ).toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import FlightPlanListPage from "@/pages/FlightPlanListPage";
import type { FlightPlan } from "@/types/flight-plan";

vi.mock("@/lib/api-client", () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

function makeFlightPlan(overrides?: Partial<FlightPlan>): FlightPlan {
  return {
    id: "fp-1",
    contract_ids: ["c-1", "c-2"],
    ship_id: "ship-1",
    cargo_limit_scu: null,
    distance_graph_id: "graph-1",
    distance_route: null,
    time_route: null,
    ...overrides,
  };
}

const mockFlightPlans: FlightPlan[] = [
  makeFlightPlan({ id: "fp-1", contract_ids: ["c-1", "c-2"], ship_id: "ship-abc" }),
  makeFlightPlan({
    id: "fp-2",
    contract_ids: ["c-3"],
    ship_id: "ship-xyz",
    cargo_limit_scu: 100,
    distance_graph_id: "graph-2",
  }),
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/flight-plans"]}>
      <Routes>
        <Route path="/flight-plans" element={<FlightPlanListPage />} />
        <Route path="/flight-plans/:id" element={<p>Flight Plan Detail</p>} />
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
        json: () => Promise.resolve(mockFlightPlans),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FlightPlanListPage", () => {
  it("renders loading state initially", () => {
    renderPage();
    expect(screen.getByText("Loading flight plans…")).toBeInTheDocument();
  });

  it("displays list of flight plans after loading", async () => {
    renderPage();
    await screen.findByText("Flight Plans");
    expect(screen.getByText("ship-abc")).toBeInTheDocument();
    expect(screen.getByText("ship-xyz")).toBeInTheDocument();
  });

  it("shows ship_id, contract count, and graph_id in table", async () => {
    renderPage();
    await screen.findByText("Flight Plans");

    // fp-1: 2 contracts
    const row1 = screen.getByText("ship-abc").closest("tr")!;
    expect(row1).toHaveTextContent("2");
    expect(row1).toHaveTextContent("graph-1");

    // fp-2: 1 contract, cargo_limit_scu=100
    const row2 = screen.getByText("ship-xyz").closest("tr")!;
    expect(row2).toHaveTextContent("1");
    expect(row2).toHaveTextContent("graph-2");
    expect(row2).toHaveTextContent("100 SCU");
  });

  it("renders empty state when no flight plans", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    renderPage();
    expect(await screen.findByText("No flight plans found.")).toBeInTheDocument();
  });

  it("shows error message on API failure", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });
    renderPage();
    expect(await screen.findByText("Failed to load flight plans")).toBeInTheDocument();
  });

  it("navigates to detail on row click", async () => {
    renderPage();
    await screen.findByText("Flight Plans");
    await userEvent.click(screen.getByText("ship-abc"));
    expect(await screen.findByText("Flight Plan Detail")).toBeInTheDocument();
  });

  it("delete button calls deleteFlightPlan and removes item from list", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFlightPlans),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: "No Content",
      });

    renderPage();
    await screen.findByText("Flight Plans");

    await userEvent.click(screen.getByLabelText("Delete flight plan fp-1"));

    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    await userEvent.click(within(dialog).getByText("Delete"));

    await screen.findByText("ship-xyz");
    expect(screen.queryByText("ship-abc")).not.toBeInTheDocument();
  });

  it("shows dash for null cargo_limit_scu", async () => {
    renderPage();
    await screen.findByText("Flight Plans");

    const row1 = screen.getByText("ship-abc").closest("tr")!;
    expect(row1).toHaveTextContent("—");
  });

  it("renders table column headers", async () => {
    renderPage();
    await screen.findByText("Flight Plans");

    expect(screen.getByText("Ship")).toBeInTheDocument();
    expect(screen.getByText("Contracts")).toBeInTheDocument();
    expect(screen.getByText("Graph")).toBeInTheDocument();
    expect(screen.getByText("Cargo Limit")).toBeInTheDocument();
  });
});

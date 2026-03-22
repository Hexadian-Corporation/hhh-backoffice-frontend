import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import FlightPlanDetailPage from "@/pages/FlightPlanDetailPage";
import type { FlightPlan } from "@/types/flight-plan";
import type { Route as RouteType } from "@/types/route";

vi.mock("@/lib/api-client", () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

function makeRoute(overrides?: Partial<RouteType>): RouteType {
  return {
    id: "route-1",
    stops: [
      {
        location_id: "loc-1",
        location_name: "Port Olisar",
        action: "pickup",
        contract_id: "c-1",
        cargo_name: "Laranite",
        cargo_scu: 10,
      },
      {
        location_id: "loc-2",
        location_name: "Area 18",
        action: "delivery",
        contract_id: "c-1",
        cargo_name: "Laranite",
        cargo_scu: 10,
      },
    ],
    legs: [
      {
        from_location_id: "loc-1",
        to_location_id: "loc-2",
        distance: 500000,
        travel_time_seconds: 120,
        travel_type: "quantum",
      },
    ],
    total_distance: 500000,
    total_time_seconds: 120,
    contracts_fulfilled: 1,
    ...overrides,
  };
}

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

const mockFlightPlan = makeFlightPlan({
  distance_route: makeRoute({ id: "route-dist" }),
  time_route: makeRoute({ id: "route-time" }),
});

function renderPage(id = "fp-1") {
  return render(
    <MemoryRouter initialEntries={[`/flight-plans/${id}`]}>
      <Routes>
        <Route path="/flight-plans/:id" element={<FlightPlanDetailPage />} />
        <Route path="/flight-plans" element={<p>Flight Plan List</p>} />
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
        json: () => Promise.resolve(mockFlightPlan),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FlightPlanDetailPage", () => {
  it("renders loading state initially", () => {
    renderPage();
    expect(screen.getByText("Loading flight plan…")).toBeInTheDocument();
  });

  it("displays flight plan metadata after loading", async () => {
    renderPage();
    await screen.findByText("Flight Plan Details");

    expect(screen.getByText("ship-1")).toBeInTheDocument();
    expect(screen.getByText("graph-1")).toBeInTheDocument();
    expect(screen.getByText("2 contract(s)")).toBeInTheDocument();
  });

  it("shows cargo_limit_scu as dash when null", async () => {
    renderPage();
    await screen.findByText("Flight Plan Details");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows cargo_limit_scu value when set", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeFlightPlan({ cargo_limit_scu: 256 })),
    });
    renderPage();
    await screen.findByText("Flight Plan Details");
    expect(screen.getByText("256 SCU")).toBeInTheDocument();
  });

  it("renders contract IDs", async () => {
    renderPage();
    await screen.findByText("Flight Plan Details");
    expect(screen.getByText("c-1")).toBeInTheDocument();
    expect(screen.getByText("c-2")).toBeInTheDocument();
  });

  it("renders distance_route stops and legs when present", async () => {
    renderPage();
    await screen.findByText("Flight Plan Details");

    expect(screen.getByText("Distance Route")).toBeInTheDocument();
    expect(screen.getAllByText("Port Olisar").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Area 18").length).toBeGreaterThanOrEqual(1);
  });

  it("renders time_route stops and legs when present", async () => {
    renderPage();
    await screen.findByText("Flight Plan Details");

    expect(screen.getByText("Time Route")).toBeInTheDocument();
  });

  it("shows 'No route computed' message when distance_route is null", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeFlightPlan({ distance_route: null, time_route: null })),
    });
    renderPage();
    await screen.findByText("Flight Plan Details");

    expect(screen.getAllByText("No route computed").length).toBe(2);
  });

  it("navigates back to list on Back click", async () => {
    renderPage();
    await screen.findByText("Flight Plan Details");

    await userEvent.click(screen.getByText("Back"));
    expect(await screen.findByText("Flight Plan List")).toBeInTheDocument();
  });

  it("shows error on API failure", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });
    renderPage("missing");
    expect(await screen.findByText("Flight Plan Not Found")).toBeInTheDocument();
  });
});

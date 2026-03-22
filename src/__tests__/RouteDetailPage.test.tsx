import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import RouteDetailPage from "@/pages/RouteDetailPage";
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
        distance: 1000000,
        travel_time_seconds: 120,
        travel_type: "quantum",
      },
    ],
    total_distance: 1000000,
    total_time_seconds: 120,
    contracts_fulfilled: 1,
    ...overrides,
  };
}

const mockRoute = makeRoute();

function renderPage(id = "route-1") {
  return render(
    <MemoryRouter initialEntries={[`/routes/${id}`]}>
      <Routes>
        <Route path="/routes/:id" element={<RouteDetailPage />} />
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
        json: () => Promise.resolve(mockRoute),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RouteDetailPage", () => {
  it("renders loading state initially", () => {
    renderPage();
    expect(screen.getByText("Loading route…")).toBeInTheDocument();
  });

  it("displays stops table with location, action, cargo, SCU", async () => {
    renderPage();
    await screen.findByText("Route Details");

    expect(screen.getByText("Port Olisar")).toBeInTheDocument();
    expect(screen.getByText("pickup")).toBeInTheDocument();
    expect(screen.getByText("Area 18")).toBeInTheDocument();
    expect(screen.getByText("delivery")).toBeInTheDocument();
    expect(screen.getAllByText("Laranite").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(1);
  });

  it("displays legs table with from, to, distance, time, type", async () => {
    renderPage();
    await screen.findByText("Route Details");

    expect(screen.getByText("loc-1")).toBeInTheDocument();
    expect(screen.getByText("loc-2")).toBeInTheDocument();
    // "1.0 Mm" appears in both summary and legs table
    expect(screen.getAllByText("1.0 Mm").length).toBeGreaterThanOrEqual(1);
    // "2m" appears in both summary and legs table
    expect(screen.getAllByText("2m").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("quantum")).toBeInTheDocument();
  });

  it("displays summary metrics (total distance, total time, contracts fulfilled)", async () => {
    renderPage();
    await screen.findByText("Route Details");

    expect(screen.getByText("Total Distance")).toBeInTheDocument();
    expect(screen.getByText("Total Time")).toBeInTheDocument();
    expect(screen.getByText("Contracts Fulfilled")).toBeInTheDocument();
    // "1.0 Mm" appears in summary card and legs table
    expect(screen.getAllByText("1.0 Mm").length).toBeGreaterThanOrEqual(2);
    // "2m" appears in summary card and legs table
    expect(screen.getAllByText("2m").length).toBeGreaterThanOrEqual(2);
  });

  it("shows error on API failure", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });
    renderPage("missing");
    expect(await screen.findByText("Route Not Found")).toBeInTheDocument();
  });

  it("renders stops table column headers", async () => {
    renderPage();
    await screen.findByText("Route Details");

    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Cargo")).toBeInTheDocument();
    expect(screen.getByText("SCU")).toBeInTheDocument();
  });

  it("renders legs table column headers", async () => {
    renderPage();
    await screen.findByText("Route Details");

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByText("Distance")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
  });
});

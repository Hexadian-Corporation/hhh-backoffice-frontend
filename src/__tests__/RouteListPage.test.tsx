import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import RouteListPage from "@/pages/RouteListPage";
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

const mockRoutes: RouteType[] = [
  makeRoute({
    id: "route-1",
    stale: true,
    stale_reason: "Graph updated",
    stale_since: "2025-03-01T08:00:00Z",
  }),
  makeRoute({
    id: "route-2",
    stops: [],
    legs: [],
    total_distance: 500000,
    total_time_seconds: 60,
    contracts_fulfilled: 0,
    stale: false,
  }),
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/routes"]}>
      <Routes>
        <Route path="/routes" element={<RouteListPage />} />
        <Route path="/routes/:id" element={<p>Route Detail Page</p>} />
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
        json: () => Promise.resolve(mockRoutes),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RouteListPage", () => {
  it("shows loading state then renders the table", async () => {
    renderPage();
    expect(screen.getByText("Loading routes…")).toBeInTheDocument();
    expect(await screen.findByText("Routes")).toBeInTheDocument();
  });

  it("renders routes from API in table rows", async () => {
    renderPage();
    await screen.findByText("Routes");

    expect(screen.getByText("route-1")).toBeInTheDocument();
    expect(screen.getByText("route-2")).toBeInTheDocument();
  });

  it("shows stop, leg, distance, time, and contracts columns", async () => {
    renderPage();
    await screen.findByText("Routes");

    const row1 = screen.getByText("route-1").closest("tr")!;
    expect(row1).toHaveTextContent("1"); // 1 stop
    expect(row1).toHaveTextContent("1"); // 1 leg
    expect(row1).toHaveTextContent("1.0 Mm");
    expect(row1).toHaveTextContent("2m");
  });

  it("renders table column headers", async () => {
    renderPage();
    await screen.findByText("Routes");

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Stops")).toBeInTheDocument();
    expect(screen.getByText("Legs")).toBeInTheDocument();
    expect(screen.getByText("Distance")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Contracts")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("shows empty state when no routes", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderPage();
    expect(await screen.findByText("No routes found.")).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderPage();
    expect(await screen.findByText("Failed to load routes")).toBeInTheDocument();
  });

  it("navigates to detail page when clicking a row", async () => {
    renderPage();
    await screen.findByText("Routes");

    await userEvent.click(screen.getByText("route-1"));
    expect(await screen.findByText("Route Detail Page")).toBeInTheDocument();
  });

  it("shows stale badge on stale routes", async () => {
    renderPage();
    await screen.findByText("Routes");

    const staleBadges = screen.getAllByTestId("stale-badge");
    expect(staleBadges).toHaveLength(1);

    const staleRow = screen.getByText("route-1").closest("tr")!;
    expect(staleRow).toContainElement(staleBadges[0]);
  });

  it("stale badge has tooltip with reason and since", async () => {
    renderPage();
    await screen.findByText("Routes");

    const badge = screen.getByTestId("stale-badge");
    expect(badge).toHaveAttribute(
      "title",
      "Reason: Graph updated\nSince: 2025-03-01T08:00:00Z",
    );
  });

  it("does not show stale badge on non-stale routes", async () => {
    renderPage();
    await screen.findByText("Routes");

    const nonStaleRow = screen.getByText("route-2").closest("tr")!;
    expect(nonStaleRow.querySelector("[data-testid='stale-badge']")).not.toBeInTheDocument();
  });

  it("stale filter hides non-stale routes", async () => {
    renderPage();
    await screen.findByText("Routes");

    expect(screen.getByText("route-1")).toBeInTheDocument();
    expect(screen.getByText("route-2")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Show stale only"));

    expect(screen.getByText("route-1")).toBeInTheDocument();
    expect(screen.queryByText("route-2")).not.toBeInTheDocument();
  });

  it("stale filter shows empty state when no stale routes", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ ...mockRoutes[1] }]),
    });

    renderPage();
    await screen.findByText("Routes");

    await userEvent.click(screen.getByLabelText("Show stale only"));

    expect(await screen.findByText("No routes found.")).toBeInTheDocument();
  });
});

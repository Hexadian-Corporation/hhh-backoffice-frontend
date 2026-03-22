import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import GraphDetailPage from "@/pages/GraphDetailPage";
import type { Graph } from "@/types/graph";

vi.mock("@/lib/api-client", () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const mockGraph: Graph = {
  id: "graph-1",
  name: "Inner Systems",
  hash: "abc12345deadbeef",
  nodes: [
    { location_id: "loc-1", label: "Stanton" },
    { location_id: "loc-2", label: "Pyro" },
  ],
  edges: [
    {
      source_id: "loc-1",
      target_id: "loc-2",
      distance: 1500000,
      travel_type: "quantum",
      travel_time_seconds: 3661,
    },
    {
      source_id: "loc-2",
      target_id: "loc-1",
      distance: 500,
      travel_type: "scm",
      travel_time_seconds: 0,
    },
  ],
};

function renderPage(id = "graph-1") {
  return render(
    <MemoryRouter initialEntries={[`/graphs/${id}`]}>
      <Routes>
        <Route path="/graphs/:id" element={<GraphDetailPage />} />
        <Route path="/graphs" element={<p>Graph List</p>} />
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
        json: () => Promise.resolve(mockGraph),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GraphDetailPage", () => {
  it("shows loading state then renders graph details", async () => {
    renderPage();
    expect(screen.getByText("Loading graph…")).toBeInTheDocument();
    expect(await screen.findByText("Inner Systems")).toBeInTheDocument();
  });

  it("displays graph info header", async () => {
    renderPage();
    await screen.findByText("Inner Systems");

    expect(screen.getByText("abc12345deadbeef")).toBeInTheDocument();
  });

  it("displays nodes table", async () => {
    renderPage();
    await screen.findByText("Inner Systems");

    expect(screen.getByRole("heading", { name: "Nodes" })).toBeInTheDocument();
    expect(screen.getByText("Location ID")).toBeInTheDocument();
    expect(screen.getByText("Label")).toBeInTheDocument();
    // Stanton and Pyro appear in both nodes and edges tables
    expect(screen.getAllByText("Stanton").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pyro").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("loc-1")).toBeInTheDocument();
    expect(screen.getByText("loc-2")).toBeInTheDocument();
  });

  it("displays edges table with resolved labels", async () => {
    renderPage();
    await screen.findByText("Inner Systems");

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByText("Distance")).toBeInTheDocument();
    expect(screen.getByText("Travel Type")).toBeInTheDocument();
    expect(screen.getByText("Travel Time")).toBeInTheDocument();
  });

  it("formats distance correctly", async () => {
    renderPage();
    await screen.findByText("Inner Systems");

    expect(screen.getByText("1.5 Mm")).toBeInTheDocument();
    expect(screen.getByText("500 m")).toBeInTheDocument();
  });

  it("formats travel time correctly", async () => {
    renderPage();
    await screen.findByText("Inner Systems");

    // 3661 seconds = 1h 1m 1s
    expect(screen.getByText("1h 1m 1s")).toBeInTheDocument();
    // 0 seconds = N/A
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("shows travel type", async () => {
    renderPage();
    await screen.findByText("Inner Systems");

    expect(screen.getByText("quantum")).toBeInTheDocument();
    expect(screen.getByText("scm")).toBeInTheDocument();
  });

  it("shows not found when graph does not exist", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    renderPage("missing");
    expect(await screen.findByText("Graph Not Found")).toBeInTheDocument();
  });

  it("navigates back to list on back button click", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    renderPage("missing");
    await screen.findByText("Graph Not Found");

    await userEvent.click(screen.getByText("Back to Graphs"));
    expect(await screen.findByText("Graph List")).toBeInTheDocument();
  });

  it("resolves edge source/target to node labels", async () => {
    renderPage();
    await screen.findByText("Inner Systems");

    // Edge from Stanton to Pyro
    const rows = screen.getAllByRole("row");
    // edges table starts after nodes table - find table rows that contain "Stanton" and "Pyro" in same row
    const edgeRow = rows.find(
      (row) =>
        row.textContent?.includes("Stanton") &&
        row.textContent?.includes("Pyro") &&
        row.textContent?.includes("1.5 Mm"),
    );
    expect(edgeRow).toBeTruthy();
  });
});

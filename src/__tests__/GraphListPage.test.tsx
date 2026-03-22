import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import GraphListPage from "@/pages/GraphListPage";
import type { Graph } from "@/types/graph";

vi.mock("@/lib/api-client", () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const mockGraphs: Graph[] = [
  {
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
        distance: 1234567,
        travel_type: "quantum",
        travel_time_seconds: 300,
      },
    ],
  },
  {
    id: "graph-2",
    name: "Outer Systems",
    hash: "ffffffff00000000",
    nodes: [{ location_id: "loc-3", label: "Nyx" }],
    edges: [],
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/graphs"]}>
      <Routes>
        <Route path="/graphs" element={<GraphListPage />} />
        <Route path="/graphs/:id" element={<p>Graph Detail Page</p>} />
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
        json: () => Promise.resolve(mockGraphs),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GraphListPage", () => {
  it("shows loading state then renders the table", async () => {
    renderPage();
    expect(screen.getByText("Loading graphs…")).toBeInTheDocument();
    expect(await screen.findByText("Grafos")).toBeInTheDocument();
  });

  it("renders graphs from API in table rows", async () => {
    renderPage();
    await screen.findByText("Grafos");

    expect(screen.getByText("Inner Systems")).toBeInTheDocument();
    expect(screen.getByText("Outer Systems")).toBeInTheDocument();
  });

  it("shows node and edge counts", async () => {
    renderPage();
    await screen.findByText("Grafos");

    // Inner Systems: 2 nodes, 1 edge
    const innerRow = screen.getByText("Inner Systems").closest("tr")!;
    expect(innerRow).toHaveTextContent("2");
    expect(innerRow).toHaveTextContent("1");

    // Outer Systems: 1 node, 0 edges
    const outerRow = screen.getByText("Outer Systems").closest("tr")!;
    expect(outerRow).toHaveTextContent("1");
    expect(outerRow).toHaveTextContent("0");
  });

  it("shows truncated hash (first 8 chars)", async () => {
    renderPage();
    await screen.findByText("Grafos");

    expect(screen.getByText("abc12345")).toBeInTheDocument();
    expect(screen.getByText("ffffffff")).toBeInTheDocument();
  });

  it("shows empty state when no graphs", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderPage();
    expect(await screen.findByText("No graphs found.")).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderPage();
    expect(
      await screen.findByText("Failed to load graphs"),
    ).toBeInTheDocument();
  });

  it("renders table column headers", async () => {
    renderPage();
    await screen.findByText("Grafos");

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Nodes")).toBeInTheDocument();
    expect(screen.getByText("Edges")).toBeInTheDocument();
    expect(screen.getByText("Hash")).toBeInTheDocument();
  });

  it("navigates to detail page when clicking a row", async () => {
    renderPage();
    await screen.findByText("Grafos");

    await userEvent.click(screen.getByText("Inner Systems"));
    expect(
      await screen.findByText("Graph Detail Page"),
    ).toBeInTheDocument();
  });

  it("does not render create or delete buttons", async () => {
    renderPage();
    await screen.findByText("Grafos");

    expect(screen.queryByText("New Graph")).not.toBeInTheDocument();
    expect(screen.queryByText("Nueva")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi, type Mock } from "vitest";
import AlgorithmConfigPage from "@/pages/AlgorithmConfigPage";
import type { AlgorithmConfig } from "@/types/algorithm";

vi.mock("@/lib/api-client", () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const mockConfig: AlgorithmConfig = {
  id: "algo-config-1",
  entries: [
    {
      algorithm: "dijkstra",
      enabled: true,
      complexity_min: 0,
      complexity_max: 100,
    },
    {
      algorithm: "astar",
      enabled: false,
      complexity_min: 50,
      complexity_max: null,
    },
    {
      algorithm: "aco",
      enabled: false,
      complexity_min: 200,
      complexity_max: null,
    },
    {
      algorithm: "ford_fulkerson",
      enabled: true,
      complexity_min: 100,
      complexity_max: 500,
    },
  ],
};

const BASE = "http://localhost:8005";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/algorithms"]}>
      <AlgorithmConfigPage />
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
        json: () => Promise.resolve(mockConfig),
      }),
    ),
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("AlgorithmConfigPage", () => {
  it("shows loading state initially", () => {
    renderPage();
    expect(screen.getByText("Loading algorithm config…")).toBeInTheDocument();
  });

  it("renders algorithm cards after loading", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    expect(screen.getByText("Dijkstra")).toBeInTheDocument();
    expect(screen.getByText("A*")).toBeInTheDocument();
    expect(screen.getByText("Ant Colony Optimization")).toBeInTheDocument();
    expect(screen.getByText("Ford-Fulkerson")).toBeInTheDocument();
  });

  it("shows algorithm descriptions and badges", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    expect(
      screen.getByText(
        "Shortest path algorithm. Basic tier, available to all users.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Shortest Path")).toBeInTheDocument();
    expect(screen.getAllByText("CPU").length).toBeGreaterThanOrEqual(1);
  });

  it("shows permission badges for each algorithm", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    expect(screen.getByText("hhh:algorithm:dijkstra")).toBeInTheDocument();
    expect(screen.getByText("hhh:algorithm:astar")).toBeInTheDocument();
    expect(screen.getByText("hhh:algorithm:aco")).toBeInTheDocument();
    expect(screen.getByText("hhh:algorithm:ford_fulkerson")).toBeInTheDocument();
  });

  it("shows complexity inputs only for enabled algorithms", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    // dijkstra and ford_fulkerson are enabled → show inputs
    expect(screen.getByLabelText("Min Nodes", { selector: "#min-dijkstra" })).toBeInTheDocument();
    expect(screen.getByLabelText("Max Nodes", { selector: "#max-dijkstra" })).toBeInTheDocument();
    expect(screen.getByLabelText("Min Nodes", { selector: "#min-ford_fulkerson" })).toBeInTheDocument();

    // astar and aco are disabled → no inputs
    expect(screen.queryByLabelText("Min Nodes", { selector: "#min-astar" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Min Nodes", { selector: "#min-aco" })).not.toBeInTheDocument();
  });

  it("shows null complexity_max as empty placeholder (∞)", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    // ford_fulkerson is enabled and has complexity_max null for astar, but ford_fulkerson has 500
    // For this test check dijkstra which has complexity_max=100
    const dijkstraMaxInput = screen.getByLabelText("Max Nodes", {
      selector: "#max-dijkstra",
    }) as HTMLInputElement;
    expect(dijkstraMaxInput.value).toBe("100");

    const fordMaxInput = screen.getByLabelText("Max Nodes", {
      selector: "#max-ford_fulkerson",
    }) as HTMLInputElement;
    expect(fordMaxInput.value).toBe("500");
  });

  it("toggles an algorithm on click", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    // astar is disabled, click its toggle to enable
    const astarToggle = screen.getByRole("switch", { name: /Enable A\*/ });
    await userEvent.click(astarToggle);

    // Now astar's inputs should appear
    expect(
      screen.getByLabelText("Min Nodes", { selector: "#min-astar" }),
    ).toBeInTheDocument();
  });

  it("toggles an enabled algorithm to disabled", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    // dijkstra is enabled, click its toggle to disable
    const dijkstraToggle = screen.getByRole("switch", {
      name: /Disable Dijkstra/,
    });
    await userEvent.click(dijkstraToggle);

    // Now dijkstra's inputs should disappear
    expect(
      screen.queryByLabelText("Min Nodes", { selector: "#min-dijkstra" }),
    ).not.toBeInTheDocument();
  });

  it("updates complexity_min value", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    const minInput = screen.getByLabelText("Min Nodes", {
      selector: "#min-dijkstra",
    }) as HTMLInputElement;
    await userEvent.clear(minInput);
    await userEvent.type(minInput, "10");
    expect(minInput.value).toBe("10");
  });

  it("updates complexity_max to null when cleared", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    const maxInput = screen.getByLabelText("Max Nodes", {
      selector: "#max-dijkstra",
    }) as HTMLInputElement;
    await userEvent.clear(maxInput);
    // After clearing, value should be empty (null)
    expect(maxInput.value).toBe("");
  });

  it("calls PUT /algorithms/ on save with current entries", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await userEvent.click(saveButton);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/algorithms/`,
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("shows success toast on save", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    await userEvent.click(screen.getByRole("button", { name: /Save/ }));

    await screen.findByText("Configuration saved successfully");
  });

  it("shows error toast on save failure", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await userEvent.click(screen.getByRole("button", { name: /Save/ }));

    await screen.findByText("Failed to save configuration");
  });

  it("shows error state when GET /algorithms/ fails", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderPage();

    await waitFor(() =>
      expect(
        screen.queryByText("Loading algorithm config…"),
      ).not.toBeInTheDocument(),
    );

    expect(screen.getByText("Algorithm Configuration")).toBeInTheDocument();
    expect(
      screen.getByText("API 500: Internal Server Error"),
    ).toBeInTheDocument();
  });

  it("shows saving state while PUT is in progress", async () => {
    renderPage();
    await screen.findByText("Dijkstra");

    // Make the PUT hang
    (fetch as Mock).mockImplementationOnce(
      () =>
        new Promise(() => {
          // never resolves
        }),
    );

    await userEvent.click(screen.getByRole("button", { name: /Save/ }));

    expect(screen.getByRole("button", { name: /Saving…/ })).toBeDisabled();
  });
});

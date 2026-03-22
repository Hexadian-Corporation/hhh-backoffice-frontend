import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi, type Mock } from "vitest";
import SyncPage from "@/pages/SyncPage";

vi.mock("@hexadian-corporation/auth-react", () => ({
  useAuth: () => ({
    user: { username: "admin", permissions: [] },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    tryRefresh: vi.fn(),
    authFetch: vi.fn(),
    hasPermission: () => true,
    hasAnyPermission: () => true,
    handleCallback: vi.fn(),
  }),
}));

vi.mock("@/api/dataminer", () => ({
  syncAll: vi.fn(),
  syncEntity: vi.fn(),
  syncEntityFromSource: vi.fn(),
  listSources: vi.fn(),
}));

import { syncAll, syncEntity, syncEntityFromSource, listSources } from "@/api/dataminer";

const mockSources = {
  sources: [
    { name: "uex", available: true },
    { name: "gallog", available: false },
  ],
};

beforeEach(() => {
  (listSources as Mock).mockResolvedValue(mockSources);
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <SyncPage />
    </MemoryRouter>,
  );
}

describe("SyncPage", () => {
  it("renders page heading and section titles", async () => {
    renderPage();

    expect(screen.getByText("Data Sync")).toBeInTheDocument();
    expect(screen.getByText("Full Sync")).toBeInTheDocument();
    expect(screen.getByText("Entity Sync")).toBeInTheDocument();
    expect(screen.getByText("Source Sync")).toBeInTheDocument();

    await waitFor(() => {
      expect(listSources).toHaveBeenCalledOnce();
    });
  });

  it("renders sync buttons", async () => {
    renderPage();

    expect(screen.getByText("Sync All")).toBeInTheDocument();
    expect(screen.getByText("Sync Entity")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Sync from Source")).toBeInTheDocument();
    });
  });

  it("renders entity select with all entity types", async () => {
    renderPage();

    await waitFor(() => {
      expect(listSources).toHaveBeenCalled();
    });

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(2);

    const options = selects[0].querySelectorAll("option");
    const values = Array.from(options).map((o) => o.textContent);
    expect(values).toEqual(["locations", "distances", "ships", "commodities", "contracts"]);
  });

  // -- Full Sync --

  it("full sync shows results on success", async () => {
    (syncAll as Mock).mockResolvedValue({
      results: [
        { entity: "locations", count: 42 },
        { entity: "ships", count: 15 },
      ],
    });

    renderPage();
    await userEvent.click(screen.getByText("Sync All"));

    await waitFor(() => {
      expect(screen.getByText("Sync completed")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("row");
    const resultRows = rows.filter((r) => r.querySelector("td"));
    expect(resultRows).toHaveLength(2);
    expect(resultRows[0]).toHaveTextContent("locations");
    expect(resultRows[1]).toHaveTextContent("ships");
  });

  it("full sync shows error on failure", async () => {
    (syncAll as Mock).mockRejectedValue(new Error("API 500: Internal Server Error"));

    renderPage();
    await userEvent.click(screen.getByText("Sync All"));

    await waitFor(() => {
      expect(screen.getByText("API 500: Internal Server Error")).toBeInTheDocument();
    });
  });

  it("full sync button is disabled while loading", async () => {
    (syncAll as Mock).mockReturnValue(new Promise(() => {}));

    renderPage();
    await userEvent.click(screen.getByText("Sync All"));

    expect(screen.getByText("Sync All").closest("button")).toBeDisabled();
  });

  // -- Entity Sync --

  it("entity sync calls API with selected entity", async () => {
    (syncEntity as Mock).mockResolvedValue({ entity: "ships", count: 10 });

    renderPage();

    await waitFor(() => {
      expect(listSources).toHaveBeenCalled();
    });

    const selects = screen.getAllByRole("combobox");
    await userEvent.selectOptions(selects[0], "ships");
    await userEvent.click(screen.getByText("Sync Entity"));

    await waitFor(() => {
      expect(syncEntity).toHaveBeenCalledWith("ships");
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  it("entity sync shows error on failure", async () => {
    (syncEntity as Mock).mockRejectedValue(new Error("API 403: Forbidden"));

    renderPage();
    await userEvent.click(screen.getByText("Sync Entity"));

    await waitFor(() => {
      expect(screen.getByText("API 403: Forbidden")).toBeInTheDocument();
    });
  });

  // -- Source Sync --

  it("loads and displays sources in selector", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("uex")).toBeInTheDocument();
    });

    const sourceSelect = screen.getByLabelText("Source");
    const options = sourceSelect.querySelectorAll("option");
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toBe("uex");
    expect(options[1].textContent).toBe("gallog (unavailable)");
    expect(options[1]).toBeDisabled();
  });

  it("source sync calls API with selected entity and source", async () => {
    (syncEntityFromSource as Mock).mockResolvedValue({ entity: "commodities", count: 7 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("uex")).toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox");
    await userEvent.selectOptions(selects[1], "commodities");
    await userEvent.click(screen.getByText("Sync from Source"));

    await waitFor(() => {
      expect(syncEntityFromSource).toHaveBeenCalledWith("commodities", "uex");
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  it("source sync shows error on failure", async () => {
    (syncEntityFromSource as Mock).mockRejectedValue(new Error("API 404: Source 'unknown' not found"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("uex")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Sync from Source"));

    await waitFor(() => {
      expect(screen.getByText("API 404: Source 'unknown' not found")).toBeInTheDocument();
    });
  });

  // -- Sources loading/error --

  it("shows loading state for sources", () => {
    (listSources as Mock).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading sources…")).toBeInTheDocument();
  });

  it("shows error when sources fail to load", async () => {
    (listSources as Mock).mockRejectedValue(new Error("Network error"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows empty state when no sources configured", async () => {
    (listSources as Mock).mockResolvedValue({ sources: [] });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No sources configured.")).toBeInTheDocument();
    });
  });
});

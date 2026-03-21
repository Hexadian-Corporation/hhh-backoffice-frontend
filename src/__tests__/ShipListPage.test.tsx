import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import ShipListPage from "@/pages/ShipListPage";
import type { Ship } from "@/types/ship";

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

const mockShips: Ship[] = [
  {
    id: "ship-1",
    name: "Caterpillar",
    manufacturer: "Drake Interplanetary",
    cargo_holds: [{ name: "Main Hold", volume_scu: 576 }],
    total_scu: 576,
    scm_speed: 110,
    quantum_speed: 217000000,
    landing_time_seconds: 120,
    loading_time_per_scu_seconds: 1,
  },
  {
    id: "ship-2",
    name: "Hull C",
    manufacturer: "MISC",
    cargo_holds: [
      { name: "Hold A", volume_scu: 4096 },
      { name: "Hold B", volume_scu: 4096 },
    ],
    total_scu: 8192,
    scm_speed: 95,
    quantum_speed: 254000000,
    landing_time_seconds: 180,
    loading_time_per_scu_seconds: 1,
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/ships"]}>
      <Routes>
        <Route path="/ships" element={<ShipListPage />} />
        <Route path="/ships/new" element={<p>New Ship Page</p>} />
        <Route path="/ships/:id" element={<p>Edit Ship Page</p>} />
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
        json: () => Promise.resolve(mockShips),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ShipListPage", () => {
  // -- Loading & Fetch --
  it("shows loading state then renders the table", async () => {
    renderPage();
    expect(screen.getByText("Loading ships…")).toBeInTheDocument();
    expect(await screen.findByText("Naves")).toBeInTheDocument();
  });

  it("renders ships from API in table rows", async () => {
    renderPage();
    await screen.findByText("Naves");

    expect(screen.getByText("Caterpillar")).toBeInTheDocument();
    expect(screen.getByText("Drake Interplanetary")).toBeInTheDocument();
    expect(screen.getByText("576")).toBeInTheDocument();
    expect(screen.getByText("Hull C")).toBeInTheDocument();
    expect(screen.getByText("MISC")).toBeInTheDocument();
    expect(screen.getByText("8192")).toBeInTheDocument();
  });

  it("shows cargo hold count in the Cargo Holds column", async () => {
    renderPage();
    await screen.findByText("Naves");

    const rows = screen.getAllByRole("row");
    // Row 0 is header, Row 1 is Caterpillar (1 hold), Row 2 is Hull C (2 holds)
    const catRow = rows[1];
    const hullRow = rows[2];

    expect(within(catRow).getByText("1")).toBeInTheDocument();
    expect(within(hullRow).getByText("2")).toBeInTheDocument();
  });

  it("shows empty state when no ships", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderPage();
    expect(await screen.findByText("No ships found.")).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderPage();
    expect(await screen.findByText("Failed to load ships")).toBeInTheDocument();
  });

  // -- Table headers --
  it("renders table column headers", async () => {
    renderPage();
    await screen.findByText("Naves");

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Manufacturer")).toBeInTheDocument();
    expect(screen.getByText("Total SCU")).toBeInTheDocument();
    expect(screen.getByText("Cargo Holds")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  // -- Navigation --
  it("navigates to new ship page on button click", async () => {
    renderPage();
    await screen.findByText("Naves");

    await userEvent.click(screen.getByText("Nueva nave"));
    expect(await screen.findByText("New Ship Page")).toBeInTheDocument();
  });

  it("navigates to edit page when clicking a row", async () => {
    renderPage();
    await screen.findByText("Naves");

    await userEvent.click(screen.getByText("Caterpillar"));
    expect(await screen.findByText("Edit Ship Page")).toBeInTheDocument();
  });

  // -- Delete --
  it("shows delete confirmation dialog and can cancel", async () => {
    renderPage();
    await screen.findByText("Naves");

    await userEvent.click(screen.getByLabelText("Delete Caterpillar"));

    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Are you sure you want to delete/),
    ).toBeInTheDocument();

    await userEvent.click(within(dialog).getByText("Cancel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deletes a ship and removes it from the table", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockShips),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: "No Content",
      });

    renderPage();
    await screen.findByText("Naves");

    await userEvent.click(screen.getByLabelText("Delete Caterpillar"));

    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    await userEvent.click(within(dialog).getByText("Delete"));

    await screen.findByText("Hull C");
    expect(screen.queryByText("Caterpillar")).not.toBeInTheDocument();
  });

  it("shows error banner when delete fails", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockShips),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

    renderPage();
    await screen.findByText("Naves");

    await userEvent.click(screen.getByLabelText("Delete Caterpillar"));
    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    await userEvent.click(within(dialog).getByText("Delete"));

    expect(await screen.findByText("Failed to delete ship")).toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import LocationListPage from "@/pages/LocationListPage";
import type { Location } from "@/types/location";

const mockLocations: Location[] = [
  {
    id: "loc-1",
    name: "Port Olisar",
    location_type: "station",
    parent_id: "planet-1",
    coordinates: { x: 100, y: 200, z: 300 },
    has_trade_terminal: true,
    has_landing_pad: true,
    landing_pad_size: "large",
  },
  {
    id: "loc-2",
    name: "Crusader",
    location_type: "planet",
    parent_id: null,
    coordinates: { x: 0, y: 0, z: 0 },
    has_trade_terminal: false,
    has_landing_pad: false,
    landing_pad_size: null,
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/locations"]}>
      <Routes>
        <Route path="/locations" element={<LocationListPage />} />
        <Route path="/locations/new" element={<p>New Location Page</p>} />
        <Route path="/locations/:id" element={<p>Edit Location Page</p>} />
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
        json: () => Promise.resolve(mockLocations),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LocationListPage", () => {
  // -- Loading & Fetch --
  it("shows loading state then renders the table", async () => {
    renderPage();
    expect(screen.getByText("Loading locations…")).toBeInTheDocument();
    expect(await screen.findByText("Ubicaciones")).toBeInTheDocument();
  });

  it("renders locations from API in table rows", async () => {
    renderPage();
    await screen.findByText("Ubicaciones");

    expect(screen.getByText("Port Olisar")).toBeInTheDocument();
    expect(screen.getByText("station")).toBeInTheDocument();
    expect(screen.getByText("Crusader")).toBeInTheDocument();
    expect(screen.getByText("planet")).toBeInTheDocument();
  });

  it("shows trade terminal and landing pad info", async () => {
    renderPage();
    await screen.findByText("Ubicaciones");

    const rows = screen.getAllByRole("row");
    // Row 0 is header, Row 1 is Port Olisar, Row 2 is Crusader
    const portOlisarRow = rows[1];
    expect(within(portOlisarRow).getByText("Yes")).toBeInTheDocument();
    expect(within(portOlisarRow).getByText("large")).toBeInTheDocument();

    const crusaderRow = rows[2];
    const noCells = within(crusaderRow).getAllByText("No");
    expect(noCells).toHaveLength(2);
  });

  it("shows parent_id or dash when no parent", async () => {
    renderPage();
    await screen.findByText("Ubicaciones");

    expect(screen.getByText("planet-1")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows empty state when no locations", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderPage();
    expect(await screen.findByText("No locations found.")).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderPage();
    expect(
      await screen.findByText("Failed to load locations"),
    ).toBeInTheDocument();
  });

  // -- Navigation --
  it("navigates to new location page on button click", async () => {
    renderPage();
    await screen.findByText("Ubicaciones");

    await userEvent.click(screen.getByText("Nueva ubicación"));
    expect(await screen.findByText("New Location Page")).toBeInTheDocument();
  });

  it("navigates to edit page when clicking a row", async () => {
    renderPage();
    await screen.findByText("Ubicaciones");

    await userEvent.click(screen.getByText("Port Olisar"));
    expect(await screen.findByText("Edit Location Page")).toBeInTheDocument();
  });

  // -- Delete --
  it("shows delete confirmation dialog and can cancel", async () => {
    renderPage();
    await screen.findByText("Ubicaciones");

    await userEvent.click(screen.getByLabelText("Delete Port Olisar"));

    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Are you sure you want to delete/),
    ).toBeInTheDocument();

    await userEvent.click(within(dialog).getByText("Cancel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deletes a location and removes it from the table", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLocations),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: "No Content",
      });

    renderPage();
    await screen.findByText("Ubicaciones");

    await userEvent.click(screen.getByLabelText("Delete Port Olisar"));

    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    await userEvent.click(within(dialog).getByText("Delete"));

    // Port Olisar should be removed
    await screen.findByText("Crusader");
    expect(screen.queryByText("Port Olisar")).not.toBeInTheDocument();
  });

  it("shows error toast when delete fails", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLocations),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

    renderPage();
    await screen.findByText("Ubicaciones");

    await userEvent.click(screen.getByLabelText("Delete Port Olisar"));
    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    await userEvent.click(within(dialog).getByText("Delete"));

    expect(
      await screen.findByText("Failed to delete location"),
    ).toBeInTheDocument();
  });

  // -- Table headers --
  it("renders table column headers", async () => {
    renderPage();
    await screen.findByText("Ubicaciones");

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Parent")).toBeInTheDocument();
    expect(screen.getByText("Trade Terminal")).toBeInTheDocument();
    expect(screen.getByText("Landing Pad")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });
});

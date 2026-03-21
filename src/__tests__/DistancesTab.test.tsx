import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import DistancesTab from "@/components/location/DistancesTab";
import { formatDistance } from "@/lib/format";
import type { LocationDistance } from "@/types/distance";
import type { Location } from "@/types/location";

vi.mock("@/lib/api-client", () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

const MAPS_BASE = "http://localhost:8003";

const mockDistances: LocationDistance[] = [
  {
    id: "dist-1",
    from_location_id: "loc-1",
    to_location_id: "loc-2",
    distance: 1500000,
    travel_type: "quantum",
  },
  {
    id: "dist-2",
    from_location_id: "loc-3",
    to_location_id: "loc-1",
    distance: 500,
    travel_type: "on_foot",
  },
];

const mockLocationArcL2: Location = {
  id: "loc-2",
  name: "ARC-L2",
  location_type: "station",
  parent_id: null,
  coordinates: { x: 0, y: 0, z: 0 },
  has_trade_terminal: false,
  has_landing_pad: false,
  landing_pad_size: null,
};

const mockLocationArcL3: Location = {
  id: "loc-3",
  name: "ARC-L3",
  location_type: "station",
  parent_id: null,
  coordinates: { x: 0, y: 0, z: 0 },
  has_trade_terminal: false,
  has_landing_pad: false,
  landing_pad_size: null,
};

function setupFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      // Distances endpoint
      if (url === `${MAPS_BASE}/locations/loc-1/distances`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDistances),
        });
      }
      // Location lookups
      if (url === `${MAPS_BASE}/locations/loc-2`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLocationArcL2),
        });
      }
      if (url === `${MAPS_BASE}/locations/loc-3`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLocationArcL3),
        });
      }
      // Search
      if (url.includes("/locations/search")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              mockLocationArcL2,
              mockLocationArcL3,
            ]),
        });
      }
      // Create distance
      if (url === `${MAPS_BASE}/distances/` && init?.method === "POST") {
        const body = JSON.parse(init.body as string);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "dist-new",
              ...body,
            }),
        });
      }
      // Delete distance
      if (init?.method === "DELETE") {
        return Promise.resolve({ ok: true, status: 204, statusText: "No Content" });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("formatDistance", () => {
  it("formats meters", () => {
    expect(formatDistance(500)).toBe("500 m");
  });

  it("formats kilometers", () => {
    expect(formatDistance(1500)).toBe("1.5 km");
  });

  it("formats megameters", () => {
    expect(formatDistance(1500000)).toBe("1.5 Mm");
  });

  it("formats gigameters", () => {
    expect(formatDistance(1500000000)).toBe("1.5 Gm");
  });

  it("formats exact boundary values", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(1000000)).toBe("1.0 Mm");
    expect(formatDistance(1000000000)).toBe("1.0 Gm");
  });
});

describe("DistancesTab", () => {
  it("shows loading state initially", () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);
    expect(screen.getByText("Loading distances…")).toBeInTheDocument();
  });

  it("loads and displays distances with resolved location names", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);

    // Wait for distances to load
    expect(await screen.findByText("ARC-L2")).toBeInTheDocument();
    expect(screen.getByText("ARC-L3")).toBeInTheDocument();

    // Check distance formatting
    expect(screen.getByText("1.5 Mm")).toBeInTheDocument();
    expect(screen.getByText("500 m")).toBeInTheDocument();

    // Check travel types
    expect(screen.getByText("quantum")).toBeInTheDocument();
    expect(screen.getByText("on_foot")).toBeInTheDocument();
  });

  it("shows bidirectional distances correctly", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);

    // dist-1: from_location_id=loc-1, to_location_id=loc-2 → should show ARC-L2
    // dist-2: from_location_id=loc-3, to_location_id=loc-1 → should show ARC-L3
    expect(await screen.findByText("ARC-L2")).toBeInTheDocument();
    expect(screen.getByText("ARC-L3")).toBeInTheDocument();
  });

  it("shows empty state when no distances exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        }),
      ),
    );

    render(<DistancesTab locationId="loc-1" />);
    expect(
      await screen.findByText("No distances configured for this location."),
    ).toBeInTheDocument();
  });

  it("shows error when loading fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        }),
      ),
    );

    render(<DistancesTab locationId="loc-1" />);
    expect(
      await screen.findByText("Failed to load distances"),
    ).toBeInTheDocument();
  });

  it("shows Add Distance button and toggles form", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);

    await screen.findByText("ARC-L2");

    const addButton = screen.getByText("Add Distance");
    expect(addButton).toBeInTheDocument();

    await userEvent.click(addButton);

    expect(screen.getByLabelText("Target Location")).toBeInTheDocument();
    expect(screen.getByLabelText("Distance (meters)")).toBeInTheDocument();
    expect(screen.getByLabelText("Travel Type")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("hides add form when Cancel is clicked", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);

    await screen.findByText("ARC-L2");

    await userEvent.click(screen.getByText("Add Distance"));
    expect(screen.getByLabelText("Target Location")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByLabelText("Target Location")).not.toBeInTheDocument();
  });

  it("opens delete confirmation dialog when trash icon is clicked", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);

    await screen.findByText("ARC-L2");

    const deleteButton = screen.getByLabelText("Delete distance to ARC-L2");
    await userEvent.click(deleteButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to delete the distance to ARC-L2?",
      ),
    ).toBeInTheDocument();
  });

  it("deletes distance when confirmed", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);

    await screen.findByText("ARC-L2");

    const deleteButton = screen.getByLabelText("Delete distance to ARC-L2");
    await userEvent.click(deleteButton);

    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByText("Delete"));

    // After delete, ARC-L2 should be removed
    expect(screen.queryByText("ARC-L2")).not.toBeInTheDocument();
    // ARC-L3 should still be present
    expect(screen.getByText("ARC-L3")).toBeInTheDocument();

    // Verify DELETE was called
    expect(fetch).toHaveBeenCalledWith(
      `${MAPS_BASE}/distances/dist-1`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("closes delete dialog when Cancel is clicked", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);

    await screen.findByText("ARC-L2");

    await userEvent.click(screen.getByLabelText("Delete distance to ARC-L2"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByText("Cancel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sorts distances alphabetically by location name", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);

    await screen.findByText("ARC-L2");

    const rows = screen.getAllByRole("row").slice(1); // skip header
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("ARC-L2");
    expect(rows[1]).toHaveTextContent("ARC-L3");
  });

  it("has delete buttons with accessible labels", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);

    await screen.findByText("ARC-L2");

    expect(
      screen.getByLabelText("Delete distance to ARC-L2"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Delete distance to ARC-L3"),
    ).toBeInTheDocument();
  });

  it("falls back to location ID when getLocation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === `${MAPS_BASE}/locations/loc-1/distances`) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  id: "dist-x",
                  from_location_id: "loc-1",
                  to_location_id: "loc-unknown",
                  distance: 999,
                  travel_type: "scm",
                },
              ]),
          });
        }
        // All location lookups fail
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });
      }),
    );

    render(<DistancesTab locationId="loc-1" />);

    // Should fall back to showing the raw ID
    expect(await screen.findByText("loc-unknown")).toBeInTheDocument();
  });

  it("adds a new distance via the add form", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);

    await screen.findByText("ARC-L2");

    // Open add form
    await userEvent.click(screen.getByText("Add Distance"));

    // Type in autocomplete to trigger search
    const searchInput = screen.getByPlaceholderText("Search location…");
    await userEvent.type(searchInput, "ARC");

    // Wait for debounced search results
    const option = await screen.findByRole("option", {
      name: /ARC-L2 \(station\)/,
    });
    await userEvent.click(option);

    // Fill distance
    const distanceInput = screen.getByLabelText("Distance (meters)");
    await userEvent.clear(distanceInput);
    await userEvent.type(distanceInput, "5000");

    // Select travel type
    const travelTypeSelect = screen.getByLabelText("Travel Type");
    await userEvent.selectOptions(travelTypeSelect, "scm");

    // Click Save
    await userEvent.click(screen.getByText("Save"));

    // Verify POST was called with correct payload
    expect(fetch).toHaveBeenCalledWith(
      `${MAPS_BASE}/distances/`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          from_location_id: "loc-1",
          to_location_id: "loc-2",
          distance: 5000,
          travel_type: "scm",
        }),
      }),
    );

    // Form should be hidden after save
    expect(
      screen.queryByLabelText("Target Location"),
    ).not.toBeInTheDocument();
  });

  it("shows error when adding a distance fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url === `${MAPS_BASE}/locations/loc-1/distances`) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDistances),
          });
        }
        if (url === `${MAPS_BASE}/locations/loc-2`) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLocationArcL2),
          });
        }
        if (url === `${MAPS_BASE}/locations/loc-3`) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLocationArcL3),
          });
        }
        if (url.includes("/locations/search")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockLocationArcL2]),
          });
        }
        // Create distance fails
        if (url === `${MAPS_BASE}/distances/` && init?.method === "POST") {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }),
    );

    render(<DistancesTab locationId="loc-1" />);
    await screen.findByText("ARC-L2");

    // Open add form
    await userEvent.click(screen.getByText("Add Distance"));

    // Search and select
    const searchInput = screen.getByPlaceholderText("Search location…");
    await userEvent.type(searchInput, "ARC");
    const option = await screen.findByRole("option", {
      name: /ARC-L2 \(station\)/,
    });
    await userEvent.click(option);

    // Save
    await userEvent.click(screen.getByText("Save"));

    // Should show error
    expect(
      await screen.findByText("Failed to add distance"),
    ).toBeInTheDocument();
  });

  it("shows error when delete fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url === `${MAPS_BASE}/locations/loc-1/distances`) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDistances),
          });
        }
        if (url === `${MAPS_BASE}/locations/loc-2`) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLocationArcL2),
          });
        }
        if (url === `${MAPS_BASE}/locations/loc-3`) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLocationArcL3),
          });
        }
        // Delete fails
        if (init?.method === "DELETE") {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }),
    );

    render(<DistancesTab locationId="loc-1" />);
    await screen.findByText("ARC-L2");

    // Click delete
    await userEvent.click(screen.getByLabelText("Delete distance to ARC-L2"));

    // Confirm
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByText("Delete"));

    // Should show error
    expect(
      await screen.findByText("Failed to delete distance"),
    ).toBeInTheDocument();

    // Distance should still be in the list
    expect(screen.getByText("ARC-L2")).toBeInTheDocument();
  });

  it("clears selected target in add form", async () => {
    setupFetch();
    render(<DistancesTab locationId="loc-1" />);
    await screen.findByText("ARC-L2");

    // Open add form
    await userEvent.click(screen.getByText("Add Distance"));

    // Search and select
    const searchInput = screen.getByPlaceholderText("Search location…");
    await userEvent.type(searchInput, "ARC");
    const option = await screen.findByRole("option", {
      name: /ARC-L2 \(station\)/,
    });
    await userEvent.click(option);

    // Should show selected value with clear button
    expect(screen.getByText("ARC-L2 (station)")).toBeInTheDocument();

    // Clear the selection
    await userEvent.click(screen.getByLabelText("Clear selection"));

    // Should show search input again
    expect(
      screen.getByPlaceholderText("Search location…"),
    ).toBeInTheDocument();
  });
});

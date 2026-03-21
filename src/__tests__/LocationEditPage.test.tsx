import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import LocationEditPage from "@/pages/LocationEditPage";
import type { Location } from "@/types/location";

const mockLocation: Location = {
  id: "loc-1",
  name: "Port Olisar",
  location_type: "station",
  parent_id: "planet-1",
  coordinates: { x: 100, y: 200, z: 300 },
  has_trade_terminal: true,
  has_landing_pad: true,
  landing_pad_size: "large",
};

const mockParent: Location = {
  id: "planet-1",
  name: "Crusader",
  location_type: "planet",
  parent_id: null,
  coordinates: { x: 0, y: 0, z: 0 },
  has_trade_terminal: false,
  has_landing_pad: false,
  landing_pad_size: null,
};

const mockSystem: Location = {
  id: "system-1",
  name: "Stanton",
  location_type: "system",
  parent_id: null,
  coordinates: { x: 0, y: 0, z: 0 },
  has_trade_terminal: false,
  has_landing_pad: false,
  landing_pad_size: null,
};

function renderEditPage(id = "loc-1") {
  return render(
    <MemoryRouter initialEntries={[`/locations/${id}`]}>
      <Routes>
        <Route path="/locations/:id" element={<LocationEditPage />} />
        <Route path="/locations" element={<p>Location List</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderNewPage() {
  return render(
    <MemoryRouter initialEntries={["/locations/new"]}>
      <Routes>
        <Route path="/locations/new" element={<LocationEditPage />} />
        <Route path="/locations/:id" element={<p>Edit Location Page</p>} />
        <Route path="/locations" element={<p>Location List</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("location_type=system")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: () => Promise.resolve([mockSystem]),
        });
      }
      if (url.includes("/locations/planet-1")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: () => Promise.resolve(mockParent),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockLocation),
      });
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LocationEditPage - Edit mode", () => {
  it("shows loading state then renders the form", async () => {
    renderEditPage();
    expect(screen.getByText("Loading location…")).toBeInTheDocument();
    expect(await screen.findByText("Edit Location")).toBeInTheDocument();
  });

  it("shows 404 when location is not found", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    renderEditPage("missing");
    expect(
      await screen.findByText("Location Not Found"),
    ).toBeInTheDocument();
  });

  it("loads form fields from fetched location", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    expect(screen.getByLabelText("Name")).toHaveValue("Port Olisar");
    expect(screen.getByLabelText("Location Type")).toHaveValue("station");
    expect(screen.getByLabelText("X")).toHaveValue(100);
    expect(screen.getByLabelText("Y")).toHaveValue(200);
    expect(screen.getByLabelText("Z")).toHaveValue(300);
    expect(screen.getByLabelText("Has trade terminal")).toBeChecked();
    expect(screen.getByLabelText("Has landing pad")).toBeChecked();
    expect(screen.getByLabelText("Landing Pad Size")).toHaveValue("large");
  });

  it("loads parent name", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    // The parent name should be resolved
    expect(await screen.findByText("Crusader")).toBeInTheDocument();
  });

  it("can edit the name field", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    const nameInput = screen.getByLabelText("Name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "New Port");
    expect(nameInput).toHaveValue("New Port");
  });

  it("can change location type", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    const select = screen.getByLabelText("Location Type");
    await userEvent.selectOptions(select, "moon");
    expect(select).toHaveValue("moon");
  });

  it("can edit coordinate fields", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    const xInput = screen.getByLabelText("X");
    await userEvent.clear(xInput);
    await userEvent.type(xInput, "50");
    expect(xInput).toHaveValue(50);
  });

  it("can toggle checkboxes", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    const tradeCheckbox = screen.getByLabelText("Has trade terminal");
    await userEvent.click(tradeCheckbox);
    expect(tradeCheckbox).not.toBeChecked();
  });

  it("hides landing pad size when has_landing_pad is unchecked", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    expect(screen.getByLabelText("Landing Pad Size")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Has landing pad"));
    expect(screen.queryByLabelText("Landing Pad Size")).not.toBeInTheDocument();
  });

  it("saves location and shows success toast", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    await userEvent.click(screen.getByText("Save"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Location saved successfully",
    );

    // Verify PUT was called
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8003/locations/loc-1",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("shows name validation error when empty", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("shows landing pad size validation error when pad enabled but no size", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    // Landing pad is already checked, change size to empty
    const sizeSelect = screen.getByLabelText("Landing Pad Size");
    await userEvent.selectOptions(sizeSelect, "");

    await userEvent.click(screen.getByText("Save"));
    expect(
      screen.getByText(
        "Landing pad size is required when landing pad is enabled",
      ),
    ).toBeInTheDocument();
  });

  it("navigates back to locations list via Back button", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    await userEvent.click(screen.getByText("Back"));
    expect(await screen.findByText("Location List")).toBeInTheDocument();
  });

  it("navigates from 404 page back to locations", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    renderEditPage("missing");
    await screen.findByText("Location Not Found");

    await userEvent.click(screen.getByText("Back to Locations"));
    expect(await screen.findByText("Location List")).toBeInTheDocument();
  });

  it("clears parent location", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");
    await screen.findByText("Crusader");

    await userEvent.click(screen.getByLabelText("Clear parent"));
    expect(screen.queryByText("Crusader")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search parent location…"),
    ).toBeInTheDocument();
  });

  it("shows error toast when save fails", async () => {
    (fetch as Mock).mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });
      }
      if (url.includes("location_type=system")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: () => Promise.resolve([mockSystem]),
        });
      }
      if (url.includes("/locations/planet-1")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: () => Promise.resolve(mockParent),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockLocation),
      });
    });

    renderEditPage();
    await screen.findByText("Edit Location");

    await userEvent.click(screen.getByText("Save"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Failed to save location",
    );
  });
});

describe("LocationEditPage - Tabs", () => {
  it("shows Details and Distances tabs when editing an existing location", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Distances")).toBeInTheDocument();
  });

  it("does not show tabs when creating a new location", () => {
    renderNewPage();
    expect(screen.getByText("New Location")).toBeInTheDocument();

    expect(screen.queryByText("Details")).not.toBeInTheDocument();
    expect(screen.queryByText("Distances")).not.toBeInTheDocument();
  });

  it("defaults to Details tab showing the form", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("switches to Distances tab when clicked", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    await userEvent.click(screen.getByText("Distances"));

    // Form should be hidden
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("switches back to Details tab", async () => {
    renderEditPage();
    await screen.findByText("Edit Location");

    await userEvent.click(screen.getByText("Distances"));
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Details"));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});

describe("LocationEditPage - Create mode", () => {
  it("renders New Location heading without loading", async () => {
    renderNewPage();
    expect(screen.getByText("New Location")).toBeInTheDocument();
    expect(screen.queryByText("Loading location…")).not.toBeInTheDocument();
  });

  it("starts with default form values", () => {
    renderNewPage();

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Location Type")).toHaveValue("station");
    expect(screen.getByLabelText("X")).toHaveValue(0);
    expect(screen.getByLabelText("Y")).toHaveValue(0);
    expect(screen.getByLabelText("Z")).toHaveValue(0);
    expect(screen.getByLabelText("Has trade terminal")).not.toBeChecked();
    expect(screen.getByLabelText("Has landing pad")).not.toBeChecked();
  });

  it("does not show landing pad size when unchecked", () => {
    renderNewPage();
    expect(screen.queryByLabelText("Landing Pad Size")).not.toBeInTheDocument();
  });

  it("shows landing pad size when checked", async () => {
    renderNewPage();

    await userEvent.click(screen.getByLabelText("Has landing pad"));
    expect(screen.getByLabelText("Landing Pad Size")).toBeInTheDocument();
  });

  it("creates location and navigates to edit page", async () => {
    const createdLocation: Location = {
      ...mockLocation,
      id: "new-loc-1",
      name: "Test Station",
    };

    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockSystem]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdLocation),
      });

    renderNewPage();

    await userEvent.type(screen.getByLabelText("Name"), "Test Station");
    await userEvent.click(screen.getByText("Save"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Location created successfully",
    );

    // Verify POST was called
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8003/locations",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows validation error when name is empty on create", async () => {
    renderNewPage();

    await userEvent.click(screen.getByText("Save"));
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("shows parent search results and allows selection", async () => {
    const searchResults: Location[] = [mockParent];

    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockSystem]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(searchResults),
      });

    renderNewPage();

    const searchInput = screen.getByPlaceholderText(
      "Search parent location…",
    );
    await userEvent.type(searchInput, "Cru");

    // Wait for debounced search
    const option = await screen.findByRole("option", { name: /Crusader/ });
    expect(option).toBeInTheDocument();

    await userEvent.click(option);
    expect(screen.getByText("Crusader")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Search parent location…"),
    ).not.toBeInTheDocument();
  });

  it("shows star system selector for non-system types", async () => {
    renderNewPage();

    // Default type is "station", should show Star System selector
    expect(
      await screen.findByLabelText("Star System"),
    ).toBeInTheDocument();
  });

  it("hides star system selector when type is system", async () => {
    renderNewPage();

    await screen.findByLabelText("Star System");

    const typeSelect = screen.getByLabelText("Location Type");
    await userEvent.selectOptions(typeSelect, "system");

    expect(screen.queryByLabelText("Star System")).not.toBeInTheDocument();
  });

  it("shows star system selector again when switching from system to planet", async () => {
    renderNewPage();

    await screen.findByLabelText("Star System");

    const typeSelect = screen.getByLabelText("Location Type");
    await userEvent.selectOptions(typeSelect, "system");
    expect(screen.queryByLabelText("Star System")).not.toBeInTheDocument();

    await userEvent.selectOptions(typeSelect, "planet");
    expect(
      await screen.findByLabelText("Star System"),
    ).toBeInTheDocument();
  });

  it("sets parent_id when selecting a system from the dropdown", async () => {
    renderNewPage();

    const systemSelect = await screen.findByLabelText("Star System");
    await userEvent.selectOptions(systemSelect, "system-1");

    // Fill in required name and save to verify parent_id was set
    await userEvent.type(screen.getByLabelText("Name"), "Test Station");

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "new-id",
          name: "Test Station",
          location_type: "station",
          parent_id: "system-1",
          coordinates: { x: 0, y: 0, z: 0 },
          has_trade_terminal: false,
          has_landing_pad: false,
          landing_pad_size: null,
        }),
    });

    await userEvent.click(screen.getByText("Save"));

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8003/locations",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"parent_id":"system-1"'),
      }),
    );
  });
});

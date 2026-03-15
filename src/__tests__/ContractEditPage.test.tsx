import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import ContractEditPage from "@/pages/ContractEditPage";
import type { Contract } from "@/types/contract";
import type { Location } from "@/types/location";

const mockContract: Contract = {
  id: "42",
  title: "Test Haul",
  description: "Move cargo from A to B",
  action: "haul",
  hauling_orders: [
    {
      commodity: "Laranite",
      scu_min: 50,
      scu_max: 100,
      max_container_scu: 32,
      pickup_location_id: "loc-1",
      delivery_location_id: "loc-2",
    },
  ],
  reward_uec: 50000,
  collateral_uec: 10000,
  deadline: "2026-06-01T12:00:00Z",
  requirements: {
    min_reputation: 3,
    required_ship_tags: ["cargo"],
    max_crew_size: null,
  },
  status: "draft",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockPickupLocation: Location = {
  id: "loc-1",
  name: "Port Olisar",
  location_type: "station",
  parent_id: null,
  coordinates: { x: 0, y: 0, z: 0 },
  has_trade_terminal: true,
  has_landing_pad: true,
  landing_pad_size: "large",
};

const mockDeliveryLocation: Location = {
  id: "loc-2",
  name: "Area18",
  location_type: "city",
  parent_id: null,
  coordinates: { x: 100, y: 100, z: 100 },
  has_trade_terminal: true,
  has_landing_pad: true,
  landing_pad_size: "large",
};

function renderPage(id = "42") {
  return render(
    <MemoryRouter initialEntries={[`/contracts/${id}`]}>
      <Routes>
        <Route path="/contracts/:id" element={<ContractEditPage />} />
        <Route path="/contracts" element={<p>Contract List</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/locations/search")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([mockPickupLocation, mockDeliveryLocation]),
        });
      }
      if (url.includes("/locations/loc-1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPickupLocation),
        });
      }
      if (url.includes("/locations/loc-2")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDeliveryLocation),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockContract),
      });
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContractEditPage", () => {
  // -- Loading & Fetch --
  it("shows loading state then renders the form", async () => {
    renderPage();
    expect(screen.getByText("Loading contract…")).toBeInTheDocument();
    expect(await screen.findByText("Edit Contract")).toBeInTheDocument();
  });

  it("shows 404 when contract is not found", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    renderPage("missing");
    expect(await screen.findByText("Contract Not Found")).toBeInTheDocument();
  });

  // -- Tabs --
  it("renders all 3 tabs and switches between them", async () => {
    renderPage();
    await screen.findByText("Edit Contract");

    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Hauling Orders")).toBeInTheDocument();
    expect(screen.getByText("Requirements")).toBeInTheDocument();

    // Default tab is General
    expect(screen.getByLabelText("Title")).toBeInTheDocument();

    // Switch to Hauling Orders tab
    await userEvent.click(screen.getByText("Hauling Orders"));
    expect(screen.getByText("Add Order")).toBeInTheDocument();

    // Switch to Requirements tab
    await userEvent.click(screen.getByText("Requirements"));
    expect(screen.getByLabelText("Min Reputation (0–5)")).toBeInTheDocument();
  });

  // -- General Tab Fields --
  it("loads general fields from fetched contract", async () => {
    renderPage();
    await screen.findByText("Edit Contract");

    expect(screen.getByLabelText("Title")).toHaveValue("Test Haul");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Move cargo from A to B",
    );
    expect(screen.getByLabelText("Action")).toHaveValue("haul");
    expect(screen.getByLabelText("Status")).toHaveValue("draft");
    expect(screen.getByLabelText("Reward (UEC)")).toHaveValue(50000);
    expect(screen.getByLabelText("Collateral (UEC)")).toHaveValue(10000);
    expect(screen.getByLabelText("Deadline")).toHaveValue("2026-06-01T12:00");
  });

  it("can edit general fields", async () => {
    renderPage();
    await screen.findByText("Edit Contract");

    const titleInput = screen.getByLabelText("Title");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "New Title");
    expect(titleInput).toHaveValue("New Title");

    // Edit deadline (datetime-local input)
    const deadlineInput = screen.getByLabelText("Deadline");
    // Firing a change event on datetime-local
    await userEvent.clear(deadlineInput);
    await userEvent.type(deadlineInput, "2026-12-25T15:30");
    expect(deadlineInput).toHaveValue("2026-12-25T15:30");
  });

  // -- Hauling Orders Tab --
  it("shows existing hauling orders and can add/remove", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Existing order
    expect(screen.getByLabelText("Commodity")).toHaveValue("Laranite");

    // Add order
    await userEvent.click(screen.getByText("Add Order"));
    const commodityInputs = screen.getAllByRole("textbox", {
      name: /commodity/i,
    });
    expect(commodityInputs).toHaveLength(2);

    // Remove order 2
    const removeButtons = screen.getAllByRole("button", {
      name: /remove order/i,
    });
    await userEvent.click(removeButtons[1]);
    expect(
      screen.getAllByRole("textbox", { name: /commodity/i }),
    ).toHaveLength(1);
  });

  it("can edit hauling order fields", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Edit commodity
    const commodityInput = screen.getByLabelText("Commodity");
    await userEvent.clear(commodityInput);
    await userEvent.type(commodityInput, "Titanium");
    expect(commodityInput).toHaveValue("Titanium");

    // Edit SCU Min
    const scuMinInput = screen.getByLabelText("SCU Min");
    await userEvent.clear(scuMinInput);
    await userEvent.type(scuMinInput, "10");
    expect(scuMinInput).toHaveValue(10);

    // Edit SCU Max
    const scuMaxInput = screen.getByLabelText("SCU Max");
    await userEvent.clear(scuMaxInput);
    await userEvent.type(scuMaxInput, "200");
    expect(scuMaxInput).toHaveValue(200);

    // Edit Max Container SCU
    const maxContainerInput = screen.getByLabelText("Max Container SCU");
    await userEvent.clear(maxContainerInput);
    await userEvent.type(maxContainerInput, "64");
    expect(maxContainerInput).toHaveValue(64);
  });

  it("shows commodity validation error when empty", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Clear commodity
    await userEvent.clear(screen.getByLabelText("Commodity"));

    // Save triggers validation
    await userEvent.click(screen.getByText("General"));
    await userEvent.click(screen.getByText("Save"));

    await userEvent.click(screen.getByText("Hauling Orders"));
    expect(screen.getByText("Commodity is required")).toBeInTheDocument();
  });

  it("shows resolved location names for existing hauling orders", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Location names should be resolved from getLocation calls
    expect(
      await screen.findByText("Port Olisar (station)"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Area18 (city)")).toBeInTheDocument();
  });

  it("can search and select a pickup location", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Wait for location names to resolve, then clear pickup
    await screen.findByText("Port Olisar (station)");
    const clearButtons = screen.getAllByLabelText("Clear selection");
    await userEvent.click(clearButtons[0]);

    // Type in the search input
    const searchInput = screen.getByPlaceholderText(
      "Search pickup location…",
    );
    await userEvent.type(searchInput, "Port");

    // Wait for search results (300ms debounce + async)
    const option = await screen.findByRole("option", {
      name: /Port Olisar/,
    });
    await userEvent.click(option);

    // Should show the selected location name
    expect(screen.getByText("Port Olisar (station)")).toBeInTheDocument();
  });

  it("can search and select a delivery location", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Wait for location names to resolve, then clear delivery
    await screen.findByText("Area18 (city)");
    const clearButtons = screen.getAllByLabelText("Clear selection");
    await userEvent.click(clearButtons[1]);

    // Type in the search input
    const searchInput = screen.getByPlaceholderText(
      "Search delivery location…",
    );
    await userEvent.type(searchInput, "Area");

    // Wait for search results
    const option = await screen.findByRole("option", {
      name: /Area18/,
    });
    await userEvent.click(option);

    // Should show the selected location name
    expect(screen.getByText("Area18 (city)")).toBeInTheDocument();
  });

  it("can clear a selected location", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Wait for location names to resolve
    await screen.findByText("Port Olisar (station)");
    const clearButtons = screen.getAllByLabelText("Clear selection");
    await userEvent.click(clearButtons[0]);

    // Search input should appear
    expect(
      screen.getByPlaceholderText("Search pickup location…"),
    ).toBeInTheDocument();
  });

  it("shows location validation error when location is cleared and saved", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Wait for location names to resolve, then clear pickup
    await screen.findByText("Port Olisar (station)");
    const clearButtons = screen.getAllByLabelText("Clear selection");
    await userEvent.click(clearButtons[0]);

    // Switch to General and save
    await userEvent.click(screen.getByText("General"));
    await userEvent.click(screen.getByText("Save"));

    // Switch back to see the error
    await userEvent.click(screen.getByText("Hauling Orders"));
    expect(
      screen.getByText("Pickup location is required"),
    ).toBeInTheDocument();
  });

  // -- Requirements Tab --
  it("loads requirements fields and shows star visual", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Requirements"));

    expect(screen.getByLabelText("Min Reputation (0–5)")).toHaveValue(3);

    // Star visual
    const starContainer = screen.getByLabelText("Reputation stars");
    expect(starContainer).toBeInTheDocument();
  });

  it("can add and remove ship tags", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Requirements"));

    // Existing tag
    expect(screen.getByText("cargo")).toBeInTheDocument();

    // Add a tag
    const tagInput = screen.getByPlaceholderText("Add a tag…");
    await userEvent.type(tagInput, "mining{Enter}");
    expect(screen.getByText("mining")).toBeInTheDocument();

    // Remove existing tag
    await userEvent.click(screen.getByLabelText("Remove tag cargo"));
    expect(screen.queryByText("cargo")).not.toBeInTheDocument();
  });

  // -- Save --
  it("saves contract and shows success toast", async () => {
    renderPage();
    await screen.findByText("Edit Contract");

    await userEvent.click(screen.getByText("Save"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Contract saved successfully",
    );

    // Verify PUT was called
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8001/contracts/42",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("shows validation errors when required fields are empty", async () => {
    renderPage();
    await screen.findByText("Edit Contract");

    // Clear required fields
    await userEvent.clear(screen.getByLabelText("Title"));
    await userEvent.clear(screen.getByLabelText("Description"));
    await userEvent.clear(screen.getByLabelText("Action"));

    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(screen.getByText("Action is required")).toBeInTheDocument();
  });

  it("shows deadline validation error when deadline is empty", async () => {
    // Mock a contract with empty deadline
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () =>
        Promise.resolve({ ...mockContract, deadline: "" }),
    });

    renderPage();
    await screen.findByText("Edit Contract");

    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Deadline is required")).toBeInTheDocument();
  });

  it("shows hauling validation error when all orders removed", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Remove the only order
    await userEvent.click(
      screen.getByRole("button", { name: /remove order 1/i }),
    );

    // Switch back to general and save
    await userEvent.click(screen.getByText("General"));
    await userEvent.click(screen.getByText("Save"));

    // Switch to hauling to see the error
    await userEvent.click(screen.getByText("Hauling Orders"));
    expect(
      screen.getByText("At least 1 hauling order is required"),
    ).toBeInTheDocument();
  });

  // -- Back navigation --
  it("navigates back to contracts list via Back button", async () => {
    renderPage();
    await screen.findByText("Edit Contract");

    await userEvent.click(screen.getByText("Back"));
    expect(await screen.findByText("Contract List")).toBeInTheDocument();
  });

  // -- Logo preview removed (contractor fields removed) --

  // -- Max crew size optional --
  it("handles max_crew_size as optional (null when empty)", async () => {
    renderPage();
    await screen.findByText("Edit Contract");
    await userEvent.click(screen.getByText("Requirements"));

    const crewInput = screen.getByLabelText("Max Crew Size");
    expect(crewInput).toHaveValue(null);

    await userEvent.type(crewInput, "4");
    expect(crewInput).toHaveValue(4);

    await userEvent.clear(crewInput);
    expect(crewInput).toHaveValue(null);
  });

  // -- Not found back button --
  it("navigates from 404 page back to contracts", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    renderPage("missing");
    await screen.findByText("Contract Not Found");

    await userEvent.click(
      within(screen.getByText("Contract Not Found").closest("div")!).getByText(
        "Back to Contracts",
      ),
    );
    expect(await screen.findByText("Contract List")).toBeInTheDocument();
  });
});

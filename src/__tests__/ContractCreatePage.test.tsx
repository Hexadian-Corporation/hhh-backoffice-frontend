import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";
import ContractCreatePage from "@/pages/ContractCreatePage";
import type { Contract } from "@/types/contract";
import type { Location } from "@/types/location";
import type { Commodity } from "@/types/commodity";

const mockCommodity: Commodity = {
  id: "comm-1",
  name: "Laranite",
  code: "LARA",
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

const mockCreatedContract: Contract = {
  id: "new-1",
  title: "New Haul",
  description: "Move cargo",
  faction: "test-faction",
  hauling_orders: [
    {
      commodity_id: "comm-1",
      scu_min: 0,
      scu_max: 0,
      max_container_scu: 0,
      pickup_location_id: "loc-1",
      delivery_location_id: "loc-2",
    },
  ],
  reward_uec: 0,
  collateral_uec: 0,
  deadline: "2026-06-01T12:00:00.000Z",
  requirements: {
    min_reputation: 0,
    required_ship_tags: [],
    max_crew_size: null,
  },
  status: "draft",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/contracts/new"]}>
      <Routes>
        <Route path="/contracts/new" element={<ContractCreatePage />} />
        <Route path="/contracts" element={<p>Contract List</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function mockFetch(postOk = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/commodities/search")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockCommodity]),
        });
      }
      if (url.includes("/locations/search")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([mockPickupLocation, mockDeliveryLocation]),
        });
      }
      if (init?.method === "POST") {
        if (!postOk) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
          });
        }
        return Promise.resolve({
          ok: true,
          status: 201,
          statusText: "Created",
          json: () => Promise.resolve(mockCreatedContract),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }),
  );
}

beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function fillRequiredFields() {
  // Fill general fields
  await userEvent.type(screen.getByLabelText("Title"), "New Haul");
  await userEvent.type(screen.getByLabelText("Description"), "Move cargo");
  await userEvent.type(screen.getByLabelText("Faction"), "test-faction");
  await userEvent.type(screen.getByLabelText("Deadline"), "2026-06-01T12:00");

  // Fill hauling order autocomplete fields
  await userEvent.click(screen.getByText("Hauling Orders"));

  // Select commodity
  const commodityInput = screen.getByPlaceholderText("Search commodity…");
  await userEvent.type(commodityInput, "Lara");
  const commodityOption = await screen.findByRole("option", {
    name: /Laranite/,
  });
  await userEvent.click(commodityOption);

  // Select pickup location
  const pickupInput = screen.getByPlaceholderText("Search pickup location…");
  await userEvent.type(pickupInput, "Port");
  const pickupOption = await screen.findByRole("option", {
    name: /Port Olisar/,
  });
  await userEvent.click(pickupOption);

  // Select delivery location
  const deliveryInput = screen.getByPlaceholderText(
    "Search delivery location…",
  );
  await userEvent.type(deliveryInput, "Area");
  const deliveryOption = await screen.findByRole("option", {
    name: /Area18/,
  });
  await userEvent.click(deliveryOption);

  // Switch back to General tab
  await userEvent.click(screen.getByText("General"));
}

describe("ContractCreatePage", () => {
  // -- Rendering --
  it("renders the create form with header and tabs", () => {
    renderPage();
    expect(screen.getByText("Create Contract")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Hauling Orders")).toBeInTheDocument();
    expect(screen.getByText("Requirements")).toBeInTheDocument();
  });

  it("renders Create and Back buttons", () => {
    renderPage();
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("does not show loading state (no data to fetch)", () => {
    renderPage();
    expect(screen.queryByText("Loading contract…")).not.toBeInTheDocument();
    expect(screen.getByText("Create Contract")).toBeInTheDocument();
  });

  // -- Default state --
  it("defaults status to draft and disables it", () => {
    renderPage();
    const statusSelect = screen.getByLabelText("Status");
    expect(statusSelect).toHaveValue("draft");
    expect(statusSelect).toBeDisabled();
  });

  it("starts with empty form fields", () => {
    renderPage();
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.getByLabelText("Faction")).toHaveValue("");
    expect(screen.getByLabelText("Reward (UEC)")).toHaveValue(0);
    expect(screen.getByLabelText("Collateral (UEC)")).toHaveValue(0);
  });

  // -- Tab switching --
  it("switches between tabs", async () => {
    renderPage();

    // Default tab shows General fields
    expect(screen.getByLabelText("Title")).toBeInTheDocument();

    // Switch to Hauling Orders tab
    await userEvent.click(screen.getByText("Hauling Orders"));
    expect(screen.getByText("Add Order")).toBeInTheDocument();

    // Switch to Requirements tab
    await userEvent.click(screen.getByText("Requirements"));
    expect(screen.getByLabelText("Min Reputation (0–5)")).toBeInTheDocument();

    // Switch back to General
    await userEvent.click(screen.getByText("General"));
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  // -- Validation --
  it("shows validation errors when required fields are empty", async () => {
    renderPage();

    await userEvent.click(screen.getByText("Create"));

    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(screen.getByText("Faction is required")).toBeInTheDocument();
    expect(screen.getByText("Deadline is required")).toBeInTheDocument();
  });

  it("shows hauling order validation errors", async () => {
    renderPage();

    await userEvent.click(screen.getByText("Create"));

    // Switch to Hauling Orders tab to see the errors
    await userEvent.click(screen.getByText("Hauling Orders"));
    expect(screen.getByText("Commodity is required")).toBeInTheDocument();
    expect(screen.getByText("Pickup location is required")).toBeInTheDocument();
    expect(
      screen.getByText("Delivery location is required"),
    ).toBeInTheDocument();
  });

  it("shows error when all hauling orders are removed", async () => {
    renderPage();
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Remove the default order
    await userEvent.click(
      screen.getByRole("button", { name: /remove order 1/i }),
    );

    // Switch back to general and create
    await userEvent.click(screen.getByText("General"));
    await userEvent.click(screen.getByText("Create"));

    // Switch to hauling to see the error
    await userEvent.click(screen.getByText("Hauling Orders"));
    expect(
      screen.getByText("At least 1 hauling order is required"),
    ).toBeInTheDocument();
  });

  it("clears validation error when field is corrected", async () => {
    renderPage();

    // Trigger validation
    await userEvent.click(screen.getByText("Create"));
    expect(screen.getByText("Title is required")).toBeInTheDocument();

    // Fix the title
    await userEvent.type(screen.getByLabelText("Title"), "New Contract");
    expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
  });

  it("clears hauling order error when an order is added back", async () => {
    renderPage();
    await userEvent.click(screen.getByText("Hauling Orders"));

    // Remove the default order
    await userEvent.click(
      screen.getByRole("button", { name: /remove order 1/i }),
    );

    // Trigger validation
    await userEvent.click(screen.getByText("General"));
    await userEvent.click(screen.getByText("Create"));

    // Add order back
    await userEvent.click(screen.getByText("Hauling Orders"));
    expect(
      screen.getByText("At least 1 hauling order is required"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByText("Add Order"));
    expect(
      screen.queryByText("At least 1 hauling order is required"),
    ).not.toBeInTheDocument();
  });

  // -- Successful creation --
  it("calls createContract and navigates to /contracts on success", async () => {
    renderPage();

    await fillRequiredFields();

    await userEvent.click(screen.getByText("Create"));

    // Should navigate to /contracts
    expect(await screen.findByText("Contract List")).toBeInTheDocument();

    // Verify POST was called
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8001/contracts",
      expect.objectContaining({ method: "POST" }),
    );
  });

  // -- Save failure --
  it("shows error toast when create fails", async () => {
    vi.restoreAllMocks();
    mockFetch(false);

    renderPage();

    await fillRequiredFields();

    await userEvent.click(screen.getByText("Create"));

    // Should show error toast
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Failed to create contract",
    );

    // Should NOT navigate away
    expect(screen.getByText("Create Contract")).toBeInTheDocument();
  });

  // -- Back navigation --
  it("navigates back to contracts list via Back button", async () => {
    renderPage();

    await userEvent.click(screen.getByText("Back"));
    expect(await screen.findByText("Contract List")).toBeInTheDocument();
  });

  // -- Hauling orders interactions --
  it("can add hauling orders", async () => {
    renderPage();
    await userEvent.click(screen.getByText("Hauling Orders"));

    // There should be one default order
    expect(
      screen.getByRole("button", { name: /remove order 1/i }),
    ).toBeInTheDocument();

    // Add another order
    await userEvent.click(screen.getByText("Add Order"));
    expect(
      screen.getByRole("button", { name: /remove order 2/i }),
    ).toBeInTheDocument();
  });

  // -- Requirements tab --
  it("can edit requirements fields", async () => {
    renderPage();
    await userEvent.click(screen.getByText("Requirements"));

    const repInput = screen.getByLabelText("Min Reputation (0–5)");
    expect(repInput).toHaveValue(0);

    await userEvent.clear(repInput);
    await userEvent.type(repInput, "3");
    expect(repInput).toHaveValue(3);
  });

  it("can add ship tags", async () => {
    renderPage();
    await userEvent.click(screen.getByText("Requirements"));

    const tagInput = screen.getByPlaceholderText("Add a tag…");
    await userEvent.type(tagInput, "cargo{Enter}");
    expect(screen.getByText("cargo")).toBeInTheDocument();
  });

  it("handles max_crew_size as optional (null when empty)", async () => {
    renderPage();
    await userEvent.click(screen.getByText("Requirements"));

    const crewInput = screen.getByLabelText("Max Crew Size");
    expect(crewInput).toHaveValue(null);

    await userEvent.type(crewInput, "4");
    expect(crewInput).toHaveValue(4);

    await userEvent.clear(crewInput);
    expect(crewInput).toHaveValue(null);
  });

  // -- Edit general fields --
  it("can edit general fields", async () => {
    renderPage();

    const titleInput = screen.getByLabelText("Title");
    await userEvent.type(titleInput, "Test Title");
    expect(titleInput).toHaveValue("Test Title");

    const descInput = screen.getByLabelText("Description");
    await userEvent.type(descInput, "Test Desc");
    expect(descInput).toHaveValue("Test Desc");

    const factionInput = screen.getByLabelText("Faction");
    await userEvent.type(factionInput, "test-faction");
    expect(factionInput).toHaveValue("test-faction");
  });

  it("shows Creating… text while saving", async () => {
    // Make the POST hang to observe the saving state
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url.includes("/commodities/search")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockCommodity]),
          });
        }
        if (url.includes("/locations/search")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([mockPickupLocation, mockDeliveryLocation]),
          });
        }
        if (init?.method === "POST") {
          // Return a promise that never resolves to keep saving state
          return new Promise(() => {});
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }),
    );

    renderPage();
    await fillRequiredFields();
    await userEvent.click(screen.getByText("Create"));

    expect(screen.getByText("Creating…")).toBeInTheDocument();
  });
});

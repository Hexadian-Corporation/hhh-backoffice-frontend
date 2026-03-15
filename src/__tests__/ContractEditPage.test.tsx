import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import ContractEditPage from "@/pages/ContractEditPage";
import type { Contract } from "@/types/contract";

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
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockContract),
      }),
    ),
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

    // Clear required field
    const titleInput = screen.getByLabelText("Title");
    await userEvent.clear(titleInput);

    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Title is required")).toBeInTheDocument();
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

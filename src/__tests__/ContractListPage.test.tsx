import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import ContractListPage from "@/pages/ContractListPage";
import type { Contract } from "@/types/contract";

const makeContract = (
  overrides: Partial<Contract> = {},
): Contract => ({
  id: "con-1",
  title: "Laranite Haul",
  description: "Transport laranite",
  faction: "United Empire of Earth",
  hauling_orders: [
    {
      commodity_id: "comm-1",
      scu_min: 10,
      scu_max: 50,
      max_container_scu: 32,
      pickup_location_id: "loc-1",
      delivery_location_id: "loc-2",
    },
  ],
  reward_uec: 25000,
  collateral_uec: 5000,
  deadline: "2950-06-15T00:00:00Z",
  requirements: {
    min_reputation: 2,
    required_ship_tags: [],
    max_crew_size: null,
  },
  status: "active",
  created_at: "2950-01-01T00:00:00Z",
  updated_at: "2950-01-01T00:00:00Z",
  ...overrides,
});

const mockContracts: Contract[] = [
  makeContract(),
  makeContract({
    id: "con-2",
    title: "Titanium Express",
    description: "Deliver titanium quickly",
    faction: "Crusader Industries",
    hauling_orders: [
      {
        commodity_id: "comm-2",
        scu_min: 5,
        scu_max: 20,
        max_container_scu: 16,
        pickup_location_id: "loc-3",
        delivery_location_id: "loc-4",
      },
      {
        commodity_id: "comm-3",
        scu_min: 5,
        scu_max: 10,
        max_container_scu: 16,
        pickup_location_id: "loc-5",
        delivery_location_id: "loc-6",
      },
    ],
    reward_uec: 50000,
    collateral_uec: 10000,
    deadline: "2950-07-01T00:00:00Z",
    requirements: {
      min_reputation: 3,
      required_ship_tags: ["cargo"],
      max_crew_size: 4,
    },
    status: "draft",
    created_at: "2950-01-02T00:00:00Z",
    updated_at: "2950-01-02T00:00:00Z",
  }),
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/contracts"]}>
      <Routes>
        <Route path="/contracts" element={<ContractListPage />} />
        <Route path="/contracts/new" element={<p>New Contract Page</p>} />
        <Route path="/contracts/:id" element={<p>Edit Contract Page</p>} />
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
        json: () => Promise.resolve(mockContracts),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContractListPage", () => {
  // -- Loading & Fetch --
  it("shows loading skeleton then renders the cards", async () => {
    renderPage();
    expect(screen.getAllByTestId("skeleton-card")).toHaveLength(3);
    expect(await screen.findByText("Contratos")).toBeInTheDocument();
  });

  it("renders contracts from API as cards", async () => {
    renderPage();
    await screen.findByText("Contratos");

    expect(screen.getByText("Laranite Haul")).toBeInTheDocument();
    expect(screen.getByText("United Empire of Earth")).toBeInTheDocument();
    expect(screen.getByText("Titanium Express")).toBeInTheDocument();
    expect(screen.getByText("Crusader Industries")).toBeInTheDocument();
  });

  it("shows empty state when no contracts", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderPage();
    expect(
      await screen.findByText("No contracts found."),
    ).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderPage();
    expect(
      await screen.findByText("Failed to load contracts"),
    ).toBeInTheDocument();
  });

  it("shows retry button on error and retries on click", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContracts),
      });

    renderPage();
    expect(
      await screen.findByText("Failed to load contracts"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByText("Retry"));
    expect(await screen.findByText("Laranite Haul")).toBeInTheDocument();
  });

  // -- Status badges --
  it("displays status badges with correct statuses", async () => {
    renderPage();
    await screen.findByText("Contratos");

    expect(screen.getByTestId("status-badge-active")).toHaveTextContent("active");
    expect(screen.getByTestId("status-badge-draft")).toHaveTextContent("draft");
  });

  // -- Reward & deadline --
  it("displays reward in UEC and deadline", async () => {
    renderPage();
    await screen.findByText("Contratos");

    expect(screen.getByText(/25,000/)).toBeInTheDocument();
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it("displays hauling order counts", async () => {
    renderPage();
    await screen.findByText("Contratos");

    expect(screen.getByText("1 hauling order")).toBeInTheDocument();
    expect(screen.getByText("2 hauling orders")).toBeInTheDocument();
  });

  // -- Status filter --
  it("renders status filter buttons", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const filterGroup = screen.getByRole("group", { name: "Filter by status" });
    expect(filterGroup).toBeInTheDocument();
    expect(within(filterGroup).getByText("all")).toBeInTheDocument();
    expect(within(filterGroup).getByText("draft")).toBeInTheDocument();
    expect(within(filterGroup).getByText("active")).toBeInTheDocument();
    expect(within(filterGroup).getByText("expired")).toBeInTheDocument();
    expect(within(filterGroup).getByText("cancelled")).toBeInTheDocument();
  });

  it("filters contracts by status", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const filterGroup = screen.getByRole("group", { name: "Filter by status" });

    // Click "active" filter
    await userEvent.click(within(filterGroup).getByText("active"));
    expect(screen.getByText("Laranite Haul")).toBeInTheDocument();
    expect(screen.queryByText("Titanium Express")).not.toBeInTheDocument();

    // Click "draft" filter
    await userEvent.click(within(filterGroup).getByText("draft"));
    expect(screen.queryByText("Laranite Haul")).not.toBeInTheDocument();
    expect(screen.getByText("Titanium Express")).toBeInTheDocument();

    // Click "all" to reset
    await userEvent.click(within(filterGroup).getByText("all"));
    expect(screen.getByText("Laranite Haul")).toBeInTheDocument();
    expect(screen.getByText("Titanium Express")).toBeInTheDocument();
  });

  it("shows empty message when filter matches no contracts", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const filterGroup = screen.getByRole("group", { name: "Filter by status" });
    await userEvent.click(within(filterGroup).getByText("expired"));
    expect(screen.getByText("No contracts found.")).toBeInTheDocument();
  });

  // -- Navigation --
  it("navigates to new contract page on button click", async () => {
    renderPage();
    await screen.findByText("Contratos");

    await userEvent.click(screen.getByText("New Contract"));
    expect(
      await screen.findByText("New Contract Page"),
    ).toBeInTheDocument();
  });

  it("navigates to edit page when clicking a card", async () => {
    renderPage();
    await screen.findByText("Contratos");

    await userEvent.click(screen.getByText("Laranite Haul"));
    expect(
      await screen.findByText("Edit Contract Page"),
    ).toBeInTheDocument();
  });

  // -- Status action buttons --
  it("shows Activate and Cancel buttons on draft contracts", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const draftCard = screen.getByText("Titanium Express").closest("[role='article']")!;
    expect(within(draftCard).getByText("Activate")).toBeInTheDocument();
    expect(within(draftCard).getByText("Cancel")).toBeInTheDocument();
  });

  it("shows Expire and Cancel buttons on active contracts", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const activeCard = screen.getByText("Laranite Haul").closest("[role='article']")!;
    expect(within(activeCard).getByText("Expire")).toBeInTheDocument();
    expect(within(activeCard).getByText("Cancel")).toBeInTheDocument();
  });

  it("does not show action buttons on expired contracts", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([makeContract({ status: "expired", title: "Old Contract" })]),
    });

    renderPage();
    await screen.findByText("Contratos");

    const card = screen.getByText("Old Contract").closest("[role='article']")!;
    expect(within(card).queryByText("Activate")).not.toBeInTheDocument();
    expect(within(card).queryByText("Cancel")).not.toBeInTheDocument();
    expect(within(card).queryByText("Expire")).not.toBeInTheDocument();
  });

  it("does not show action buttons on cancelled contracts", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          makeContract({ status: "cancelled", title: "Voided Contract" }),
        ]),
    });

    renderPage();
    await screen.findByText("Contratos");

    const card = screen.getByText("Voided Contract").closest("[role='article']")!;
    expect(within(card).queryByText("Activate")).not.toBeInTheDocument();
    expect(within(card).queryByText("Cancel")).not.toBeInTheDocument();
    expect(within(card).queryByText("Expire")).not.toBeInTheDocument();
  });

  // -- Confirmation dialog --
  it("shows confirmation dialog when clicking Activate", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const draftCard = screen.getByText("Titanium Express").closest("[role='article']")!;
    await userEvent.click(within(draftCard).getByText("Activate"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to activate this contract?"),
    ).toBeInTheDocument();
  });

  it("closes confirmation dialog when clicking Cancel in dialog", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const draftCard = screen.getByText("Titanium Express").closest("[role='article']")!;
    await userEvent.click(within(draftCard).getByText("Activate"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click Cancel in the dialog (not the card Cancel button)
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByText("Cancel"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows destructive confirmation for Cancel action", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const draftCard = screen.getByText("Titanium Express").closest("[role='article']")!;
    await userEvent.click(within(draftCard).getByText("Cancel"));

    expect(
      screen.getByText(
        "Are you sure you want to cancel this contract? This cannot be undone.",
      ),
    ).toBeInTheDocument();
  });

  // -- Status change API call --
  it("calls updateContract and shows success toast on Activate confirm", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const updatedContract = makeContract({
      id: "con-2",
      title: "Titanium Express",
      status: "active",
    });

    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContracts),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedContract),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            mockContracts[0],
            { ...mockContracts[1], status: "active" },
          ]),
      });

    renderPage();
    await screen.findByText("Contratos");

    const draftCard = screen.getByText("Titanium Express").closest("[role='article']")!;
    await userEvent.click(within(draftCard).getByText("Activate"));

    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByText("Activate"));

    expect(
      await screen.findByText("Contract active successfully"),
    ).toBeInTheDocument();

    // Verify the PUT call was made with correct payload
    const putCall = (fetch as Mock).mock.calls.find(
      (call: string[]) =>
        typeof call[0] === "string" && call[0].includes("/contracts/con-2"),
    );
    expect(putCall).toBeDefined();
    expect(JSON.parse(putCall![1].body)).toEqual({ status: "active" });

    vi.useRealTimers();
  });

  it("shows error toast when status change fails", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContracts),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

    renderPage();
    await screen.findByText("Contratos");

    const activeCard = screen.getByText("Laranite Haul").closest("[role='article']")!;
    await userEvent.click(within(activeCard).getByText("Expire"));

    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByText("Expire"));

    expect(
      await screen.findByText("Failed to update contract status"),
    ).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("does not navigate when clicking action buttons", async () => {
    renderPage();
    await screen.findByText("Contratos");

    const draftCard = screen.getByText("Titanium Express").closest("[role='article']")!;
    await userEvent.click(within(draftCard).getByText("Activate"));

    // Should still be on the list page, not the edit page
    expect(screen.getByText("Contratos")).toBeInTheDocument();
    expect(screen.queryByText("Edit Contract Page")).not.toBeInTheDocument();
  });

  // -- Delete --
  it("shows delete button on each contract card", async () => {
    renderPage();
    await screen.findByText("Contratos");

    expect(
      screen.getByLabelText("Delete Laranite Haul"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Delete Titanium Express"),
    ).toBeInTheDocument();
  });

  it("shows confirmation dialog when clicking delete button", async () => {
    renderPage();
    await screen.findByText("Contratos");

    await userEvent.click(screen.getByLabelText("Delete Laranite Haul"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to delete 'Laranite Haul'? This action cannot be undone.",
      ),
    ).toBeInTheDocument();
  });

  it("closes delete dialog when clicking Cancel", async () => {
    renderPage();
    await screen.findByText("Contratos");

    await userEvent.click(screen.getByLabelText("Delete Titanium Express"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByText("Cancel"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Contract should still be there
    expect(screen.getByText("Titanium Express")).toBeInTheDocument();
  });

  it("deletes contract and shows success toast on confirm", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContracts),
      })
      .mockResolvedValueOnce({ ok: true });

    renderPage();
    await screen.findByText("Contratos");

    await userEvent.click(screen.getByLabelText("Delete Laranite Haul"));

    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByText("Delete"));

    expect(
      await screen.findByText("Contract deleted successfully"),
    ).toBeInTheDocument();

    // Contract should be removed from the list
    expect(screen.queryByText("Laranite Haul")).not.toBeInTheDocument();
    // Other contract should still be there
    expect(screen.getByText("Titanium Express")).toBeInTheDocument();

    // Verify DELETE call was made
    const deleteCall = (fetch as Mock).mock.calls.find(
      (call: string[]) =>
        typeof call[0] === "string" &&
        call[0].includes("/contracts/con-1") &&
        call[1]?.method === "DELETE",
    );
    expect(deleteCall).toBeDefined();

    vi.useRealTimers();
  });

  it("shows error toast when delete fails", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContracts),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

    renderPage();
    await screen.findByText("Contratos");

    await userEvent.click(screen.getByLabelText("Delete Laranite Haul"));

    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByText("Delete"));

    expect(
      await screen.findByText("Failed to delete contract"),
    ).toBeInTheDocument();

    // Contract should still be in the list (not removed on error)
    expect(screen.getByText("Laranite Haul")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("does not navigate when clicking delete button", async () => {
    renderPage();
    await screen.findByText("Contratos");

    await userEvent.click(screen.getByLabelText("Delete Laranite Haul"));

    // Should still be on the list page
    expect(screen.getByText("Contratos")).toBeInTheDocument();
    expect(screen.queryByText("Edit Contract Page")).not.toBeInTheDocument();
  });
});

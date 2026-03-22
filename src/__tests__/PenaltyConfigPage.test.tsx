import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi, type Mock } from "vitest";
import PenaltyConfigPage from "@/pages/PenaltyConfigPage";
import type { PenaltyConfig } from "@/types/penalty";

vi.mock("@/lib/api-client", () => ({
  authenticatedFetch: vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  ),
}));

function makePenaltyConfig(overrides?: Partial<PenaltyConfig>): PenaltyConfig {
  return {
    id: "pc-1",
    time_base_per_scu: 5.0,
    box_size_penalties: [
      { box_size_scu: 0.125, multiplier: 1.0 },
      { box_size_scu: 1, multiplier: 1.0 },
      { box_size_scu: 2, multiplier: 1.1 },
      { box_size_scu: 4, multiplier: 1.1 },
      { box_size_scu: 8, multiplier: 1.2 },
      { box_size_scu: 16, multiplier: 1.3 },
      { box_size_scu: 24, multiplier: 1.4 },
      { box_size_scu: 32, multiplier: 1.5 },
    ],
    ship_penalties: [
      { ship_id: "ship-1", multiplier: 1.5 },
    ],
    ...overrides,
  };
}

const mockConfig = makePenaltyConfig();

const BASE = "http://localhost:8005";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/penalties"]}>
      <PenaltyConfigPage />
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

describe("PenaltyConfigPage", () => {
  it("renders loading state initially", () => {
    renderPage();
    expect(screen.getByText("Loading penalty config…")).toBeInTheDocument();
  });

  it("displays base time per SCU input with current value", async () => {
    renderPage();
    await screen.findByText("Penalty Configuration");

    const input = screen.getByLabelText("Base Time per SCU (seconds)") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("5");
  });

  it("displays box size penalties table with all 8 standard sizes", async () => {
    renderPage();
    await screen.findByText("Penalty Configuration");

    expect(screen.getByText("0.125")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
  });

  it("allows editing multiplier for a box size", async () => {
    renderPage();
    await screen.findByText("Penalty Configuration");

    const input = screen.getByLabelText("Multiplier for 8 SCU") as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, "1.8");
    expect(input.value).toBe("1.8");
  });

  it("displays ship penalties list with ship IDs and multipliers", async () => {
    renderPage();
    await screen.findByText("Penalty Configuration");

    expect(screen.getByText("ship-1")).toBeInTheDocument();
    const multiplierInput = screen.getByLabelText("Multiplier for ship ship-1") as HTMLInputElement;
    expect(multiplierInput.value).toBe("1.5");
  });

  it("add ship penalty button shows search input", async () => {
    renderPage();
    await screen.findByText("Penalty Configuration");

    await userEvent.click(screen.getByLabelText("Add ship penalty"));
    expect(screen.getByPlaceholderText("Search ships…")).toBeInTheDocument();
  });

  it("remove button removes ship penalty from list", async () => {
    renderPage();
    await screen.findByText("Penalty Configuration");

    await userEvent.click(screen.getByLabelText("Remove ship penalty ship-1"));

    expect(screen.queryByText("ship-1")).not.toBeInTheDocument();
  });

  it("save button calls PUT /penalties with form state", async () => {
    renderPage();
    await screen.findByText("Penalty Configuration");

    await userEvent.click(screen.getByRole("button", { name: /Save/ }));

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/penalties`,
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("shows success toast on save", async () => {
    renderPage();
    await screen.findByText("Penalty Configuration");

    await userEvent.click(screen.getByRole("button", { name: /Save/ }));

    expect(await screen.findByText("Configuration saved successfully")).toBeInTheDocument();
  });

  it("shows error toast on save failure", async () => {
    renderPage();
    await screen.findByText("Penalty Configuration");

    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await userEvent.click(screen.getByRole("button", { name: /Save/ }));

    expect(await screen.findByText("Failed to save configuration")).toBeInTheDocument();
  });

  it("shows error state on load failure", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Loading penalty config…")).not.toBeInTheDocument(),
    );

    expect(screen.getByText("Penalty Configuration")).toBeInTheDocument();
    expect(screen.getByText("API 500: Internal Server Error")).toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import CommodityListPage from "@/pages/CommodityListPage";
import type { Commodity } from "@/types/commodity";

const mockCommodities: Commodity[] = [
  {
    id: "comm-1",
    name: "Laranite",
    code: "LARA",
  },
  {
    id: "comm-2",
    name: "Titanium",
    code: "TITAN",
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/commodities"]}>
      <Routes>
        <Route path="/commodities" element={<CommodityListPage />} />
        <Route path="/commodities/new" element={<p>New Commodity Page</p>} />
        <Route path="/commodities/:id" element={<p>Edit Commodity Page</p>} />
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
        json: () => Promise.resolve(mockCommodities),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CommodityListPage", () => {
  // -- Loading & Fetch --
  it("shows loading state then renders the table", async () => {
    renderPage();
    expect(screen.getByText("Loading commodities…")).toBeInTheDocument();
    expect(await screen.findByText("Mercancías")).toBeInTheDocument();
  });

  it("renders commodities from API in table rows", async () => {
    renderPage();
    await screen.findByText("Mercancías");

    expect(screen.getByText("Laranite")).toBeInTheDocument();
    expect(screen.getByText("LARA")).toBeInTheDocument();
    expect(screen.getByText("Titanium")).toBeInTheDocument();
    expect(screen.getByText("TITAN")).toBeInTheDocument();
  });

  it("shows empty state when no commodities", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderPage();
    expect(
      await screen.findByText("No commodities found."),
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
      await screen.findByText("Failed to load commodities"),
    ).toBeInTheDocument();
  });

  // -- Table headers --
  it("renders table column headers", async () => {
    renderPage();
    await screen.findByText("Mercancías");

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  // -- Navigation --
  it("navigates to new commodity page on button click", async () => {
    renderPage();
    await screen.findByText("Mercancías");

    await userEvent.click(screen.getByText("Nueva mercancía"));
    expect(
      await screen.findByText("New Commodity Page"),
    ).toBeInTheDocument();
  });

  it("navigates to edit page when clicking a row", async () => {
    renderPage();
    await screen.findByText("Mercancías");

    await userEvent.click(screen.getByText("Laranite"));
    expect(
      await screen.findByText("Edit Commodity Page"),
    ).toBeInTheDocument();
  });

  // -- Delete --
  it("shows delete confirmation dialog and can cancel", async () => {
    renderPage();
    await screen.findByText("Mercancías");

    await userEvent.click(screen.getByLabelText("Delete Laranite"));

    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Are you sure you want to delete/),
    ).toBeInTheDocument();

    await userEvent.click(within(dialog).getByText("Cancel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deletes a commodity and removes it from the table", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCommodities),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: "No Content",
      });

    renderPage();
    await screen.findByText("Mercancías");

    await userEvent.click(screen.getByLabelText("Delete Laranite"));

    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    await userEvent.click(within(dialog).getByText("Delete"));

    // Laranite should be removed
    await screen.findByText("Titanium");
    expect(screen.queryByText("Laranite")).not.toBeInTheDocument();
  });

  it("shows error banner when delete fails", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCommodities),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

    renderPage();
    await screen.findByText("Mercancías");

    await userEvent.click(screen.getByLabelText("Delete Laranite"));
    const dialog = screen.getByRole("dialog", { name: "Confirm deletion" });
    await userEvent.click(within(dialog).getByText("Delete"));

    expect(
      await screen.findByText("Failed to delete commodity"),
    ).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import CommodityEditPage from "@/pages/CommodityEditPage";
import type { Commodity } from "@/types/commodity";

const mockCommodity: Commodity = {
  id: "comm-1",
  name: "Laranite",
  code: "LARA",
};

function renderEditPage(id = "comm-1") {
  return render(
    <MemoryRouter initialEntries={[`/commodities/${id}`]}>
      <Routes>
        <Route path="/commodities/:id" element={<CommodityEditPage />} />
        <Route path="/commodities" element={<p>Commodity List</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderNewPage() {
  return render(
    <MemoryRouter initialEntries={["/commodities/new"]}>
      <Routes>
        <Route path="/commodities/new" element={<CommodityEditPage />} />
        <Route path="/commodities/:id" element={<p>Edit Commodity Page</p>} />
        <Route path="/commodities" element={<p>Commodity List</p>} />
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
        json: () => Promise.resolve(mockCommodity),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CommodityEditPage - Edit mode", () => {
  it("shows loading state then renders the form", async () => {
    renderEditPage();
    expect(screen.getByText("Loading commodity…")).toBeInTheDocument();
    expect(await screen.findByText("Edit Commodity")).toBeInTheDocument();
  });

  it("shows 404 when commodity is not found", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    renderEditPage("missing");
    expect(
      await screen.findByText("Commodity Not Found"),
    ).toBeInTheDocument();
  });

  it("loads form fields from fetched commodity", async () => {
    renderEditPage();
    await screen.findByText("Edit Commodity");

    expect(screen.getByLabelText("Name")).toHaveValue("Laranite");
    expect(screen.getByLabelText("Code")).toHaveValue("LARA");
  });

  it("can edit the name field", async () => {
    renderEditPage();
    await screen.findByText("Edit Commodity");

    const nameInput = screen.getByLabelText("Name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Agricium");
    expect(nameInput).toHaveValue("Agricium");
  });

  it("can edit the code field (uppercase)", async () => {
    renderEditPage();
    await screen.findByText("Edit Commodity");

    const codeInput = screen.getByLabelText("Code");
    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, "agri");
    expect(codeInput).toHaveValue("AGRI");
  });

  it("saves commodity and shows success toast", async () => {
    renderEditPage();
    await screen.findByText("Edit Commodity");

    await userEvent.click(screen.getByText("Save"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Commodity saved successfully",
    );

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8007/commodities/comm-1",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("shows name validation error when empty", async () => {
    renderEditPage();
    await screen.findByText("Edit Commodity");

    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("shows code validation error when empty", async () => {
    renderEditPage();
    await screen.findByText("Edit Commodity");

    await userEvent.clear(screen.getByLabelText("Code"));
    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Code is required")).toBeInTheDocument();
  });

  it("navigates back to commodities list via Back button", async () => {
    renderEditPage();
    await screen.findByText("Edit Commodity");

    await userEvent.click(screen.getByText("Back"));
    expect(await screen.findByText("Commodity List")).toBeInTheDocument();
  });

  it("navigates from 404 page back to commodities", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    renderEditPage("missing");
    await screen.findByText("Commodity Not Found");

    await userEvent.click(screen.getByText("Back to Commodities"));
    expect(await screen.findByText("Commodity List")).toBeInTheDocument();
  });

  it("shows error toast when save fails", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCommodity),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

    renderEditPage();
    await screen.findByText("Edit Commodity");

    await userEvent.click(screen.getByText("Save"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Failed to save commodity",
    );
  });
});

describe("CommodityEditPage - Create mode", () => {
  it("renders New Commodity heading without loading", async () => {
    renderNewPage();
    expect(screen.getByText("New Commodity")).toBeInTheDocument();
    expect(screen.queryByText("Loading commodity…")).not.toBeInTheDocument();
  });

  it("starts with empty form values", () => {
    renderNewPage();

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Code")).toHaveValue("");
  });

  it("creates commodity and shows success toast", async () => {
    const createdCommodity: Commodity = {
      ...mockCommodity,
      id: "new-comm-1",
      name: "Agricium",
      code: "AGRI",
    };

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createdCommodity),
    });

    renderNewPage();

    await userEvent.type(screen.getByLabelText("Name"), "Agricium");
    await userEvent.type(screen.getByLabelText("Code"), "agri");
    await userEvent.click(screen.getByText("Save"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Commodity created successfully",
    );

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8007/commodities",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows validation errors when fields are empty on create", async () => {
    renderNewPage();

    await userEvent.click(screen.getByText("Save"));
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Code is required")).toBeInTheDocument();
  });

  it("clears validation error when field is filled", async () => {
    renderNewPage();

    await userEvent.click(screen.getByText("Save"));
    expect(screen.getByText("Name is required")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Name"), "Agricium");
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
  });
});

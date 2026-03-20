import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import ShipEditPage from "@/pages/ShipEditPage";
import type { Ship } from "@/types/ship";

const mockShip: Ship = {
  id: "ship-1",
  name: "Caterpillar",
  manufacturer: "Drake Interplanetary",
  cargo_holds: [{ name: "Main Hold", volume_scu: 576 }],
  total_scu: 576,
  scm_speed: 110,
  quantum_speed: 217000000,
  landing_time_seconds: 120,
  loading_time_per_scu_seconds: 1,
};

function renderEditPage(id = "ship-1") {
  return render(
    <MemoryRouter initialEntries={[`/ships/${id}`]}>
      <Routes>
        <Route path="/ships/:id" element={<ShipEditPage />} />
        <Route path="/ships" element={<p>Ship List</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderNewPage() {
  return render(
    <MemoryRouter initialEntries={["/ships/new"]}>
      <Routes>
        <Route path="/ships/new" element={<ShipEditPage />} />
        <Route path="/ships/:id" element={<p>Edit Ship Page</p>} />
        <Route path="/ships" element={<p>Ship List</p>} />
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
        json: () => Promise.resolve(mockShip),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ShipEditPage - Edit mode", () => {
  it("shows loading state then renders the form", async () => {
    renderEditPage();
    expect(screen.getByText("Loading ship…")).toBeInTheDocument();
    expect(await screen.findByText("Edit Ship")).toBeInTheDocument();
  });

  it("shows 404 when ship is not found", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    renderEditPage("missing");
    expect(await screen.findByText("Ship Not Found")).toBeInTheDocument();
  });

  it("loads form fields from fetched ship", async () => {
    renderEditPage();
    await screen.findByText("Edit Ship");

    expect(screen.getByLabelText("Name")).toHaveValue("Caterpillar");
    expect(screen.getByLabelText("Manufacturer")).toHaveValue("Drake Interplanetary");
    expect(screen.getByLabelText("SCM Speed (m/s)")).toHaveValue(110);
    expect(screen.getByLabelText("Quantum Speed (m/s)")).toHaveValue(217000000);
    expect(screen.getByLabelText("Landing Time (seconds)")).toHaveValue(120);
    expect(screen.getByLabelText("Loading Time per SCU (seconds)")).toHaveValue(1);
  });

  it("loads cargo holds from fetched ship", async () => {
    renderEditPage();
    await screen.findByText("Edit Ship");

    expect(screen.getByDisplayValue("Main Hold")).toBeInTheDocument();
    expect(screen.getByLabelText("Volume (SCU)")).toHaveValue(576);
  });

  it("can edit the name field", async () => {
    renderEditPage();
    await screen.findByText("Edit Ship");

    const nameInput = screen.getByLabelText("Name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Freelancer MAX");
    expect(nameInput).toHaveValue("Freelancer MAX");
  });

  it("saves ship and shows success toast", async () => {
    renderEditPage();
    await screen.findByText("Edit Ship");

    await userEvent.click(screen.getByText("Save"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Ship saved successfully",
    );

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8002/ships/ship-1",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("shows name validation error when empty", async () => {
    renderEditPage();
    await screen.findByText("Edit Ship");

    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("shows manufacturer validation error when empty", async () => {
    renderEditPage();
    await screen.findByText("Edit Ship");

    await userEvent.clear(screen.getByLabelText("Manufacturer"));
    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Manufacturer is required")).toBeInTheDocument();
  });

  it("navigates back to ships list via Back button", async () => {
    renderEditPage();
    await screen.findByText("Edit Ship");

    await userEvent.click(screen.getByText("Back"));
    expect(await screen.findByText("Ship List")).toBeInTheDocument();
  });

  it("navigates from 404 page back to ships", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    renderEditPage("missing");
    await screen.findByText("Ship Not Found");

    await userEvent.click(screen.getByText("Back to Ships"));
    expect(await screen.findByText("Ship List")).toBeInTheDocument();
  });

  it("shows error toast when save fails", async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockShip),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

    renderEditPage();
    await screen.findByText("Edit Ship");

    await userEvent.click(screen.getByText("Save"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Failed to save ship",
    );
  });

  it("can add a cargo hold", async () => {
    renderEditPage();
    await screen.findByText("Edit Ship");

    await userEvent.click(screen.getByText("Add Hold"));

    const holdNameInputs = screen.getAllByPlaceholderText("e.g. Main Hold");
    expect(holdNameInputs).toHaveLength(2);
  });

  it("can remove a cargo hold", async () => {
    renderEditPage();
    await screen.findByText("Edit Ship");

    // Initial hold should be there
    expect(screen.getByDisplayValue("Main Hold")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Remove hold 1"));

    expect(screen.queryByDisplayValue("Main Hold")).not.toBeInTheDocument();
    expect(screen.getByText("No cargo holds added yet.")).toBeInTheDocument();
  });
});

describe("ShipEditPage - Create mode", () => {
  it("renders New Ship heading without loading", () => {
    renderNewPage();
    expect(screen.getByText("New Ship")).toBeInTheDocument();
    expect(screen.queryByText("Loading ship…")).not.toBeInTheDocument();
  });

  it("starts with empty form values", () => {
    renderNewPage();

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Manufacturer")).toHaveValue("");
    expect(screen.getByText("No cargo holds added yet.")).toBeInTheDocument();
  });

  it("shows validation error when no cargo holds on create", async () => {
    renderNewPage();

    await userEvent.type(screen.getByLabelText("Name"), "Caterpillar");
    await userEvent.type(screen.getByLabelText("Manufacturer"), "Drake");
    await userEvent.click(screen.getByText("Save"));

    expect(
      screen.getByText("At least one cargo hold is required"),
    ).toBeInTheDocument();
  });

  it("shows validation errors when name and manufacturer are empty on create", async () => {
    renderNewPage();

    await userEvent.click(screen.getByText("Save"));
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Manufacturer is required")).toBeInTheDocument();
  });

  it("creates ship and shows success toast", async () => {
    const createdShip: Ship = { ...mockShip, id: "new-ship-1" };

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createdShip),
    });

    renderNewPage();

    await userEvent.type(screen.getByLabelText("Name"), "Caterpillar");
    await userEvent.type(screen.getByLabelText("Manufacturer"), "Drake Interplanetary");

    // Add a cargo hold
    await userEvent.click(screen.getByText("Add Hold"));
    await userEvent.type(screen.getByPlaceholderText("e.g. Main Hold"), "Main Hold");

    await userEvent.click(screen.getByText("Save"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Ship created successfully",
    );

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8002/ships",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("clears validation error when name is filled", async () => {
    renderNewPage();

    await userEvent.click(screen.getByText("Save"));
    expect(screen.getByText("Name is required")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Name"), "Caterpillar");
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
  });

  it("shows hold name validation error when hold name is empty", async () => {
    renderNewPage();

    await userEvent.type(screen.getByLabelText("Name"), "Caterpillar");
    await userEvent.type(screen.getByLabelText("Manufacturer"), "Drake");
    await userEvent.click(screen.getByText("Add Hold"));
    // Leave hold name empty and try to save
    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Hold name is required")).toBeInTheDocument();
  });

  it("shows total SCU computed from cargo holds", async () => {
    renderNewPage();

    await userEvent.click(screen.getByText("Add Hold"));
    const volumeInput = screen.getByLabelText("Volume (SCU)");
    await userEvent.clear(volumeInput);
    await userEvent.type(volumeInput, "576");

    expect(screen.getByText("(Total: 576 SCU)")).toBeInTheDocument();
  });
});

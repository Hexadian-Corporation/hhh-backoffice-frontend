import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, type Mock } from "vitest";
import SystemSelector from "@/components/location/SystemSelector";
import type { Location } from "@/types/location";

const mockSystems: Location[] = [
  {
    id: "system-1",
    name: "Stanton",
    location_type: "system",
    parent_id: null,
    coordinates: { x: 0, y: 0, z: 0 },
    has_trade_terminal: false,
    has_landing_pad: false,
    landing_pad_size: null,
  },
  {
    id: "system-2",
    name: "Pyro",
    location_type: "system",
    parent_id: null,
    coordinates: { x: 10, y: 20, z: 30 },
    has_trade_terminal: false,
    has_landing_pad: false,
    landing_pad_size: null,
  },
];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockSystems),
      }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SystemSelector", () => {
  it("renders label and select element", async () => {
    render(<SystemSelector value={null} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Star System")).toBeInTheDocument();
    expect(
      await screen.findByRole("option", { name: "Stanton" }),
    ).toBeInTheDocument();
  });

  it("loads and displays systems from the API", async () => {
    render(<SystemSelector value={null} onChange={vi.fn()} />);

    expect(
      await screen.findByRole("option", { name: "Stanton" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Pyro" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Select a star system…" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "+ Create new system…" }),
    ).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("location_type=system"),
      expect.anything(),
    );
  });

  it("selects a system and calls onChange", async () => {
    const onChange = vi.fn();
    render(<SystemSelector value={null} onChange={onChange} />);

    await screen.findByRole("option", { name: "Stanton" });

    await userEvent.selectOptions(
      screen.getByLabelText("Star System"),
      "system-1",
    );
    expect(onChange).toHaveBeenCalledWith("system-1");
  });

  it("shows selected value when value prop is set", async () => {
    render(<SystemSelector value="system-2" onChange={vi.fn()} />);

    await screen.findByRole("option", { name: "Pyro" });

    expect(screen.getByLabelText("Star System")).toHaveValue("system-2");
  });

  it("calls onChange with null when placeholder is selected", async () => {
    const onChange = vi.fn();
    render(<SystemSelector value="system-1" onChange={onChange} />);

    await screen.findByRole("option", { name: "Stanton" });

    await userEvent.selectOptions(
      screen.getByLabelText("Star System"),
      "",
    );
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("shows create form when '+ Create new system…' is selected", async () => {
    const onChange = vi.fn();
    render(<SystemSelector value={null} onChange={onChange} />);

    await screen.findByRole("option", { name: "Stanton" });

    await userEvent.selectOptions(
      screen.getByLabelText("Star System"),
      "__create__",
    );

    expect(screen.getByLabelText("System Name")).toBeInTheDocument();
    expect(screen.getByLabelText("X")).toBeInTheDocument();
    expect(screen.getByLabelText("Y")).toBeInTheDocument();
    expect(screen.getByLabelText("Z")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("creates a new system and auto-selects it", async () => {
    const onChange = vi.fn();
    const newSystem: Location = {
      id: "system-new",
      name: "Nyx",
      location_type: "system",
      parent_id: null,
      coordinates: { x: 1, y: 2, z: 3 },
      has_trade_terminal: false,
      has_landing_pad: false,
      landing_pad_size: null,
    };

    render(<SystemSelector value={null} onChange={onChange} />);

    await screen.findByRole("option", { name: "Stanton" });

    // Select create option
    await userEvent.selectOptions(
      screen.getByLabelText("Star System"),
      "__create__",
    );

    // Fill in system name
    await userEvent.type(screen.getByLabelText("System Name"), "Nyx");

    // Fill in coordinates
    const xInput = screen.getByLabelText("X");
    await userEvent.clear(xInput);
    await userEvent.type(xInput, "1");
    const yInput = screen.getByLabelText("Y");
    await userEvent.clear(yInput);
    await userEvent.type(yInput, "2");
    const zInput = screen.getByLabelText("Z");
    await userEvent.clear(zInput);
    await userEvent.type(zInput, "3");

    // Mock the create POST call
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newSystem),
    });

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    // Should auto-select the new system
    expect(onChange).toHaveBeenCalledWith("system-new");

    // New system should appear in the dropdown
    expect(
      await screen.findByRole("option", { name: "Nyx" }),
    ).toBeInTheDocument();

    // Create form should be hidden
    expect(screen.queryByLabelText("System Name")).not.toBeInTheDocument();

    // Verify POST was called with correct data
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8003/locations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Nyx",
          location_type: "system",
          parent_id: null,
          coordinates: { x: 1, y: 2, z: 3 },
          has_trade_terminal: false,
          has_landing_pad: false,
          landing_pad_size: null,
        }),
      }),
    );
  });

  it("shows validation error when creating with empty name", async () => {
    render(<SystemSelector value={null} onChange={vi.fn()} />);

    await screen.findByRole("option", { name: "Stanton" });

    await userEvent.selectOptions(
      screen.getByLabelText("Star System"),
      "__create__",
    );

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(screen.getByText("System name is required")).toBeInTheDocument();
  });

  it("shows error message when create API fails", async () => {
    render(<SystemSelector value={null} onChange={vi.fn()} />);

    await screen.findByRole("option", { name: "Stanton" });

    await userEvent.selectOptions(
      screen.getByLabelText("Star System"),
      "__create__",
    );

    await userEvent.type(screen.getByLabelText("System Name"), "Bad System");

    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("Failed to create system"),
    ).toBeInTheDocument();
  });

  it("shows error when loading systems fails", async () => {
    (fetch as Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<SystemSelector value={null} onChange={vi.fn()} />);

    expect(
      await screen.findByText("Failed to load star systems"),
    ).toBeInTheDocument();
  });

  it("hides create form when selecting an existing system after showing it", async () => {
    const onChange = vi.fn();
    render(<SystemSelector value={null} onChange={onChange} />);

    await screen.findByRole("option", { name: "Stanton" });

    // Show create form
    await userEvent.selectOptions(
      screen.getByLabelText("Star System"),
      "__create__",
    );
    expect(screen.getByLabelText("System Name")).toBeInTheDocument();

    // Select existing system
    await userEvent.selectOptions(
      screen.getByLabelText("Star System"),
      "system-1",
    );
    expect(screen.queryByLabelText("System Name")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith("system-1");
  });
});

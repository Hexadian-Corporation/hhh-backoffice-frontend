import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";
import LocationTreeView from "@/components/location/LocationTreeView";
import type { LocationTreeNode } from "@/lib/location-tree";

vi.mock("@hexadian-corporation/auth-react", () => ({
  useAuth: () => ({
    user: { username: "admin", permissions: [] },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    tryRefresh: vi.fn(),
    authFetch: vi.fn(),
    hasPermission: () => true,
    hasAnyPermission: () => true,
    handleCallback: vi.fn(),
  }),
}));

const sampleTree: LocationTreeNode[] = [
  {
    location: {
      id: "sys-1",
      name: "Stanton",
      location_type: "system",
      parent_id: null,
      coordinates: { x: 0, y: 0, z: 0 },
      has_trade_terminal: false,
      has_landing_pad: false,
      landing_pad_size: null,
    },
    children: [
      {
        location: {
          id: "p-1",
          name: "Crusader",
          location_type: "planet",
          parent_id: "sys-1",
          coordinates: { x: 10, y: 20, z: 30 },
          has_trade_terminal: false,
          has_landing_pad: false,
          landing_pad_size: null,
        },
        children: [
          {
            location: {
              id: "s-1",
              name: "Port Olisar",
              location_type: "station",
              parent_id: "p-1",
              coordinates: { x: 100, y: 200, z: 300 },
              has_trade_terminal: true,
              has_landing_pad: true,
              landing_pad_size: "large",
            },
            children: [],
          },
        ],
      },
    ],
  },
];

function renderTree(props?: { canWrite?: boolean; onDelete?: () => void; tree?: LocationTreeNode[] }) {
  return render(
    <MemoryRouter initialEntries={["/locations"]}>
      <Routes>
        <Route
          path="/locations"
          element={
            <LocationTreeView
              tree={props?.tree ?? sampleTree}
              canWrite={props?.canWrite ?? true}
              onDelete={props?.onDelete ?? vi.fn()}
            />
          }
        />
        <Route path="/locations/:id" element={<p>Edit Location Page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LocationTreeView", () => {
  it("shows empty state when tree is empty", () => {
    renderTree({ tree: [] });
    expect(screen.getByText("No locations found.")).toBeInTheDocument();
  });

  it("renders root nodes", () => {
    renderTree();
    expect(screen.getByText("Stanton")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("shows first-level children expanded by default", () => {
    renderTree();
    expect(screen.getByText("Crusader")).toBeInTheDocument();
  });

  it("hides deeper children by default (nodes at depth >= 1 collapsed)", () => {
    renderTree();
    // Port Olisar is at depth 2 — hidden because Crusader (depth 1) is not expanded
    expect(screen.queryByText("Port Olisar")).not.toBeInTheDocument();
  });

  it("expands a collapsed node on click", async () => {
    renderTree();
    expect(screen.queryByText("Port Olisar")).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Expand Crusader"));
    expect(screen.getByText("Port Olisar")).toBeInTheDocument();
  });

  it("collapses an expanded node on click", async () => {
    renderTree();
    expect(screen.getByText("Crusader")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Collapse Stanton"));
    expect(screen.queryByText("Crusader")).not.toBeInTheDocument();
  });

  it("shows trade terminal and landing pad indicators", async () => {
    renderTree();
    await userEvent.click(screen.getByLabelText("Expand Crusader"));

    expect(screen.getByText("Terminal")).toBeInTheDocument();
    expect(screen.getByText("Pad (large)")).toBeInTheDocument();
  });

  it("navigates to edit page when clicking a node", async () => {
    renderTree();
    await userEvent.click(screen.getByText("Stanton"));
    expect(await screen.findByText("Edit Location Page")).toBeInTheDocument();
  });

  it("shows delete button when canWrite is true", () => {
    renderTree({ canWrite: true });
    expect(screen.getByLabelText("Delete Stanton")).toBeInTheDocument();
  });

  it("hides delete button when canWrite is false", () => {
    renderTree({ canWrite: false });
    expect(screen.queryByLabelText("Delete Stanton")).not.toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    renderTree({ onDelete });

    await userEvent.click(screen.getByLabelText("Delete Stanton"));
    expect(onDelete).toHaveBeenCalledWith(sampleTree[0].location);
  });

  it("shows type badge for location type", () => {
    renderTree();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("Planet")).toBeInTheDocument();
  });
});

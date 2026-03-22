import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import type { Ship } from "@/types/ship";

const mockHasPermission = vi.fn<(p: string) => boolean>(() => false);
const mockHasAnyPermission = vi.fn<(ps: string[]) => boolean>(() => false);

vi.mock("@hexadian-corporation/auth-react", () => ({
  useAuth: () => ({
    user: { username: "admin", permissions: [] },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    tryRefresh: vi.fn(),
    authFetch: vi.fn(),
    hasPermission: (...args: unknown[]) => mockHasPermission(...(args as [string])),
    hasAnyPermission: (...args: unknown[]) => mockHasAnyPermission(...(args as [string[]])),
    handleCallback: vi.fn(),
  }),
}));

import ShipListPage from "@/pages/ShipListPage";

const makeShip = (overrides: Partial<Ship> = {}): Ship => ({
  id: "ship-1",
  name: "Caterpillar",
  manufacturer: "Drake Interplanetary",
  cargo_holds: [{ name: "Main Hold", volume_scu: 576 }],
  total_scu: 576,
  scm_speed: 110,
  quantum_speed: 217000000,
  landing_time_seconds: 120,
  loading_time_per_scu_seconds: 1,
  ...overrides,
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/ships"]}>
      <Routes>
        <Route path="/ships" element={<ShipListPage />} />
        <Route path="/ships/new" element={<p>New Ship Page</p>} />
        <Route path="/ships/:id" element={<p>Edit Ship Page</p>} />
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
        json: () => Promise.resolve([makeShip(), makeShip({ id: "ship-2", name: "Hull C", manufacturer: "MISC" })]),
      }),
    ) as Mock,
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ShipListPage permission filtering", () => {
  it("hides 'Nueva nave' button and delete buttons when user lacks ships:write", async () => {
    const perms = ["hhh:ships:read"];
    mockHasPermission.mockImplementation((p) => perms.includes(p));
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

    renderPage();
    await screen.findByText("Naves");

    expect(screen.queryByText("Nueva nave")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete Caterpillar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete Hull C")).not.toBeInTheDocument();
  });

  it("shows 'Nueva nave' button and delete buttons when user has ships:write", async () => {
    const perms = ["hhh:ships:read", "hhh:ships:write"];
    mockHasPermission.mockImplementation((p) => perms.includes(p));
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

    renderPage();
    await screen.findByText("Naves");

    expect(screen.getByText("Nueva nave")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete Caterpillar")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete Hull C")).toBeInTheDocument();
  });
});

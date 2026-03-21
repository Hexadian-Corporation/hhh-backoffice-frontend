import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import type { User } from "@/types/user";

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

import UsersPage from "@/pages/UsersPage";

const mockUsers: User[] = [
  {
    _id: "user-1",
    username: "testpilot",
    email: "test@example.com",
    roles: ["user"],
    is_active: true,
    rsi_handle: "TestPilot",
    rsi_verified: true,
  },
  {
    _id: "user-2",
    username: "newuser",
    email: "new@example.com",
    roles: ["user"],
    is_active: true,
    rsi_handle: null,
    rsi_verified: false,
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/users"]}>
      <Routes>
        <Route path="/users" element={<UsersPage />} />
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
        json: () => Promise.resolve(mockUsers),
      }),
    ) as Mock,
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("UsersPage permission filtering", () => {
  it("hides verify buttons when user lacks users:admin", async () => {
    const perms = ["auth:users:read"];
    mockHasPermission.mockImplementation((p) => perms.includes(p));
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

    renderPage();
    await screen.findByText("testpilot");

    expect(screen.queryByText("Verify")).not.toBeInTheDocument();
    expect(screen.queryByText("Re-verify")).not.toBeInTheDocument();
  });

  it("shows verify buttons when user has users:admin", async () => {
    const perms = ["auth:users:read", "auth:users:admin"];
    mockHasPermission.mockImplementation((p) => perms.includes(p));
    mockHasAnyPermission.mockImplementation((ps) => ps.some((p) => perms.includes(p)));

    renderPage();
    await screen.findByText("testpilot");

    expect(screen.getByText("Re-verify")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
  });
});

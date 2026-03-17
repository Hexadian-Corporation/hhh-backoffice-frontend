import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import type { User } from "@/types/user";

const mockUsePermissions = vi.fn<() => string[]>(() => []);
const mockHasPermission = vi.fn(
  (perms: string[], req: string) => perms.includes(req),
);

vi.mock("@/lib/permissions", () => ({
  usePermissions: (...args: unknown[]) => mockUsePermissions(...(args as [])),
  hasPermission: (...args: unknown[]) => mockHasPermission(...(args as [string[], string])),
  hasAnyPermission: () => true,
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
    mockUsePermissions.mockReturnValue(["users:read"]);

    renderPage();
    await screen.findByText("testpilot");

    expect(screen.queryByText("Verify")).not.toBeInTheDocument();
    expect(screen.queryByText("Re-verify")).not.toBeInTheDocument();
  });

  it("shows verify buttons when user has users:admin", async () => {
    mockUsePermissions.mockReturnValue(["users:read", "users:admin"]);

    renderPage();
    await screen.findByText("testpilot");

    expect(screen.getByText("Re-verify")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
  });
});

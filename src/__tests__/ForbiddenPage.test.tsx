import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ForbiddenPage from "@/pages/ForbiddenPage";

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

describe("ForbiddenPage", () => {
  it("renders the 403 heading", () => {
    render(<ForbiddenPage />);

    expect(screen.getByText("403")).toBeInTheDocument();
  });

  it("renders the permission denied message", () => {
    render(<ForbiddenPage />);

    expect(
      screen.getByText(/You don't have permission to access this application/),
    ).toBeInTheDocument();
  });

  it("renders a log out button", () => {
    render(<ForbiddenPage />);

    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });
});

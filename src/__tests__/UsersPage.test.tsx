import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, type Mock } from "vitest";
import UsersPage from "@/pages/UsersPage";
import type { User } from "@/types/user";

vi.mock("@/lib/permissions", () => ({
  usePermissions: () => [
    "hhh:contracts:read", "hhh:contracts:write",
    "hhh:locations:read", "hhh:locations:write",
    "hhh:commodities:read", "hhh:commodities:write",
    "auth:users:read", "auth:users:admin",
  ],
  hasPermission: () => true,
  hasAnyPermission: () => true,
}));

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
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UsersPage", () => {
  // -- Loading & Fetch --
  it("shows loading skeleton then renders the table", async () => {
    renderPage();
    expect(screen.getAllByTestId("skeleton-row")).toHaveLength(3);
    expect(await screen.findByText("Users")).toBeInTheDocument();
  });

  it("renders users from API in table rows", async () => {
    renderPage();
    await screen.findByText("Users");

    expect(screen.getByText("testpilot")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("TestPilot")).toBeInTheDocument();
    expect(screen.getByText("newuser")).toBeInTheDocument();
    expect(screen.getByText("new@example.com")).toBeInTheDocument();
  });

  it("shows empty state when no users", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderPage();
    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderPage();
    expect(
      await screen.findByText("Failed to load users"),
    ).toBeInTheDocument();
  });

  it("shows retry button on error and retries", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderPage();
    const retryBtn = await screen.findByText("Retry");

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    });

    await userEvent.click(retryBtn);
    expect(await screen.findByText("testpilot")).toBeInTheDocument();
  });

  // -- Table headers --
  it("renders table column headers", async () => {
    renderPage();
    await screen.findByText("Users");

    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("RSI Handle")).toBeInTheDocument();
    // "Verified" appears both as header and badge; check the header specifically
    const headers = screen.getAllByRole("columnheader");
    const headerTexts = headers.map((h) => h.textContent);
    expect(headerTexts).toContain("Verified");
    expect(headerTexts).toContain("Actions");
  });

  // -- Verification status --
  it("shows Verified badge for verified users", async () => {
    renderPage();
    await screen.findByText("Users");

    // The verified user should have a "Verified" badge in a table cell
    const verifiedCells = screen.getAllByText("Verified");
    // One is the header, one is the badge
    expect(verifiedCells.length).toBeGreaterThanOrEqual(2);
  });

  it("shows Unverified badge for unverified users", async () => {
    renderPage();
    await screen.findByText("Users");

    expect(screen.getByText("Unverified")).toBeInTheDocument();
  });

  it("shows Re-verify button for verified users", async () => {
    renderPage();
    await screen.findByText("Users");

    expect(screen.getByText("Re-verify")).toBeInTheDocument();
  });

  it("shows Verify button for unverified users", async () => {
    renderPage();
    await screen.findByText("Users");

    const verifyButtons = screen.getAllByRole("button", { name: /verify/i });
    // One for "Re-verify" (verified user) and one for "Verify" (unverified)
    expect(verifyButtons).toHaveLength(2);
  });

  // -- dash for null handle --
  it("shows dash for users without RSI handle", async () => {
    renderPage();
    await screen.findByText("Users");

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  // -- Verification modal --
  it("opens verification modal when Verify button is clicked", async () => {
    renderPage();
    await screen.findByText("Users");

    // Click the "Verify" button for the unverified user
    const verifyBtn = screen.getByRole("button", { name: /^Verify$/i });
    await userEvent.click(verifyBtn);

    expect(
      screen.getByRole("dialog", { name: /RSI Verification/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("RSI Verification — newuser"),
    ).toBeInTheDocument();
  });

  it("opens verification modal with pre-filled handle for Re-verify", async () => {
    renderPage();
    await screen.findByText("Users");

    const reVerifyBtn = screen.getByRole("button", { name: /Re-verify/i });
    await userEvent.click(reVerifyBtn);

    const input = screen.getByLabelText("RSI Handle");
    expect(input).toHaveValue("TestPilot");
  });

  it("closes verification modal on Cancel", async () => {
    renderPage();
    await screen.findByText("Users");

    const verifyBtn = screen.getByRole("button", { name: /^Verify$/i });
    await userEvent.click(verifyBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

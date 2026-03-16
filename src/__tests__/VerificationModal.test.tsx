import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, type Mock } from "vitest";
import VerificationModal from "@/components/VerificationModal";
import type { User } from "@/types/user";

const baseUser: User = {
  _id: "user-1",
  username: "testpilot",
  email: "test@example.com",
  roles: ["user"],
  is_active: true,
  rsi_handle: "TestPilot",
  rsi_verified: false,
};

const userWithoutHandle: User = {
  ...baseUser,
  _id: "user-2",
  username: "newuser",
  rsi_handle: null,
};

function renderModal(props: Partial<{
  open: boolean;
  user: User;
  onClose: () => void;
  onVerified: () => void;
}> = {}) {
  const defaultProps = {
    open: true,
    user: baseUser,
    onClose: vi.fn(),
    onVerified: vi.fn(),
    ...props,
  };
  return { ...render(<VerificationModal {...defaultProps} />), ...defaultProps };
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () =>
          Promise.resolve({
            verification_code: "abc123",
            verified: false,
            message: "Code generated",
          }),
      }),
    ),
  );

  // Mock clipboard
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn(() => Promise.resolve()) },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("VerificationModal", () => {
  // -- Rendering --
  it("renders nothing when open is false", () => {
    const { container } = render(
      <VerificationModal
        open={false}
        user={baseUser}
        onClose={vi.fn()}
        onVerified={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog with title when open", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: /RSI Verification/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("RSI Verification — testpilot"),
    ).toBeInTheDocument();
  });

  it("pre-fills RSI handle from user", () => {
    renderModal();
    const input = screen.getByLabelText("RSI Handle");
    expect(input).toHaveValue("TestPilot");
  });

  it("shows empty input when user has no RSI handle", () => {
    renderModal({ user: userWithoutHandle });
    const input = screen.getByLabelText("RSI Handle");
    expect(input).toHaveValue("");
  });

  // -- Validation --
  it("disables Generate Code button when handle is empty", () => {
    renderModal({ user: userWithoutHandle });
    expect(screen.getByText("Generate Code")).toBeDisabled();
  });

  it("shows validation error for invalid handle format", async () => {
    renderModal({ user: userWithoutHandle });
    const input = screen.getByLabelText("RSI Handle");
    await userEvent.type(input, "ab");

    expect(
      screen.getByText(/Handle must be 3-30 characters/),
    ).toBeInTheDocument();
    expect(screen.getByText("Generate Code")).toBeDisabled();
  });

  it("enables Generate Code button with valid handle", async () => {
    renderModal({ user: userWithoutHandle });
    const input = screen.getByLabelText("RSI Handle");
    await userEvent.type(input, "ValidHandle");

    expect(screen.getByText("Generate Code")).toBeEnabled();
  });

  // -- Step 1 → Step 2 --
  it("transitions to code display step after successful startVerification", async () => {
    renderModal();
    await userEvent.click(screen.getByText("Generate Code"));

    expect(
      await screen.findByTestId("verification-string"),
    ).toHaveTextContent("Hexadian account validation code: abc123");
  });

  it("shows error when startVerification fails", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    renderModal();
    await userEvent.click(screen.getByText("Generate Code"));

    expect(
      await screen.findByText("Failed to start verification"),
    ).toBeInTheDocument();
  });

  it("shows error when startVerification returns no code", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          verification_code: null,
          verified: false,
          message: "User not found",
        }),
    });

    renderModal();
    await userEvent.click(screen.getByText("Generate Code"));

    expect(await screen.findByText("User not found")).toBeInTheDocument();
  });

  // -- Copy --
  it("copies verification string to clipboard", async () => {
    renderModal();
    await userEvent.click(screen.getByText("Generate Code"));

    await screen.findByTestId("verification-string");
    await userEvent.click(
      screen.getByRole("button", { name: /Copy verification string/i }),
    );

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Hexadian account validation code: abc123",
    );
  });

  // -- Step 2 → Step 3 (Success) --
  it("shows success message after confirm", async () => {
    renderModal();
    await userEvent.click(screen.getByText("Generate Code"));
    await screen.findByTestId("verification-string");

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          verification_code: null,
          verified: true,
          message: "RSI handle verified!",
        }),
    });

    await userEvent.click(screen.getByText("Verify"));

    expect(
      await screen.findByText("RSI handle verified!"),
    ).toBeInTheDocument();
  });

  it("calls onVerified callback after successful confirm", async () => {
    const { onVerified } = renderModal();
    await userEvent.click(screen.getByText("Generate Code"));
    await screen.findByTestId("verification-string");

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          verification_code: null,
          verified: true,
          message: "RSI handle verified!",
        }),
    });

    await userEvent.click(screen.getByText("Verify"));
    await screen.findByText("RSI handle verified!");

    expect(onVerified).toHaveBeenCalled();
  });

  // -- Step 2 → Step 3 (Failure) --
  it("shows failure message when verification not confirmed", async () => {
    renderModal();
    await userEvent.click(screen.getByText("Generate Code"));
    await screen.findByTestId("verification-string");

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          verification_code: null,
          verified: false,
          message: "Code not found in bio",
        }),
    });

    await userEvent.click(screen.getByText("Verify"));

    expect(
      await screen.findByText("Code not found in bio"),
    ).toBeInTheDocument();
  });

  it("shows error when confirmVerification API call fails", async () => {
    renderModal();
    await userEvent.click(screen.getByText("Generate Code"));
    await screen.findByTestId("verification-string");

    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await userEvent.click(screen.getByText("Verify"));

    expect(
      await screen.findByText("Failed to confirm verification"),
    ).toBeInTheDocument();
  });

  // -- Close / Cancel --
  it("calls onClose when Cancel is clicked", async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const { onClose } = renderModal();
    const dialog = screen.getByRole("dialog");
    // Click the backdrop (the dialog wrapper)
    await userEvent.click(dialog);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows Close button on confirm step", async () => {
    renderModal();
    await userEvent.click(screen.getByText("Generate Code"));
    await screen.findByTestId("verification-string");

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          verification_code: null,
          verified: true,
          message: "Verified!",
        }),
    });

    await userEvent.click(screen.getByText("Verify"));
    await screen.findByText("Verified!");

    expect(screen.getByText("Close")).toBeInTheDocument();
  });
});

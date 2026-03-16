import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

describe("ConfirmationDialog", () => {
  const defaultProps = {
    open: true,
    title: "Confirm Action",
    message: "Are you sure?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when open is false", () => {
    render(<ConfirmationDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog when open is true", () => {
    render(<ConfirmationDialog {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("shows default confirm label", () => {
    render(<ConfirmationDialog {...defaultProps} />);
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("shows custom confirm label", () => {
    render(
      <ConfirmationDialog {...defaultProps} confirmLabel="Activate" />,
    );
    expect(screen.getByText("Activate")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    render(<ConfirmationDialog {...defaultProps} confirmLabel="Yes" />);
    await userEvent.click(screen.getByText("Yes"));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", async () => {
    render(<ConfirmationDialog {...defaultProps} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when clicking the backdrop overlay", async () => {
    render(<ConfirmationDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole("dialog"));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel when clicking inside the dialog content", async () => {
    render(<ConfirmationDialog {...defaultProps} />);
    await userEvent.click(screen.getByText("Confirm Action"));
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it("applies glow shadow to dialog panel", () => {
    render(<ConfirmationDialog {...defaultProps} />);
    const panel = screen.getByText("Confirm Action").closest("div");
    expect(panel?.className).toContain("shadow-[0_0_24px_var(--color-glow)]");
  });
});

import { render, screen, act } from "@testing-library/react";
import { vi } from "vitest";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockCallbackHandler = vi.fn();
vi.mock("@hexadian-corporation/auth-react", () => ({
  CallbackHandler: (props: Record<string, unknown>) => {
    mockCallbackHandler(props);
    return <p>Authenticating…</p>;
  },
}));

import CallbackPage from "@/pages/CallbackPage";

afterEach(() => {
  vi.clearAllMocks();
});

describe("CallbackPage", () => {
  it("renders the loading indicator", () => {
    render(<CallbackPage />);
    expect(screen.getByText("Authenticating…")).toBeInTheDocument();
  });

  it("passes onSuccess that navigates to the return URL", () => {
    render(<CallbackPage />);
    const { onSuccess } = mockCallbackHandler.mock.calls[0][0];
    act(() => onSuccess("/contracts"));
    expect(mockNavigate).toHaveBeenCalledWith("/contracts", { replace: true });
  });

  it("passes onError that navigates to /", () => {
    render(<CallbackPage />);
    const { onError } = mockCallbackHandler.mock.calls[0][0];
    act(() => onError(new Error("Auth failed")));
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("navigates to / as default return URL on success", () => {
    render(<CallbackPage />);
    const { onSuccess } = mockCallbackHandler.mock.calls[0][0];
    act(() => onSuccess("/"));
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});

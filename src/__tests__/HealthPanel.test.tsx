import { render, screen, waitFor, act } from "@testing-library/react";
import { vi, type Mock } from "vitest";
import HealthPanel from "@/components/dashboard/HealthPanel";
import type { ServiceConfig, ServiceHealth } from "@/api/health";

vi.mock("@/api/health", async () => {
  const actual = await vi.importActual("@/api/health");
  return {
    ...actual,
    checkAllServices: vi.fn(),
  };
});

import { checkAllServices } from "@/api/health";

const testServices: ServiceConfig[] = [
  { name: "Contracts", url: "http://localhost:8001" },
  { name: "Ships", url: "http://localhost:8002" },
];

const healthyResults: ServiceHealth[] = [
  { name: "Contracts", url: "http://localhost:8001", status: "healthy", latencyMs: 15, errorMessage: null },
  { name: "Ships", url: "http://localhost:8002", status: "healthy", latencyMs: 22, errorMessage: null },
];

const downResults: ServiceHealth[] = [
  { name: "Contracts", url: "http://localhost:8001", status: "down", latencyMs: null, errorMessage: "Connection refused" },
  { name: "Ships", url: "http://localhost:8002", status: "down", latencyMs: null, errorMessage: "Timeout (5s)" },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HealthPanel", () => {
  it("renders service names and ports", () => {
    (checkAllServices as Mock).mockReturnValue(new Promise(() => {}));

    render(<HealthPanel services={testServices} />);

    expect(screen.getByText("System Health")).toBeInTheDocument();
    expect(screen.getByText("Contracts")).toBeInTheDocument();
    expect(screen.getByText("Ships")).toBeInTheDocument();
    expect(screen.getByText(":8001")).toBeInTheDocument();
    expect(screen.getByText(":8002")).toBeInTheDocument();
  });

  it("shows initial checking state then healthy", async () => {
    (checkAllServices as Mock).mockResolvedValue(healthyResults);

    render(<HealthPanel services={testServices} />);

    // Initially "Checking…" shown
    expect(screen.getAllByText("Checking…")).toHaveLength(2);

    // After fetch resolves, should show "Healthy"
    await waitFor(() => {
      expect(screen.getAllByText("Healthy")).toHaveLength(2);
    });
  });

  it("shows unreachable when services are down", async () => {
    (checkAllServices as Mock).mockResolvedValue(downResults);

    render(<HealthPanel services={testServices} />);

    await waitFor(() => {
      expect(screen.getAllByText("Unreachable")).toHaveLength(2);
    });
  });

  it("shows error reason for down services", async () => {
    (checkAllServices as Mock).mockResolvedValue(downResults);

    render(<HealthPanel services={testServices} />);

    await waitFor(() => {
      expect(screen.getByText("Connection refused")).toBeInTheDocument();
      expect(screen.getByText("Timeout (5s)")).toBeInTheDocument();
    });
  });

  it("does not show error message for healthy services", async () => {
    (checkAllServices as Mock).mockResolvedValue(healthyResults);

    render(<HealthPanel services={testServices} />);

    await waitFor(() => {
      expect(screen.getAllByText("Healthy")).toHaveLength(2);
    });

    expect(screen.queryByText("Connection refused")).not.toBeInTheDocument();
    expect(screen.queryByText("Timeout (5s)")).not.toBeInTheDocument();
    expect(screen.queryByText("Network error")).not.toBeInTheDocument();
    expect(screen.queryByText("CORS error")).not.toBeInTheDocument();
  });

  it("shows latency for healthy services", async () => {
    (checkAllServices as Mock).mockResolvedValue(healthyResults);

    render(<HealthPanel services={testServices} />);

    await waitFor(() => {
      expect(screen.getByText("15ms")).toBeInTheDocument();
      expect(screen.getByText("22ms")).toBeInTheDocument();
    });
  });

  it("auto-refreshes every 30 seconds", async () => {
    vi.useFakeTimers();
    (checkAllServices as Mock).mockResolvedValue(healthyResults);

    render(<HealthPanel services={testServices} />);

    // Initial call
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(checkAllServices).toHaveBeenCalledTimes(1);

    // Advance timer by 30s to trigger refresh
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(checkAllServices).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

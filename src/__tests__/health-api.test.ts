import { vi, type Mock } from "vitest";
import { checkServiceHealth, checkAllServices } from "@/api/health";
import type { ServiceConfig } from "@/api/health";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve({ status: "ok" }),
      }),
    ),
  );
  vi.spyOn(performance, "now")
    .mockReturnValueOnce(0)
    .mockReturnValueOnce(42);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const testService: ServiceConfig = { name: "TestSvc", url: "http://localhost:9999" };

describe("checkServiceHealth", () => {
  it("returns healthy when fetch succeeds with ok response", async () => {
    const result = await checkServiceHealth(testService);

    expect(fetch).toHaveBeenCalledWith("http://localhost:9999/health", {
      signal: expect.any(AbortSignal),
    });
    expect(result).toEqual({
      name: "TestSvc",
      url: "http://localhost:9999",
      status: "healthy",
      latencyMs: 42,
      errorMessage: null,
    });
  });

  it("returns down with HTTP status when fetch succeeds with non-ok response", async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const result = await checkServiceHealth(testService);

    expect(result.status).toBe("down");
    expect(result.latencyMs).toBe(42);
    expect(result.errorMessage).toBe("HTTP 503");
  });

  it("returns 'Connection refused' when fetch throws TypeError", async () => {
    (fetch as Mock).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await checkServiceHealth(testService);

    expect(result).toEqual({
      name: "TestSvc",
      url: "http://localhost:9999",
      status: "down",
      latencyMs: null,
      errorMessage: "Connection refused",
    });
  });

  it("returns 'Timeout (5s)' when fetch throws TimeoutError", async () => {
    const timeoutError = new DOMException("The operation was aborted", "TimeoutError");
    (fetch as Mock).mockRejectedValueOnce(timeoutError);

    const result = await checkServiceHealth(testService);

    expect(result).toEqual({
      name: "TestSvc",
      url: "http://localhost:9999",
      status: "down",
      latencyMs: null,
      errorMessage: "Timeout (5s)",
    });
  });

  it("returns 'CORS error' when fetch throws TypeError with CORS message", async () => {
    (fetch as Mock).mockRejectedValueOnce(
      new TypeError("Failed to fetch: CORS request did not succeed"),
    );

    const result = await checkServiceHealth(testService);

    expect(result).toEqual({
      name: "TestSvc",
      url: "http://localhost:9999",
      status: "down",
      latencyMs: null,
      errorMessage: "CORS error",
    });
  });

  it("returns 'Network error' for non-TypeError exceptions", async () => {
    (fetch as Mock).mockRejectedValueOnce(new Error("Something unexpected"));

    const result = await checkServiceHealth(testService);

    expect(result).toEqual({
      name: "TestSvc",
      url: "http://localhost:9999",
      status: "down",
      latencyMs: null,
      errorMessage: "Network error",
    });
  });
});

describe("checkAllServices", () => {
  it("checks all provided services in parallel", async () => {
    vi.spyOn(performance, "now").mockRestore();
    vi.spyOn(performance, "now").mockReturnValue(10);

    const services: ServiceConfig[] = [
      { name: "A", url: "http://localhost:1111" },
      { name: "B", url: "http://localhost:2222" },
    ];

    const results = await checkAllServices(services);

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("A");
    expect(results[1].name).toBe("B");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

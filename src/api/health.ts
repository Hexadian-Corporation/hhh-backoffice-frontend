export interface ServiceHealth {
  name: string;
  url: string;
  status: "healthy" | "down" | "checking";
  latencyMs: number | null;
  errorMessage: string | null;
}

export interface ServiceConfig {
  name: string;
  url: string;
}

export const DEFAULT_SERVICES: ServiceConfig[] = [
  { name: "Contracts", url: import.meta.env.VITE_CONTRACTS_API_URL ?? "http://localhost:8001" },
  { name: "Ships", url: import.meta.env.VITE_SHIPS_API_URL ?? "http://localhost:8002" },
  { name: "Maps", url: import.meta.env.VITE_MAPS_API_URL ?? "http://localhost:8003" },
  { name: "Graphs", url: import.meta.env.VITE_GRAPHS_API_URL ?? "http://localhost:8004" },
  { name: "Routes", url: import.meta.env.VITE_ROUTES_API_URL ?? "http://localhost:8005" },
  { name: "Auth", url: import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8006" },
  { name: "Commodities", url: import.meta.env.VITE_COMMODITIES_API_URL ?? "http://localhost:8007" },
];

export async function checkServiceHealth(service: ServiceConfig): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    const res = await fetch(`${service.url}/health`, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: service.name,
      url: service.url,
      status: res.ok ? "healthy" : "down",
      latencyMs,
      errorMessage: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err: unknown) {
    let errorMessage = "Network error";
    if (err instanceof DOMException && err.name === "TimeoutError") {
      errorMessage = "Timeout (5s)";
    } else if (err instanceof TypeError) {
      errorMessage = err.message.includes("CORS") ? "CORS error" : "Connection refused";
    }
    return {
      name: service.name,
      url: service.url,
      status: "down",
      latencyMs: null,
      errorMessage,
    };
  }
}

export async function checkAllServices(services: ServiceConfig[] = DEFAULT_SERVICES): Promise<ServiceHealth[]> {
  return Promise.all(services.map(checkServiceHealth));
}

import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { checkAllServices, DEFAULT_SERVICES } from "@/api/health";
import type { ServiceConfig, ServiceHealth } from "@/api/health";

const REFRESH_INTERVAL_MS = 30_000;

interface HealthPanelProps {
  services?: ServiceConfig[];
}

function statusColor(status: ServiceHealth["status"]): string {
  switch (status) {
    case "healthy":
      return "bg-[var(--color-success)]";
    case "down":
      return "bg-[var(--color-danger)]";
    case "checking":
      return "bg-[var(--color-text-muted)]";
  }
}

function statusLabel(status: ServiceHealth["status"]): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "down":
      return "Unreachable";
    case "checking":
      return "Checking…";
  }
}

function portFromUrl(url: string): string {
  try {
    return new URL(url).port;
  } catch {
    return "";
  }
}

export default function HealthPanel({ services = DEFAULT_SERVICES }: HealthPanelProps) {
  const [results, setResults] = useState<ServiceHealth[]>(() =>
    services.map((s) => ({ name: s.name, url: s.url, status: "checking" as const, latencyMs: null })),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const data = await checkAllServices(services);
      if (!cancelled) setResults(data);
    }

    void refresh();
    intervalRef.current = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [services]);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-[var(--color-accent)]" />
        <h2 className="text-lg font-semibold">System Health</h2>
      </div>

      <div className="space-y-2">
        {results.map((svc) => (
          <div
            key={svc.name}
            className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor(svc.status)}`} />
              <span className="text-sm font-medium">{svc.name}</span>
              <span className="text-xs text-[var(--color-text-muted)]">:{portFromUrl(svc.url)}</span>
            </div>
            <div className="flex items-center gap-4">
              {svc.latencyMs !== null && (
                <span className="text-xs text-[var(--color-text-muted)]">{svc.latencyMs}ms</span>
              )}
              <span
                className={`text-xs font-medium ${
                  svc.status === "healthy"
                    ? "text-[var(--color-success)]"
                    : svc.status === "down"
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--color-text-muted)]"
                }`}
              >
                {statusLabel(svc.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

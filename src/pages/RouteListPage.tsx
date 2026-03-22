import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "@/types/route";
import { listRoutes } from "@/api/routes";
import { formatDistance } from "@/lib/format";
import StaleBadge from "@/components/ui/StaleBadge";

function formatTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export default function RouteListPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staleOnly, setStaleOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listRoutes()
      .then((data) => {
        if (!cancelled) setRoutes(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load routes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading routes…</p>
      </div>
    );
  }

  if (error && routes.length === 0) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-danger)]">{error}</p>
      </div>
    );
  }

  const displayed = staleOnly ? routes.filter((r) => r.stale) : routes;

  return (
    <div className="p-6">
      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-md bg-[var(--color-danger)]/10 px-4 py-2 text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/20">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Routes</h1>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={staleOnly}
            onChange={(e) => setStaleOnly(e.target.checked)}
            className="accent-[var(--color-warning)]"
            aria-label="Show stale only"
          />
          Show stale only
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">ID</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Stops</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Legs</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Distance</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Time</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Contracts</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No routes found.
                </td>
              </tr>
            ) : (
              displayed.map((route) => (
                <tr
                  key={route.id}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] cursor-pointer"
                  onClick={() => navigate(`/routes/${route.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-[var(--color-text-muted)]">{route.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{route.stops.length}</td>
                  <td className="px-4 py-3">{route.legs.length}</td>
                  <td className="px-4 py-3">{formatDistance(route.total_distance)}</td>
                  <td className="px-4 py-3">{formatTime(route.total_time_seconds)}</td>
                  <td className="px-4 py-3">{route.contracts_fulfilled}</td>
                  <td className="px-4 py-3">
                    {route.stale && (
                      <StaleBadge reason={route.stale_reason} since={route.stale_since} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

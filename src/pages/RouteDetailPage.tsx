import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Route } from "@/types/route";
import { getRoute } from "@/api/routes";
import { formatDistance } from "@/lib/format";
import { Button } from "@/components/ui/button";

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

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getRoute(id)
      .then((data) => {
        if (!cancelled) setRoute(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading route…</p>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Route Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-4">
          {error ?? "The route you are looking for does not exist."}
        </p>
        <Button variant="outline" onClick={() => navigate("/flight-plans")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Flight Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Route Details</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Summary metrics */}
      <div className="mb-6 grid grid-cols-3 gap-4 max-w-2xl">
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs uppercase text-[var(--color-text-muted)] mb-1">Total Distance</p>
          <p className="text-lg font-semibold">{formatDistance(route.total_distance)}</p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs uppercase text-[var(--color-text-muted)] mb-1">Total Time</p>
          <p className="text-lg font-semibold">{formatTime(route.total_time_seconds)}</p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs uppercase text-[var(--color-text-muted)] mb-1">Contracts Fulfilled</p>
          <p className="text-lg font-semibold">{route.contracts_fulfilled}</p>
        </div>
      </div>

      {/* Stops table */}
      <h2 className="text-lg font-semibold mb-3">Stops</h2>
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)] mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Location</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Action</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Cargo</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">SCU</th>
            </tr>
          </thead>
          <tbody>
            {route.stops.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No stops.
                </td>
              </tr>
            ) : (
              route.stops.map((stop, idx) => (
                <tr key={idx} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3">{stop.location_name}</td>
                  <td className="px-4 py-3 capitalize">{stop.action}</td>
                  <td className="px-4 py-3">{stop.cargo_name}</td>
                  <td className="px-4 py-3">{stop.cargo_scu}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legs table */}
      <h2 className="text-lg font-semibold mb-3">Legs</h2>
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">From</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">To</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Distance</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Time</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Type</th>
            </tr>
          </thead>
          <tbody>
            {route.legs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No legs.
                </td>
              </tr>
            ) : (
              route.legs.map((leg, idx) => (
                <tr key={idx} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3 font-mono text-xs">{leg.from_location_id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{leg.to_location_id}</td>
                  <td className="px-4 py-3">{formatDistance(leg.distance)}</td>
                  <td className="px-4 py-3">{formatTime(leg.travel_time_seconds)}</td>
                  <td className="px-4 py-3 capitalize">{leg.travel_type}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

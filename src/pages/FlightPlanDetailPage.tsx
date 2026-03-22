import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { FlightPlan } from "@/types/flight-plan";
import type { Route } from "@/types/route";
import { getFlightPlan } from "@/api/flight-plans";
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

function RouteSection({ route, label }: { route: Route; label: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">{label}</h2>

      {/* Stops */}
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">Stops</h3>
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)] mb-4">
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
            {route.stops.map((stop, idx) => (
              <tr key={idx} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3">{stop.location_name}</td>
                <td className="px-4 py-3 capitalize">{stop.action}</td>
                <td className="px-4 py-3">{stop.cargo_name}</td>
                <td className="px-4 py-3">{stop.cargo_scu}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legs */}
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">Legs</h3>
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
            {route.legs.map((leg, idx) => (
              <tr key={idx} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3 font-mono text-xs">{leg.from_location_id}</td>
                <td className="px-4 py-3 font-mono text-xs">{leg.to_location_id}</td>
                <td className="px-4 py-3">{formatDistance(leg.distance)}</td>
                <td className="px-4 py-3">{formatTime(leg.travel_time_seconds)}</td>
                <td className="px-4 py-3 capitalize">{leg.travel_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FlightPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [flightPlan, setFlightPlan] = useState<FlightPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getFlightPlan(id)
      .then((data) => {
        if (!cancelled) setFlightPlan(data);
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
        <p className="text-[var(--color-text-muted)]">Loading flight plan…</p>
      </div>
    );
  }

  if (error || !flightPlan) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Flight Plan Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-4">
          {error ?? "The flight plan you are looking for does not exist."}
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
        <h1 className="text-2xl font-bold">Flight Plan Details</h1>
        <Link to="/flight-plans">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Metadata */}
      <div className="mb-6 grid grid-cols-2 gap-4 max-w-xl">
        <div>
          <p className="text-xs uppercase text-[var(--color-text-muted)]">Ship</p>
          <p className="font-mono text-sm">{flightPlan.ship_id}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-[var(--color-text-muted)]">Graph</p>
          <p className="font-mono text-sm">{flightPlan.distance_graph_id}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-[var(--color-text-muted)]">Cargo Limit</p>
          <p className="text-sm">
            {flightPlan.cargo_limit_scu !== null ? `${flightPlan.cargo_limit_scu} SCU` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-[var(--color-text-muted)]">Contracts</p>
          <p className="text-sm">{flightPlan.contract_ids.length} contract(s)</p>
        </div>
      </div>

      {/* Contract IDs */}
      {flightPlan.contract_ids.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase text-[var(--color-text-muted)] mb-2">Contract IDs</p>
          <div className="flex flex-wrap gap-2">
            {flightPlan.contract_ids.map((cid) => (
              <span
                key={cid}
                className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]"
              >
                {cid}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Routes */}
      {flightPlan.distance_route ? (
        <RouteSection route={flightPlan.distance_route} label="Distance Route" />
      ) : (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Distance Route</h2>
          <p className="text-sm text-[var(--color-text-muted)]">No route computed</p>
        </div>
      )}

      {flightPlan.time_route ? (
        <RouteSection route={flightPlan.time_route} label="Time Route" />
      ) : (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Time Route</h2>
          <p className="text-sm text-[var(--color-text-muted)]">No route computed</p>
        </div>
      )}
    </div>
  );
}

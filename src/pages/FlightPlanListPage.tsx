import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Trash2 } from "lucide-react";
import type { FlightPlan } from "@/types/flight-plan";
import { listFlightPlans, deleteFlightPlan } from "@/api/flight-plans";
import { Button } from "@/components/ui/button";

export default function FlightPlanListPage() {
  const navigate = useNavigate();
  const [flightPlans, setFlightPlans] = useState<FlightPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FlightPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listFlightPlans()
      .then((data) => {
        if (!cancelled) setFlightPlans(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load flight plans");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFlightPlan(deleteTarget.id);
      setFlightPlans((prev) => prev.filter((fp) => fp.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete flight plan");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading flight plans…</p>
      </div>
    );
  }

  if (error && flightPlans.length === 0) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-danger)]">{error}</p>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold">Flight Plans</h1>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Ship</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Contracts</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Graph</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Cargo Limit</th>
              <th className="px-4 py-3 text-right font-semibold uppercase text-[var(--color-text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {flightPlans.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No flight plans found.
                </td>
              </tr>
            ) : (
              flightPlans.map((fp) => (
                <tr
                  key={fp.id}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] cursor-pointer"
                  onClick={() => navigate(`/flight-plans/${fp.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-sm">{fp.ship_id}</td>
                  <td className="px-4 py-3">{fp.contract_ids.length}</td>
                  <td className="px-4 py-3 font-mono text-sm">{fp.distance_graph_id}</td>
                  <td className="px-4 py-3">{fp.cargo_limit_scu !== null ? `${fp.cargo_limit_scu} SCU` : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete flight plan ${fp.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(fp);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            role="dialog"
            aria-label="Confirm deletion"
            className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_0_24px_var(--color-glow)]"
          >
            <h2 className="text-lg font-bold mb-2">Confirm Deletion</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Are you sure you want to delete flight plan <strong>{deleteTarget.id}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

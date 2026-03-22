import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Trash2, List, Network } from "lucide-react";
import type { Location } from "@/types/location";
import { listLocations, deleteLocation } from "@/api/locations";
import { buildLocationTree } from "@/lib/location-tree";
import { Button } from "@/components/ui/button";
import LocationTreeView from "@/components/location/LocationTreeView";
import { useAuth } from "@hexadian-corporation/auth-react";

type ViewMode = "table" | "tree";

export default function LocationListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("hhh:locations:write");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    let cancelled = false;

    listLocations()
      .then((data) => {
        if (!cancelled) setLocations(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load locations");
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
      await deleteLocation(deleteTarget.id);
      setLocations((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete location");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading locations…</p>
      </div>
    );
  }

  if (error && locations.length === 0) {
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
        <h1 className="text-2xl font-bold">Ubicaciones</h1>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-md border border-[var(--color-border)]">
            <button
              type="button"
              aria-label="Table view"
              className={`px-2.5 py-1.5 text-sm rounded-l-md transition-colors ${
                viewMode === "table"
                  ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Tree view"
              className={`px-2.5 py-1.5 text-sm rounded-r-md transition-colors ${
                viewMode === "tree"
                  ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
              onClick={() => setViewMode("tree")}
            >
              <Network className="h-4 w-4" />
            </button>
          </div>
          {canWrite && (
          <Button onClick={() => navigate("/locations/new")}>
            <Plus className="h-4 w-4" />
            Nueva ubicación
          </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === "tree" ? (
        <LocationTreeView
          tree={buildLocationTree(locations)}
          canWrite={canWrite}
          onDelete={setDeleteTarget}
        />
      ) : (
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Name</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Type</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Parent</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Trade Terminal</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Landing Pad</th>
              <th className="px-4 py-3 text-right font-semibold uppercase text-[var(--color-text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No locations found.
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr
                  key={loc.id}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] cursor-pointer"
                  onClick={() => navigate(`/locations/${loc.id}`)}
                >
                  <td className="px-4 py-3">{loc.name}</td>
                  <td className="px-4 py-3">{loc.location_type}</td>
                  <td className="px-4 py-3">{loc.parent_id ?? "—"}</td>
                  <td className="px-4 py-3">{loc.has_trade_terminal ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    {loc.has_landing_pad
                      ? loc.landing_pad_size ?? "Yes"
                      : "No"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${loc.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(loc);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                    </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

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
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
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

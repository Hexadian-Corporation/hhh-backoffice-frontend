import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import type { Ship } from "@/types/ship";
import { listShips, deleteShip } from "@/api/ships";
import { Button } from "@/components/ui/button";
import { useAuth } from "@hexadian-corporation/auth-react";

export default function ShipListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("hhh:ships:write");
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ship | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listShips()
      .then((data) => {
        if (!cancelled) setShips(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load ships");
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
      await deleteShip(deleteTarget.id);
      setShips((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete ship");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading ships…</p>
      </div>
    );
  }

  if (error && ships.length === 0) {
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
        <h1 className="text-2xl font-bold">Naves</h1>
        {canWrite && (
          <Button onClick={() => navigate("/ships/new")}>
            <Plus className="h-4 w-4" />
            Nueva nave
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Name</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Manufacturer</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Total SCU</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Cargo Holds</th>
              <th className="px-4 py-3 text-right font-semibold uppercase text-[var(--color-text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ships.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No ships found.
                </td>
              </tr>
            ) : (
              ships.map((ship) => (
                <tr
                  key={ship.id}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] cursor-pointer"
                  onClick={() => navigate(`/ships/${ship.id}`)}
                >
                  <td className="px-4 py-3">{ship.name}</td>
                  <td className="px-4 py-3">{ship.manufacturer}</td>
                  <td className="px-4 py-3">{ship.total_scu}</td>
                  <td className="px-4 py-3">{ship.cargo_holds.length}</td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${ship.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(ship);
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

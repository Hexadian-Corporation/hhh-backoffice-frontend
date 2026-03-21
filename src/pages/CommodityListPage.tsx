import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import type { Commodity } from "@/types/commodity";
import { listCommodities, deleteCommodity } from "@/api/commodities";
import { Button } from "@/components/ui/button";
import { useAuth } from "@hexadian-corporation/auth-react";

export default function CommodityListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("hhh:commodities:write");
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Commodity | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listCommodities()
      .then((data) => {
        if (!cancelled) setCommodities(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load commodities");
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
      await deleteCommodity(deleteTarget.id);
      setCommodities((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete commodity");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading commodities…</p>
      </div>
    );
  }

  if (error && commodities.length === 0) {
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
        <h1 className="text-2xl font-bold">Mercancías</h1>
        {canWrite && (
        <Button onClick={() => navigate("/commodities/new")}>
          <Plus className="h-4 w-4" />
          Nueva mercancía
        </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Name</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Code</th>
              <th className="px-4 py-3 text-right font-semibold uppercase text-[var(--color-text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {commodities.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No commodities found.
                </td>
              </tr>
            ) : (
              commodities.map((commodity) => (
                <tr
                  key={commodity.id}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] cursor-pointer"
                  onClick={() => navigate(`/commodities/${commodity.id}`)}
                >
                  <td className="px-4 py-3">{commodity.name}</td>
                  <td className="px-4 py-3">{commodity.code}</td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${commodity.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(commodity);
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

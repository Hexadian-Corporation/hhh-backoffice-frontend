import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Graph } from "@/types/graph";
import { listGraphs } from "@/api/graphs";

export default function GraphListPage() {
  const navigate = useNavigate();
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listGraphs()
      .then((data) => {
        if (!cancelled) setGraphs(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load graphs");
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
        <p className="text-[var(--color-text-muted)]">Loading graphs…</p>
      </div>
    );
  }

  if (error && graphs.length === 0) {
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
        <h1 className="text-2xl font-bold">Grafos</h1>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Name</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Nodes</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Edges</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Hash</th>
            </tr>
          </thead>
          <tbody>
            {graphs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No graphs found.
                </td>
              </tr>
            ) : (
              graphs.map((graph) => (
                <tr
                  key={graph.id}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] cursor-pointer"
                  onClick={() => navigate(`/graphs/${graph.id}`)}
                >
                  <td className="px-4 py-3">{graph.name}</td>
                  <td className="px-4 py-3">{graph.nodes.length}</td>
                  <td className="px-4 py-3">{graph.edges.length}</td>
                  <td className="px-4 py-3 font-mono text-[var(--color-text-muted)]">{graph.hash.slice(0, 8)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Graph } from "@/types/graph";
import { getGraph } from "@/api/graphs";
import { formatDistance } from "@/lib/format";
import { Button } from "@/components/ui/button";

function formatTravelTime(seconds: number): string {
  if (seconds <= 0) return "N/A";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function GraphDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getGraph(id)
      .then((data) => {
        if (!cancelled) setGraph(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
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
        <p className="text-[var(--color-text-muted)]">Loading graph…</p>
      </div>
    );
  }

  if (notFound || !graph) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Graph Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-4">
          The graph you are looking for does not exist.
        </p>
        <Button variant="outline" onClick={() => navigate("/graphs")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Graphs
        </Button>
      </div>
    );
  }

  const nodeLabels = new Map(graph.nodes.map((n) => [n.location_id, n.label]));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{graph.name}</h1>
        <Button variant="outline" onClick={() => navigate("/graphs")}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Graph info */}
      <div className="mb-6 grid grid-cols-2 gap-4 max-w-md">
        <div>
          <p className="text-xs uppercase text-[var(--color-text-muted)]">Hash</p>
          <p className="font-mono text-sm">{graph.hash}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-[var(--color-text-muted)]">Nodes</p>
          <p className="text-sm">{graph.nodes.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-[var(--color-text-muted)]">Edges</p>
          <p className="text-sm">{graph.edges.length}</p>
        </div>
      </div>

      {/* Nodes table */}
      <h2 className="text-lg font-semibold mb-3">Nodes</h2>
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)] mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Location ID</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Label</th>
            </tr>
          </thead>
          <tbody>
            {graph.nodes.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No nodes.
                </td>
              </tr>
            ) : (
              graph.nodes.map((node) => (
                <tr key={node.location_id} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3 font-mono text-[var(--color-text-muted)]">{node.location_id}</td>
                  <td className="px-4 py-3">{node.label}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edges table */}
      <h2 className="text-lg font-semibold mb-3">Edges</h2>
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">From</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">To</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Distance</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Travel Type</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Travel Time</th>
            </tr>
          </thead>
          <tbody>
            {graph.edges.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No edges.
                </td>
              </tr>
            ) : (
              graph.edges.map((edge, idx) => (
                <tr key={idx} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3">{nodeLabels.get(edge.source_id) ?? edge.source_id}</td>
                  <td className="px-4 py-3">{nodeLabels.get(edge.target_id) ?? edge.target_id}</td>
                  <td className="px-4 py-3">{formatDistance(edge.distance)}</td>
                  <td className="px-4 py-3 capitalize">{edge.travel_type}</td>
                  <td className="px-4 py-3">{formatTravelTime(edge.travel_time_seconds)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

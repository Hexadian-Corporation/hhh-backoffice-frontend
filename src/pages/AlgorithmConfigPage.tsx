import { useEffect, useState } from "react";
import { Settings, Save, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlgorithmConfig } from "@/types/algorithm";
import { getAlgorithmConfig, updateAlgorithmConfig } from "@/api/algorithms";
import { Button } from "@/components/ui/button";

const ALGORITHM_META: Record<
  string,
  { label: string; description: string; type: string; compute: string }
> = {
  dijkstra: {
    label: "Dijkstra",
    description: "Shortest path algorithm. Basic tier, available to all users.",
    type: "Shortest Path",
    compute: "CPU",
  },
  astar: {
    label: "A*",
    description:
      "Shortest path with heuristic. Better performance for large graphs.",
    type: "Shortest Path + Heuristic",
    compute: "CPU",
  },
  aco: {
    label: "Ant Colony Optimization",
    description: "Metaheuristic parallel algorithm. Ideal for WebGPU.",
    type: "Metaheuristic",
    compute: "GPU / CPU",
  },
  ford_fulkerson: {
    label: "Ford-Fulkerson",
    description:
      "Maximum flow adapted for cargo routing. Partially parallelizable.",
    type: "Max Flow",
    compute: "CPU (partial GPU)",
  },
};

export default function AlgorithmConfigPage() {
  const [config, setConfig] = useState<AlgorithmConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAlgorithmConfig()
      .then((data) => {
        if (!cancelled) setConfig(data);
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
  }, []);

  function handleToggle(idx: number) {
    setConfig((prev) => {
      if (!prev) return prev;
      const entries = [...prev.entries];
      entries[idx] = { ...entries[idx], enabled: !entries[idx].enabled };
      return { ...prev, entries };
    });
  }

  function handleComplexityChange(
    idx: number,
    field: "complexity_min" | "complexity_max",
    value: number | null,
  ) {
    setConfig((prev) => {
      if (!prev) return prev;
      const entries = [...prev.entries];
      entries[idx] = { ...entries[idx], [field]: value };
      return { ...prev, entries };
    });
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await updateAlgorithmConfig({ entries: config.entries });
      setConfig(updated);
      setToast("Configuration saved successfully");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast("Failed to save configuration");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">
          Loading algorithm config…
        </p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Algorithm Configuration</h1>
        <p className="text-[var(--color-error)]">
          {error ?? "Failed to load configuration."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div
          className="mb-4 flex items-center gap-2 rounded-md bg-[var(--color-success)]/10 px-4 py-2 text-sm text-[var(--color-success)] border border-[var(--color-success)]/20"
          role="status"
        >
          <CheckCircle className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-[var(--color-accent)]" />
          <h1 className="text-2xl font-bold">Algorithm Configuration</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* Algorithm cards */}
      <div className="space-y-4 max-w-2xl">
        {config.entries.map((entry, idx) => {
          const meta = ALGORITHM_META[entry.algorithm] ?? {
            label: entry.algorithm,
            description: "",
            type: "",
            compute: "",
          };
          return (
            <div
              key={entry.algorithm}
              className="bg-[var(--color-surface)] rounded-lg p-4 border border-[var(--color-border)]"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{meta.label}</h3>
                  {meta.description && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {meta.description}
                    </p>
                  )}
                  {(meta.type || meta.compute) && (
                    <div className="flex gap-2 mt-1">
                      {meta.type && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]">
                          {meta.type}
                        </span>
                      )}
                      {meta.compute && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]">
                          {meta.compute}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  aria-label={`${entry.enabled ? "Disable" : "Enable"} ${meta.label}`}
                  aria-checked={entry.enabled}
                  role="switch"
                  onClick={() => handleToggle(idx)}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors flex-shrink-0",
                    entry.enabled
                      ? "bg-[var(--color-accent)]"
                      : "bg-[var(--color-border)]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                      entry.enabled ? "translate-x-6" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>

              {/* Complexity range inputs (only shown when enabled) */}
              {entry.enabled && (
                <div className="flex gap-4 mt-3">
                  <div>
                    <label
                      htmlFor={`min-${entry.algorithm}`}
                      className="block text-xs text-[var(--color-text-muted)] mb-1"
                    >
                      Min Nodes
                    </label>
                    <input
                      id={`min-${entry.algorithm}`}
                      type="number"
                      min="0"
                      value={entry.complexity_min}
                      onChange={(e) =>
                        handleComplexityChange(
                          idx,
                          "complexity_min",
                          Number(e.target.value),
                        )
                      }
                      className="w-24 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`max-${entry.algorithm}`}
                      className="block text-xs text-[var(--color-text-muted)] mb-1"
                    >
                      Max Nodes
                    </label>
                    <input
                      id={`max-${entry.algorithm}`}
                      type="number"
                      min="0"
                      value={entry.complexity_max ?? ""}
                      placeholder="∞"
                      onChange={(e) =>
                        handleComplexityChange(
                          idx,
                          "complexity_max",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="w-24 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                </div>
              )}

              {/* Permission badge */}
              <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                Permission:{" "}
                <code className="font-mono">
                  hhh:algorithm:{entry.algorithm}
                </code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

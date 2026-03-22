import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncAll, syncEntity, syncEntityFromSource, listSources } from "@/api/dataminer";
import type { SyncResult, SourceInfo } from "@/types/dataminer";

const ENTITIES = ["locations", "distances", "ships", "commodities", "contracts"] as const;

interface OperationState {
  loading: boolean;
  results: SyncResult[] | null;
  error: string | null;
}

const INITIAL_STATE: OperationState = { loading: false, results: null, error: null };

export default function SyncPage() {
  const [fullSync, setFullSync] = useState<OperationState>(INITIAL_STATE);
  const [entitySync, setEntitySync] = useState<OperationState>(INITIAL_STATE);
  const [sourceSync, setSourceSync] = useState<OperationState>(INITIAL_STATE);

  const [selectedEntity, setSelectedEntity] = useState<string>(ENTITIES[0]);
  const [selectedSourceEntity, setSelectedSourceEntity] = useState<string>(ENTITIES[0]);
  const [selectedSource, setSelectedSource] = useState("");

  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSources()
      .then((res) => {
        if (cancelled) return;
        setSources(res.sources);
        if (res.sources.length > 0) setSelectedSource(res.sources[0].name);
      })
      .catch((err: unknown) => {
        if (!cancelled) setSourcesError(err instanceof Error ? err.message : "Failed to load sources");
      })
      .finally(() => {
        if (!cancelled) setSourcesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleFullSync() {
    setFullSync({ loading: true, results: null, error: null });
    try {
      const res = await syncAll();
      setFullSync({ loading: false, results: res.results, error: null });
    } catch (err: unknown) {
      setFullSync({ loading: false, results: null, error: err instanceof Error ? err.message : "Sync failed" });
    }
  }

  async function handleEntitySync() {
    setEntitySync({ loading: true, results: null, error: null });
    try {
      const result = await syncEntity(selectedEntity);
      setEntitySync({ loading: false, results: [result], error: null });
    } catch (err: unknown) {
      setEntitySync({ loading: false, results: null, error: err instanceof Error ? err.message : "Sync failed" });
    }
  }

  async function handleSourceSync() {
    setSourceSync({ loading: true, results: null, error: null });
    try {
      const result = await syncEntityFromSource(selectedSourceEntity, selectedSource);
      setSourceSync({ loading: false, results: [result], error: null });
    } catch (err: unknown) {
      setSourceSync({ loading: false, results: null, error: err instanceof Error ? err.message : "Sync failed" });
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Data Sync
        </h1>
        <p className="text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-body)" }}>
          Trigger dataminer synchronization for game data.
        </p>
      </div>

      {/* Full Sync */}
      <Section title="Full Sync" description="Sync all entities from all configured sources.">
        <div className="flex items-center gap-4">
          <Button onClick={handleFullSync} disabled={fullSync.loading}>
            {fullSync.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync All
          </Button>
        </div>
        <ResultPanel state={fullSync} />
      </Section>

      {/* Per-Entity Sync */}
      <Section title="Entity Sync" description="Sync a single entity type from all sources.">
        <div className="flex items-center gap-4">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
          >
            {ENTITIES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <Button onClick={handleEntitySync} disabled={entitySync.loading}>
            {entitySync.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Entity
          </Button>
        </div>
        <ResultPanel state={entitySync} />
      </Section>

      {/* Per-Source Sync */}
      <Section title="Source Sync" description="Sync a single entity from a specific data source.">
        {sourcesLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading sources…</p>
        ) : sourcesError ? (
          <ErrorPanel message={sourcesError} />
        ) : sources.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No sources configured.</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <select
                value={selectedSourceEntity}
                onChange={(e) => setSelectedSourceEntity(e.target.value)}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
              >
                {ENTITIES.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
                aria-label="Source"
              >
                {sources.map((s) => (
                  <option key={s.name} value={s.name} disabled={!s.available}>
                    {s.name}{s.available ? "" : " (unavailable)"}
                  </option>
                ))}
              </select>
              <Button onClick={handleSourceSync} disabled={sourceSync.loading || !selectedSource}>
                {sourceSync.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Sync from Source
              </Button>
            </div>
            <ResultPanel state={sourceSync} />
          </>
        )}
      </Section>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ResultPanel({ state }: { state: OperationState }) {
  if (state.error) return <ErrorPanel message={state.error} />;
  if (!state.results) return null;

  return (
    <div className="rounded-md border border-green-700/30 bg-green-950/20 p-4 space-y-2">
      <div className="flex items-center gap-2 text-green-400">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Sync completed</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left py-1 text-[var(--color-text-muted)]">Entity</th>
            <th className="text-right py-1 text-[var(--color-text-muted)]">Count</th>
          </tr>
        </thead>
        <tbody>
          {state.results.map((r) => (
            <tr key={r.entity} className="border-b border-[var(--color-border)] last:border-0">
              <td className="py-1 text-[var(--color-text)]">{r.entity}</td>
              <td className="py-1 text-right text-[var(--color-text)]">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-700/30 bg-red-950/20 p-4">
      <div className="flex items-start gap-2 text-red-400">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <span className="text-sm font-medium">Error</span>
          <p className="text-sm text-red-300 whitespace-pre-wrap break-all">{message}</p>
        </div>
      </div>
    </div>
  );
}

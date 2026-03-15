import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, CheckCircle, Play, XCircle, Clock } from "lucide-react";
import type { Contract } from "@/types/contract";
import { listContracts, updateContract } from "@/api/contracts";
import { Button } from "@/components/ui/button";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

const STATUS_OPTIONS = ["all", "draft", "active", "expired", "cancelled"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const STATUS_COLORS: Record<Contract["status"], string> = {
  draft: "var(--color-text-muted)",
  active: "var(--color-accent)",
  expired: "var(--color-warning)",
  cancelled: "var(--color-danger)",
};

interface StatusAction {
  label: string;
  target: Contract["status"];
  icon: React.ReactNode;
  variant: "default" | "destructive";
  message: string;
}

const STATUS_ACTIONS: Record<string, StatusAction[]> = {
  draft: [
    {
      label: "Activate",
      target: "active",
      icon: <Play className="h-3.5 w-3.5" />,
      variant: "default",
      message: "Are you sure you want to activate this contract?",
    },
    {
      label: "Cancel",
      target: "cancelled",
      icon: <XCircle className="h-3.5 w-3.5" />,
      variant: "destructive",
      message:
        "Are you sure you want to cancel this contract? This cannot be undone.",
    },
  ],
  active: [
    {
      label: "Expire",
      target: "expired",
      icon: <Clock className="h-3.5 w-3.5" />,
      variant: "destructive",
      message:
        "Are you sure you want to expire this contract? This cannot be undone.",
    },
    {
      label: "Cancel",
      target: "cancelled",
      icon: <XCircle className="h-3.5 w-3.5" />,
      variant: "destructive",
      message:
        "Are you sure you want to cancel this contract? This cannot be undone.",
    },
  ],
};

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ContractListPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    contractId: string;
    action: StatusAction;
  } | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    listContracts()
      .then((data) => {
        if (!cancelled) setContracts(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load contracts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  async function handleStatusChange() {
    if (!pendingAction) return;

    const { contractId, action } = pendingAction;
    setPendingAction(null);

    try {
      await updateContract(contractId, { status: action.target });
      setToast({
        message: `Contract ${action.target} successfully`,
        type: "success",
      });
      setRetryCount((c) => c + 1);
    } catch {
      setToast({
        message: `Failed to update contract status`,
        type: "error",
      });
    }
    setTimeout(() => setToast(null), 3000);
  }

  const filtered =
    statusFilter === "all"
      ? contracts
      : contracts.filter((c) => c.status === statusFilter);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-40 rounded bg-[var(--color-surface)] animate-pulse" />
          <div className="h-10 w-36 rounded bg-[var(--color-surface)] animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] animate-pulse"
              data-testid="skeleton-card"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && contracts.length === 0) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-danger)]">{error}</p>
        <Button className="mt-4" onClick={() => {
          setLoading(true);
          setError(null);
          setRetryCount((c) => c + 1);
        }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`mb-4 flex items-center gap-2 rounded-md px-4 py-2 text-sm border ${
            toast.type === "success"
              ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20"
              : "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20"
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          {toast.message}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-md bg-[var(--color-danger)]/10 px-4 py-2 text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/20">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <Button onClick={() => navigate("/contracts/new")}>
          <Plus className="h-4 w-4" />
          New Contract
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6" role="group" aria-label="Filter by status">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setStatusFilter(opt)}
            className={`rounded-full px-3 py-1 text-sm capitalize border transition-colors ${
              statusFilter === opt
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Contract cards */}
      {filtered.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-8">
          No contracts found.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((contract) => (
            <div
              key={contract.id}
              role="article"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 cursor-pointer hover:border-[var(--color-accent)] transition-colors"
              onClick={() => navigate(`/contracts/${contract.id}`)}
            >
              {/* Title & status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-sm leading-tight">
                  {contract.title}
                </h2>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize border"
                  style={{
                    color: STATUS_COLORS[contract.status],
                    borderColor: STATUS_COLORS[contract.status],
                    backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[contract.status]} 10%, transparent)`,
                  }}
                  data-testid={`status-badge-${contract.status}`}
                >
                  {contract.status}
                </span>
              </div>

              {/* Faction */}
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                {contract.faction}
              </p>

              {/* Details row */}
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>
                  <span className="text-[var(--color-warning)] font-medium">
                    {contract.reward_uec.toLocaleString()}
                  </span>{" "}
                  UEC
                </span>
                <span>{formatDeadline(contract.deadline)}</span>
              </div>

              {/* Hauling orders count */}
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                {contract.hauling_orders.length} hauling order
                {contract.hauling_orders.length !== 1 ? "s" : ""}
              </p>

              {/* Status action buttons */}
              {STATUS_ACTIONS[contract.status] && (
                <div
                  className="flex gap-2 mt-3 pt-3 border-t border-[var(--color-border)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {STATUS_ACTIONS[contract.status].map((action) => (
                    <Button
                      key={action.target}
                      size="sm"
                      variant={action.variant}
                      onClick={() =>
                        setPendingAction({
                          contractId: contract.id,
                          action,
                        })
                      }
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation dialog */}
      <ConfirmationDialog
        open={pendingAction !== null}
        title="Confirm Status Change"
        message={pendingAction?.action.message ?? ""}
        confirmLabel={pendingAction?.action.label ?? "Confirm"}
        confirmVariant={pendingAction?.action.variant ?? "default"}
        onConfirm={handleStatusChange}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

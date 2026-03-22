import { AlertTriangle } from "lucide-react";

interface StaleBadgeProps {
  reason?: string | null;
  since?: string | null;
}

export default function StaleBadge({ reason, since }: StaleBadgeProps) {
  const parts: string[] = [];
  if (reason) parts.push(`Reason: ${reason}`);
  if (since) parts.push(`Since: ${since}`);
  const tooltip = parts.length > 0 ? parts.join("\n") : "This item is stale";

  return (
    <span
      data-testid="stale-badge"
      title={tooltip}
      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]"
      aria-label={`Stale: ${tooltip}`}
    >
      <AlertTriangle className="h-3 w-3" />
      Stale
    </span>
  );
}

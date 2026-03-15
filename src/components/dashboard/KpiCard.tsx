import type { ReactNode } from "react";
import { useNavigate } from "react-router";

interface KpiCardProps {
  title: string;
  count: number | null;
  icon: ReactNode;
  href: string;
  loading?: boolean;
  error?: string | null;
  breakdown?: { label: string; count: number }[];
}

export default function KpiCard({ title, count, icon, href, loading, error, breakdown }: KpiCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="w-full text-left rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-accent)]/50 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[var(--color-text-muted)]">{title}</h3>
        <span className="text-[var(--color-accent)]">{icon}</span>
      </div>

      {loading && <p className="text-2xl font-bold text-[var(--color-text-muted)]">Loading…</p>}
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      {!loading && !error && (
        <>
          <p className="text-3xl font-bold">{count}</p>
          {breakdown && breakdown.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {breakdown.map(({ label, count: c }) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[var(--color-border)] text-[var(--color-text-muted)]"
                >
                  {label}: {c}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </button>
  );
}

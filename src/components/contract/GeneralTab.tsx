import type { ContractCreate } from "@/types/contract";

interface GeneralTabProps {
  form: ContractCreate;
  errors: Record<string, string>;
  onChange: <K extends keyof ContractCreate>(key: K, value: ContractCreate[K]) => void;
  statusDisabled?: boolean;
}

const STATUS_OPTIONS = ["draft", "active", "expired", "cancelled"] as const;

export default function GeneralTab({ form, errors, onChange, statusDisabled }: GeneralTabProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.description}</p>
        )}
      </div>

      {/* Faction */}
      <div>
        <label htmlFor="faction" className="block text-sm font-medium mb-1">
          Faction
        </label>
        <input
          id="faction"
          type="text"
          value={form.faction}
          onChange={(e) => onChange("faction", e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.faction && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.faction}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium mb-1">
          Status
        </label>
        <select
          id="status"
          value={form.status}
          disabled={statusDisabled}
          onChange={(e) =>
            onChange("status", e.target.value as ContractCreate["status"])
          }
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Reward */}
      <div>
        <label htmlFor="reward_uec" className="block text-sm font-medium mb-1">
          Reward (UEC)
        </label>
        <input
          id="reward_uec"
          type="number"
          min={0}
          value={form.reward_uec}
          onChange={(e) => onChange("reward_uec", Number(e.target.value))}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.reward_uec && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.reward_uec}</p>
        )}
      </div>

      {/* Collateral */}
      <div>
        <label htmlFor="collateral_uec" className="block text-sm font-medium mb-1">
          Collateral (UEC)
        </label>
        <input
          id="collateral_uec"
          type="number"
          min={0}
          value={form.collateral_uec}
          onChange={(e) => onChange("collateral_uec", Number(e.target.value))}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.collateral_uec && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.collateral_uec}</p>
        )}
      </div>

      {/* Deadline */}
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium mb-1">
          Deadline
        </label>
        <input
          id="deadline"
          type="datetime-local"
          value={form.deadline ? form.deadline.slice(0, 16) : ""}
          onChange={(e) => {
            const val = e.target.value;
            onChange("deadline", val ? new Date(val).toISOString() : "");
          }}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.deadline && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.deadline}</p>
        )}
      </div>
    </div>
  );
}

import type { ContractCreate } from "@/types/contract";

interface GeneralTabProps {
  form: ContractCreate;
  errors: Record<string, string>;
  onChange: <K extends keyof ContractCreate>(key: K, value: ContractCreate[K]) => void;
}

const STATUS_OPTIONS = ["draft", "active", "expired", "cancelled"] as const;

export default function GeneralTab({ form, errors, onChange }: GeneralTabProps) {
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

      {/* Contractor Name */}
      <div>
        <label htmlFor="contractor_name" className="block text-sm font-medium mb-1">
          Contractor Name
        </label>
        <input
          id="contractor_name"
          type="text"
          value={form.contractor_name}
          onChange={(e) => onChange("contractor_name", e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.contractor_name && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.contractor_name}</p>
        )}
      </div>

      {/* Contractor Logo URL */}
      <div>
        <label htmlFor="contractor_logo_url" className="block text-sm font-medium mb-1">
          Contractor Logo URL
        </label>
        <div className="flex items-center gap-3">
          <input
            id="contractor_logo_url"
            type="text"
            value={form.contractor_logo_url}
            onChange={(e) => onChange("contractor_logo_url", e.target.value)}
            className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          {form.contractor_logo_url && (
            <img
              src={form.contractor_logo_url}
              alt="Contractor logo"
              className="h-9 w-9 rounded-md border border-[var(--color-border)] object-cover"
            />
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium mb-1">
          Status
        </label>
        <select
          id="status"
          value={form.status}
          onChange={(e) =>
            onChange("status", e.target.value as ContractCreate["status"])
          }
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
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
        <label htmlFor="reward_aUEC" className="block text-sm font-medium mb-1">
          Reward (aUEC)
        </label>
        <input
          id="reward_aUEC"
          type="number"
          min={0}
          value={form.reward_aUEC}
          onChange={(e) => onChange("reward_aUEC", Number(e.target.value))}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.reward_aUEC && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.reward_aUEC}</p>
        )}
      </div>

      {/* Collateral */}
      <div>
        <label htmlFor="collateral_aUEC" className="block text-sm font-medium mb-1">
          Collateral (aUEC)
        </label>
        <input
          id="collateral_aUEC"
          type="number"
          min={0}
          value={form.collateral_aUEC}
          onChange={(e) => onChange("collateral_aUEC", Number(e.target.value))}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.collateral_aUEC && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.collateral_aUEC}</p>
        )}
      </div>

      {/* Deadline */}
      <div>
        <label htmlFor="deadline_minutes" className="block text-sm font-medium mb-1">
          Deadline (minutes)
        </label>
        <input
          id="deadline_minutes"
          type="number"
          min={1}
          value={form.deadline_minutes}
          onChange={(e) => onChange("deadline_minutes", Number(e.target.value))}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.deadline_minutes && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.deadline_minutes}</p>
        )}
      </div>

      {/* Max Acceptances */}
      <div>
        <label htmlFor="max_acceptances" className="block text-sm font-medium mb-1">
          Max Acceptances
        </label>
        <input
          id="max_acceptances"
          type="number"
          min={1}
          value={form.max_acceptances}
          onChange={(e) => onChange("max_acceptances", Number(e.target.value))}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {errors.max_acceptances && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.max_acceptances}</p>
        )}
      </div>
    </div>
  );
}

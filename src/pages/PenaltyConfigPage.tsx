import { useEffect, useState, useRef } from "react";
import { Save, Plus, X, CheckCircle } from "lucide-react";
import type { PenaltyConfig, PenaltyConfigUpdate, ShipPenalty } from "@/types/penalty";
import { getPenaltyConfig, updatePenaltyConfig } from "@/api/penalties";
import { searchShips } from "@/api/ships";
import type { Ship } from "@/types/ship";
import { Button } from "@/components/ui/button";

const STANDARD_BOX_SIZES = [0.125, 1, 2, 4, 8, 16, 24, 32];

export default function PenaltyConfigPage() {
  const [config, setConfig] = useState<PenaltyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showShipSearch, setShowShipSearch] = useState(false);
  const [shipQuery, setShipQuery] = useState("");
  const [shipResults, setShipResults] = useState<Ship[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPenaltyConfig()
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

  // Ensure all standard box sizes have entries
  function getBoxMultiplier(scu: number): number {
    return config?.box_size_penalties.find((b) => b.box_size_scu === scu)?.multiplier ?? 1.0;
  }

  function handleBoxMultiplierChange(scu: number, value: number) {
    setConfig((prev) => {
      if (!prev) return prev;
      const existing = prev.box_size_penalties.find((b) => b.box_size_scu === scu);
      if (existing) {
        return {
          ...prev,
          box_size_penalties: prev.box_size_penalties.map((b) =>
            b.box_size_scu === scu ? { ...b, multiplier: value } : b,
          ),
        };
      } else {
        return {
          ...prev,
          box_size_penalties: [...prev.box_size_penalties, { box_size_scu: scu, multiplier: value }],
        };
      }
    });
  }

  function handleRemoveShipPenalty(shipId: string) {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ship_penalties: prev.ship_penalties.filter((sp) => sp.ship_id !== shipId),
      };
    });
  }

  function handleAddShipPenalty(ship: Ship) {
    setConfig((prev) => {
      if (!prev) return prev;
      if (prev.ship_penalties.some((sp) => sp.ship_id === ship.id)) return prev;
      const newPenalty: ShipPenalty = { ship_id: ship.id, multiplier: 1.0 };
      return {
        ...prev,
        ship_penalties: [...prev.ship_penalties, newPenalty],
      };
    });
    setShowShipSearch(false);
    setShipQuery("");
    setShipResults([]);
  }

  function handleShipSearch(query: string) {
    setShipQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim()) {
      setShipResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchShips(query)
        .then(setShipResults)
        .catch(() => setShipResults([]));
    }, 300);
  }

  function handleShipMultiplierChange(shipId: string, value: number) {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ship_penalties: prev.ship_penalties.map((sp) =>
          sp.ship_id === shipId ? { ...sp, multiplier: value } : sp,
        ),
      };
    });
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    const update: PenaltyConfigUpdate = {
      time_base_per_scu: config.time_base_per_scu,
      box_size_penalties: config.box_size_penalties,
      ship_penalties: config.ship_penalties,
    };
    try {
      const updated = await updatePenaltyConfig(update);
      setConfig(updated);
      setToast({ type: "success", message: "Configuration saved successfully" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ type: "error", message: "Failed to save configuration" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading penalty config…</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Penalty Configuration</h1>
        <p className="text-[var(--color-danger)]">
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
          className={`mb-4 flex items-center gap-2 rounded-md px-4 py-2 text-sm border ${
            toast.type === "success"
              ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20"
              : "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20"
          }`}
          role="status"
        >
          {toast.type === "success" && <CheckCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Penalty Configuration</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* Base time per SCU */}
      <div className="mb-6 max-w-xs">
        <label
          htmlFor="time_base_per_scu"
          className="block text-sm font-medium mb-1"
        >
          Base Time per SCU (seconds)
        </label>
        <input
          id="time_base_per_scu"
          type="number"
          min="0"
          step="0.1"
          value={config.time_base_per_scu}
          onChange={(e) =>
            setConfig((prev) =>
              prev ? { ...prev, time_base_per_scu: Number(e.target.value) } : prev,
            )
          }
          className="w-full px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      {/* Box size penalties table */}
      <h2 className="text-lg font-semibold mb-3">Box Size Penalties</h2>
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)] mb-6 max-w-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Box Size (SCU)</th>
              <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Multiplier</th>
            </tr>
          </thead>
          <tbody>
            {STANDARD_BOX_SIZES.map((scu) => (
              <tr key={scu} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3">{scu}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    aria-label={`Multiplier for ${scu} SCU`}
                    value={getBoxMultiplier(scu)}
                    onChange={(e) => handleBoxMultiplierChange(scu, Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ship penalties */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Ship Penalties</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowShipSearch(true)}
          aria-label="Add ship penalty"
        >
          <Plus className="h-4 w-4" />
          Add Ship
        </Button>
      </div>

      {/* Ship search input */}
      {showShipSearch && (
        <div className="mb-4 max-w-sm relative">
          <input
            type="text"
            placeholder="Search ships…"
            aria-label="Search ships"
            value={shipQuery}
            onChange={(e) => handleShipSearch(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          />
          {shipResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
              {shipResults.map((ship) => (
                <button
                  key={ship.id}
                  type="button"
                  onClick={() => handleAddShipPenalty(ship)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-alt)]"
                >
                  {ship.name} ({ship.manufacturer})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {config.ship_penalties.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] mb-6">No ship penalties configured.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-[var(--color-border)] mb-6 max-w-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Ship ID</th>
                <th className="px-4 py-3 text-left font-semibold uppercase text-[var(--color-text-muted)]">Multiplier</th>
                <th className="px-4 py-3 text-right font-semibold uppercase text-[var(--color-text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {config.ship_penalties.map((sp) => (
                <tr key={sp.ship_id} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3 font-mono text-xs">{sp.ship_id}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label={`Multiplier for ship ${sp.ship_id}`}
                      value={sp.multiplier}
                      onChange={(e) => handleShipMultiplierChange(sp.ship_id, Number(e.target.value))}
                      className="w-24 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ship penalty ${sp.ship_id}`}
                      onClick={() => handleRemoveShipPenalty(sp.ship_id)}
                    >
                      <X className="h-4 w-4 text-[var(--color-danger)]" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

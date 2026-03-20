import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, CheckCircle, Plus, Trash2 } from "lucide-react";
import type { CargoHold, ShipCreate } from "@/types/ship";
import { getShip, createShip, updateShip } from "@/api/ships";
import { Button } from "@/components/ui/button";

type ShipFormFields = {
  name: string;
  manufacturer: string;
  cargo_holds: CargoHold[];
  scm_speed: number;
  quantum_speed: number;
  landing_time_seconds: number;
  loading_time_per_scu_seconds: number;
};

const INITIAL_FORM: ShipFormFields = {
  name: "",
  manufacturer: "",
  cargo_holds: [],
  scm_speed: 0,
  quantum_speed: 0,
  landing_time_seconds: 0,
  loading_time_per_scu_seconds: 0,
};

function validate(form: ShipFormFields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.manufacturer.trim()) errors.manufacturer = "Manufacturer is required";
  if (form.cargo_holds.length === 0) errors.cargo_holds = "At least one cargo hold is required";
  for (let i = 0; i < form.cargo_holds.length; i++) {
    if (!form.cargo_holds[i].name.trim()) {
      errors[`cargo_hold_${i}_name`] = "Hold name is required";
    }
  }
  return errors;
}

function computeTotalScu(holds: CargoHold[]): number {
  return holds.reduce((sum, h) => sum + h.volume_scu, 0);
}

export default function ShipEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState<ShipFormFields>(INITIAL_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;

    setLoading(true);
    getShip(id)
      .then((ship) => {
        if (cancelled) return;
        setForm({
          name: ship.name,
          manufacturer: ship.manufacturer,
          cargo_holds: ship.cargo_holds,
          scm_speed: ship.scm_speed,
          quantum_speed: ship.quantum_speed,
          landing_time_seconds: ship.landing_time_seconds,
          loading_time_per_scu_seconds: ship.loading_time_per_scu_seconds,
        });
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
  }, [id, isNew]);

  const handleFieldChange = useCallback(
    <K extends keyof ShipFormFields>(key: K, value: ShipFormFields[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (prev[key]) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  function addCargoHold() {
    setForm((prev) => ({
      ...prev,
      cargo_holds: [...prev.cargo_holds, { name: "", volume_scu: 0 }],
    }));
    setErrors((prev) => {
      if (prev.cargo_holds) {
        const next = { ...prev };
        delete next.cargo_holds;
        return next;
      }
      return prev;
    });
  }

  function removeCargoHold(idx: number) {
    setForm((prev) => ({
      ...prev,
      cargo_holds: prev.cargo_holds.filter((_, i) => i !== idx),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`cargo_hold_${idx}_name`];
      return next;
    });
  }

  function updateCargoHold(idx: number, field: keyof CargoHold, value: string | number) {
    setForm((prev) => ({
      ...prev,
      cargo_holds: prev.cargo_holds.map((hold, i) =>
        i === idx ? { ...hold, [field]: value } : hold,
      ),
    }));
    if (field === "name") {
      setErrors((prev) => {
        const key = `cargo_hold_${idx}_name`;
        if (prev[key]) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return prev;
      });
    }
  }

  async function handleSave() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: ShipCreate = {
      ...form,
      total_scu: computeTotalScu(form.cargo_holds),
    };

    setSaving(true);
    try {
      if (isNew) {
        const created = await createShip(payload);
        setToast("Ship created successfully");
        setTimeout(() => navigate(`/ships/${created.id}`), 1000);
      } else {
        await updateShip(id, payload);
        setToast("Ship saved successfully");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Failed to save ship");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading ship…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Ship Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-4">
          The ship you are looking for does not exist.
        </p>
        <Button variant="outline" onClick={() => navigate("/ships")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Ships
        </Button>
      </div>
    );
  }

  const totalScu = computeTotalScu(form.cargo_holds);

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-md bg-[var(--color-success)]/10 px-4 py-2 text-sm text-[var(--color-success)] border border-[var(--color-success)]/20"
        >
          <CheckCircle className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isNew ? "New Ship" : "Edit Ship"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/ships")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-[var(--color-danger)]">
              {errors.name}
            </p>
          )}
        </div>

        {/* Manufacturer */}
        <div>
          <label htmlFor="manufacturer" className="block text-sm font-medium mb-1">
            Manufacturer
          </label>
          <input
            id="manufacturer"
            type="text"
            value={form.manufacturer}
            onChange={(e) => handleFieldChange("manufacturer", e.target.value)}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          {errors.manufacturer && (
            <p className="mt-1 text-xs text-[var(--color-danger)]">
              {errors.manufacturer}
            </p>
          )}
        </div>

        {/* SCM Speed */}
        <div>
          <label htmlFor="scm_speed" className="block text-sm font-medium mb-1">
            SCM Speed (m/s)
          </label>
          <input
            id="scm_speed"
            type="number"
            value={form.scm_speed}
            onChange={(e) => handleFieldChange("scm_speed", Number(e.target.value))}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>

        {/* Quantum Speed */}
        <div>
          <label htmlFor="quantum_speed" className="block text-sm font-medium mb-1">
            Quantum Speed (m/s)
          </label>
          <input
            id="quantum_speed"
            type="number"
            value={form.quantum_speed}
            onChange={(e) => handleFieldChange("quantum_speed", Number(e.target.value))}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>

        {/* Landing Time */}
        <div>
          <label htmlFor="landing_time_seconds" className="block text-sm font-medium mb-1">
            Landing Time (seconds)
          </label>
          <input
            id="landing_time_seconds"
            type="number"
            value={form.landing_time_seconds}
            onChange={(e) => handleFieldChange("landing_time_seconds", Number(e.target.value))}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>

        {/* Loading Time per SCU */}
        <div>
          <label htmlFor="loading_time_per_scu_seconds" className="block text-sm font-medium mb-1">
            Loading Time per SCU (seconds)
          </label>
          <input
            id="loading_time_per_scu_seconds"
            type="number"
            value={form.loading_time_per_scu_seconds}
            onChange={(e) => handleFieldChange("loading_time_per_scu_seconds", Number(e.target.value))}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>

        {/* Cargo Holds */}
        <fieldset>
          <div className="flex items-center justify-between mb-2">
            <legend className="text-sm font-medium">
              Cargo Holds
              {totalScu > 0 && (
                <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                  (Total: {totalScu} SCU)
                </span>
              )}
            </legend>
            <Button type="button" variant="outline" size="sm" onClick={addCargoHold}>
              <Plus className="h-3 w-3" />
              Add Hold
            </Button>
          </div>
          {errors.cargo_holds && (
            <p className="mb-2 text-xs text-[var(--color-danger)]">
              {errors.cargo_holds}
            </p>
          )}
          {form.cargo_holds.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-2">
              No cargo holds added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {form.cargo_holds.map((hold, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-md border border-[var(--color-border)] p-3"
                >
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor={`hold_name_${idx}`}
                        className="block text-xs font-medium mb-1"
                      >
                        Hold Name
                      </label>
                      <input
                        id={`hold_name_${idx}`}
                        type="text"
                        value={hold.name}
                        onChange={(e) => updateCargoHold(idx, "name", e.target.value)}
                        placeholder="e.g. Main Hold"
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                      />
                      {errors[`cargo_hold_${idx}_name`] && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">
                          {errors[`cargo_hold_${idx}_name`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor={`hold_volume_${idx}`}
                        className="block text-xs font-medium mb-1"
                      >
                        Volume (SCU)
                      </label>
                      <input
                        id={`hold_volume_${idx}`}
                        type="number"
                        value={hold.volume_scu}
                        onChange={(e) => updateCargoHold(idx, "volume_scu", Number(e.target.value))}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove hold ${idx + 1}`}
                    onClick={() => removeCargoHold(idx)}
                    className="mt-5"
                  >
                    <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </fieldset>
      </div>
    </div>
  );
}

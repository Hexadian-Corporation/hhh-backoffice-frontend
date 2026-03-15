import { useEffect, useState } from "react";
import type { Location } from "@/types/location";
import { listLocations, createLocation } from "@/api/locations";
import { Button } from "@/components/ui/button";

interface SystemSelectorProps {
  value: string | null;
  onChange: (systemId: string | null) => void;
}

export default function SystemSelector({ value, onChange }: SystemSelectorProps) {
  const [systems, setSystems] = useState<Location[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSystemName, setNewSystemName] = useState("");
  const [newCoords, setNewCoords] = useState({ x: 0, y: 0, z: 0 });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listLocations({ location_type: "system" })
      .then((result) => {
        if (!cancelled) setSystems(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === "__create__") {
      setShowCreateForm(true);
      onChange(null);
    } else {
      setShowCreateForm(false);
      onChange(val || null);
    }
  }

  async function handleCreate() {
    if (!newSystemName.trim()) {
      setCreateError("System name is required");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const created = await createLocation({
        name: newSystemName.trim(),
        location_type: "system",
        parent_id: null,
        coordinates: newCoords,
        has_trade_terminal: false,
        has_landing_pad: false,
        landing_pad_size: null,
      });
      setSystems((prev) => [...prev, created]);
      onChange(created.id);
      setShowCreateForm(false);
      setNewSystemName("");
      setNewCoords({ x: 0, y: 0, z: 0 });
    } catch {
      setCreateError("Failed to create system");
    } finally {
      setCreating(false);
    }
  }

  if (loadError) {
    return (
      <p className="text-xs text-[var(--color-danger)]">
        Failed to load star systems
      </p>
    );
  }

  return (
    <div>
      <label htmlFor="star_system" className="block text-sm font-medium mb-1">
        Star System
      </label>
      <select
        id="star_system"
        value={showCreateForm ? "__create__" : value ?? ""}
        onChange={handleSelectChange}
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
      >
        <option value="">Select a star system…</option>
        {systems.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
        <option value="__create__">+ Create new system…</option>
      </select>

      {showCreateForm && (
        <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-3">
          <div>
            <label
              htmlFor="new_system_name"
              className="block text-xs font-medium mb-1"
            >
              System Name
            </label>
            <input
              id="new_system_name"
              type="text"
              value={newSystemName}
              onChange={(e) => setNewSystemName(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="new_system_x"
                className="block text-xs mb-1"
              >
                X
              </label>
              <input
                id="new_system_x"
                type="number"
                value={newCoords.x}
                onChange={(e) =>
                  setNewCoords((prev) => ({
                    ...prev,
                    x: Number(e.target.value),
                  }))
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label
                htmlFor="new_system_y"
                className="block text-xs mb-1"
              >
                Y
              </label>
              <input
                id="new_system_y"
                type="number"
                value={newCoords.y}
                onChange={(e) =>
                  setNewCoords((prev) => ({
                    ...prev,
                    y: Number(e.target.value),
                  }))
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label
                htmlFor="new_system_z"
                className="block text-xs mb-1"
              >
                Z
              </label>
              <input
                id="new_system_z"
                type="number"
                value={newCoords.z}
                onChange={(e) =>
                  setNewCoords((prev) => ({
                    ...prev,
                    z: Number(e.target.value),
                  }))
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>
          {createError && (
            <p className="text-xs text-[var(--color-danger)]">{createError}</p>
          )}
          <Button onClick={handleCreate} disabled={creating} size="sm">
            {creating ? "Creating…" : "Create"}
          </Button>
        </div>
      )}
    </div>
  );
}

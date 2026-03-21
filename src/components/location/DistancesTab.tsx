import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { LocationDistance } from "@/types/distance";
import type { Location } from "@/types/location";
import {
  getLocationDistances,
  createDistance,
  deleteDistance,
} from "@/api/distances";
import { getLocation, searchLocations } from "@/api/locations";
import { Button } from "@/components/ui/button";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import Autocomplete from "@/components/ui/Autocomplete";
import type { AutocompleteOption } from "@/components/ui/Autocomplete";
import { formatDistance } from "@/lib/format";

interface DistancesTabProps {
  locationId: string;
}

interface LocationDistanceDisplay {
  id: string;
  other_location_id: string;
  other_location_name: string;
  distance: number;
  travel_type: string;
  from_location_id: string;
  to_location_id: string;
}

const TRAVEL_TYPES = ["quantum", "scm", "on_foot"] as const;

export default function DistancesTab({ locationId }: DistancesTabProps) {
  const [distances, setDistances] = useState<LocationDistanceDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Location | null>(null);
  const [newDistance, setNewDistance] = useState<number>(0);
  const [newTravelType, setNewTravelType] = useState<string>("quantum");
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] =
    useState<LocationDistanceDisplay | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDistances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await getLocationDistances(locationId);

      const enriched = await Promise.all(
        raw.map(async (d: LocationDistance) => {
          const otherId =
            d.from_location_id === locationId
              ? d.to_location_id
              : d.from_location_id;

          let otherName = otherId;
          try {
            const loc = await getLocation(otherId);
            otherName = loc.name;
          } catch {
            // fallback to ID
          }

          return {
            id: d.id,
            other_location_id: otherId,
            other_location_name: otherName,
            distance: d.distance,
            travel_type: d.travel_type,
            from_location_id: d.from_location_id,
            to_location_id: d.to_location_id,
          } satisfies LocationDistanceDisplay;
        }),
      );

      enriched.sort((a, b) =>
        a.other_location_name.localeCompare(b.other_location_name),
      );

      setDistances(enriched);
    } catch {
      setError("Failed to load distances");
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadDistances();
  }, [loadDistances]);

  const handleLocationSearch = useCallback(
    async (query: string): Promise<AutocompleteOption[]> => {
      const results = await searchLocations(query);
      return results
        .filter((loc) => loc.id !== locationId)
        .map((loc) => ({
          id: loc.id,
          label: `${loc.name} (${loc.location_type})`,
        }));
    },
    [locationId],
  );

  function handleTargetSelect(id: string, label: string) {
    setSelectedTarget({ id, name: label } as Location);
  }

  function handleTargetClear() {
    setSelectedTarget(null);
  }

  async function handleAddDistance() {
    if (!selectedTarget) return;

    setSaving(true);
    try {
      await createDistance({
        from_location_id: locationId,
        to_location_id: selectedTarget.id,
        distance: newDistance,
        travel_type: newTravelType,
      });

      // Reset form and reload
      setSelectedTarget(null);
      setNewDistance(0);
      setNewTravelType("quantum");
      setShowAddForm(false);
      await loadDistances();
    } catch {
      setError("Failed to add distance");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteDistance(deleteTarget.id);
      setDistances((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete distance");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Loading distances…
      </p>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      {error && (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      )}

      {/* Distance table */}
      {distances.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-muted)]">
              <th className="pb-2 font-medium">Reachable Location</th>
              <th className="pb-2 font-medium">Distance</th>
              <th className="pb-2 font-medium">Travel Type</th>
              <th className="pb-2 font-medium w-12"></th>
            </tr>
          </thead>
          <tbody>
            {distances.map((d) => (
              <tr key={d.id} className="border-b border-[var(--color-border)]">
                <td className="py-3 text-sm">{d.other_location_name}</td>
                <td className="py-3 text-sm">{formatDistance(d.distance)}</td>
                <td className="py-3 text-sm capitalize">{d.travel_type}</td>
                <td className="py-3">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(d)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                    aria-label={`Delete distance to ${d.other_location_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          No distances configured for this location.
        </p>
      )}

      {/* Add distance form */}
      {showAddForm ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
          <h3 className="text-sm font-medium">Add Distance</h3>

          <div>
            <label
              htmlFor="target_location"
              className="block text-sm font-medium mb-1"
            >
              Target Location
            </label>
            <Autocomplete
              id="target_location"
              value={selectedTarget?.id ?? ""}
              displayValue={selectedTarget?.name}
              placeholder="Search location…"
              search={handleLocationSearch}
              onSelect={handleTargetSelect}
              onClear={handleTargetClear}
            />
          </div>

          <div>
            <label
              htmlFor="distance_value"
              className="block text-sm font-medium mb-1"
            >
              Distance (meters)
            </label>
            <input
              id="distance_value"
              type="number"
              min={0}
              value={newDistance}
              onChange={(e) => setNewDistance(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label
              htmlFor="travel_type"
              className="block text-sm font-medium mb-1"
            >
              Travel Type
            </label>
            <select
              id="travel_type"
              value={newTravelType}
              onChange={(e) => setNewTravelType(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              {TRAVEL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddDistance}
              disabled={saving || !selectedTarget}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setSelectedTarget(null);
                setNewDistance(0);
                setNewTravelType("quantum");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4" />
          Add Distance
        </Button>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Distance"
        message={`Are you sure you want to delete the distance to ${deleteTarget?.other_location_name ?? ""}?`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

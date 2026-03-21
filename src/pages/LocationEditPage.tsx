import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import type { LocationCreate } from "@/types/location";
import type { Location } from "@/types/location";
import {
  getLocation,
  createLocation,
  updateLocation,
  searchLocations,
} from "@/api/locations";
import { Button } from "@/components/ui/button";
import SystemSelector from "@/components/location/SystemSelector";
import DistancesTab from "@/components/location/DistancesTab";
import { cn } from "@/lib/utils";

type TabKey = "details" | "distances";

const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "distances", label: "Distances" },
];

const LOCATION_TYPES = [
  "system",
  "planet",
  "moon",
  "station",
  "city",
  "outpost",
] as const;

const LANDING_PAD_SIZES = ["small", "medium", "large", "extra_large"] as const;

const INITIAL_FORM: LocationCreate = {
  name: "",
  location_type: "station",
  parent_id: null,
  coordinates: { x: 0, y: 0, z: 0 },
  has_trade_terminal: false,
  has_landing_pad: false,
  landing_pad_size: null,
};

function validate(form: LocationCreate): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (form.has_landing_pad && !form.landing_pad_size) {
    errors.landing_pad_size = "Landing pad size is required when landing pad is enabled";
  }
  return errors;
}

export default function LocationEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState<LocationCreate>(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  // Parent location search
  const [parentQuery, setParentQuery] = useState("");
  const [parentResults, setParentResults] = useState<Location[]>([]);
  const [parentName, setParentName] = useState<string>("");
  const [showParentDropdown, setShowParentDropdown] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;

    setLoading(true);
    getLocation(id)
      .then((location) => {
        if (cancelled) return;
        setForm({
          name: location.name,
          location_type: location.location_type,
          parent_id: location.parent_id,
          coordinates: location.coordinates,
          has_trade_terminal: location.has_trade_terminal,
          has_landing_pad: location.has_landing_pad,
          landing_pad_size: location.landing_pad_size,
        });
        // Load parent name if parent_id exists
        if (location.parent_id) {
          getLocation(location.parent_id)
            .then((parent) => {
              if (!cancelled) setParentName(parent.name);
            })
            .catch(() => {
              if (!cancelled) setParentName(`(ID: ${location.parent_id})`);
            });
        }
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

  useEffect(() => {
    if (!parentQuery.trim()) {
      setParentResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      searchLocations(parentQuery)
        .then((results) => {
          if (!cancelled) {
            setParentResults(results);
            setShowParentDropdown(true);
          }
        })
        .catch(() => {
          // ignore search errors
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [parentQuery]);

  const handleFieldChange = useCallback(
    <K extends keyof LocationCreate>(key: K, value: LocationCreate[K]) => {
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

  function selectParent(loc: Location) {
    setForm((prev) => ({ ...prev, parent_id: loc.id }));
    setParentName(loc.name);
    setParentQuery("");
    setShowParentDropdown(false);
  }

  function clearParent() {
    setForm((prev) => ({ ...prev, parent_id: null }));
    setParentName("");
    setParentQuery("");
  }

  async function handleSave() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const created = await createLocation(form);
        setToast("Location created successfully");
        setTimeout(() => navigate(`/locations/${created.id}`), 1000);
      } else {
        await updateLocation(id, form);
        setToast("Location saved successfully");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Failed to save location");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading location…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Location Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-4">
          The location you are looking for does not exist.
        </p>
        <Button variant="outline" onClick={() => navigate("/locations")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Locations
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
          className="mb-4 flex items-center gap-2 rounded-md bg-[var(--color-success)]/10 px-4 py-2 text-sm text-[var(--color-success)] border border-[var(--color-success)]/20"
        >
          <CheckCircle className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isNew ? "New Location" : "Edit Location"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/locations")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Tabs (only on edit) */}
      {!isNew && (
        <div className="mb-6 flex gap-1 border-b border-[var(--color-border)]">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2",
                activeTab === key
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Distances Tab (only on edit) */}
      {!isNew && activeTab === "distances" && (
        <DistancesTab locationId={id!} />
      )}

      {/* Details Form */}
      {(isNew || activeTab === "details") && (
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

        {/* Location Type */}
        <div>
          <label
            htmlFor="location_type"
            className="block text-sm font-medium mb-1"
          >
            Location Type
          </label>
          <select
            id="location_type"
            value={form.location_type}
            onChange={(e) => handleFieldChange("location_type", e.target.value)}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Star System Selector */}
        {form.location_type !== "system" && (
          <SystemSelector
            value={form.parent_id}
            onChange={(systemId) =>
              handleFieldChange("parent_id", systemId)
            }
          />
        )}

        {/* Parent Location */}
        <div className="relative">
          <label
            htmlFor="parent_search"
            className="block text-sm font-medium mb-1"
          >
            Parent Location
          </label>
          {form.parent_id ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">{parentName || form.parent_id}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearParent}
                aria-label="Clear parent"
              >
                ✕
              </Button>
            </div>
          ) : (
            <>
              <input
                id="parent_search"
                type="text"
                value={parentQuery}
                onChange={(e) => setParentQuery(e.target.value)}
                placeholder="Search parent location…"
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              {showParentDropdown && parentResults.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute z-10 mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-lg max-h-48 overflow-y-auto"
                >
                  {parentResults.map((loc) => (
                    <li
                      key={loc.id}
                      role="option"
                      aria-selected={false}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-accent)]/10"
                      onClick={() => selectParent(loc)}
                    >
                      {loc.name}{" "}
                      <span className="text-[var(--color-text-muted)]">
                        ({loc.location_type})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Coordinates */}
        <fieldset>
          <legend className="block text-sm font-medium mb-1">
            Coordinates
          </legend>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="coord_x" className="block text-xs mb-1">
                X
              </label>
              <input
                id="coord_x"
                type="number"
                value={form.coordinates.x}
                onChange={(e) =>
                  handleFieldChange("coordinates", {
                    ...form.coordinates,
                    x: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label htmlFor="coord_y" className="block text-xs mb-1">
                Y
              </label>
              <input
                id="coord_y"
                type="number"
                value={form.coordinates.y}
                onChange={(e) =>
                  handleFieldChange("coordinates", {
                    ...form.coordinates,
                    y: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label htmlFor="coord_z" className="block text-xs mb-1">
                Z
              </label>
              <input
                id="coord_z"
                type="number"
                value={form.coordinates.z}
                onChange={(e) =>
                  handleFieldChange("coordinates", {
                    ...form.coordinates,
                    z: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>
        </fieldset>

        {/* Has Trade Terminal */}
        <div className="flex items-center gap-2">
          <input
            id="has_trade_terminal"
            type="checkbox"
            checked={form.has_trade_terminal}
            onChange={(e) =>
              handleFieldChange("has_trade_terminal", e.target.checked)
            }
            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
          />
          <label htmlFor="has_trade_terminal" className="text-sm font-medium">
            Has trade terminal
          </label>
        </div>

        {/* Has Landing Pad */}
        <div className="flex items-center gap-2">
          <input
            id="has_landing_pad"
            type="checkbox"
            checked={form.has_landing_pad}
            onChange={(e) => {
              const checked = e.target.checked;
              setForm((prev) => ({
                ...prev,
                has_landing_pad: checked,
                landing_pad_size: checked ? prev.landing_pad_size : null,
              }));
              if (!checked) {
                setErrors((prev) => {
                  if (prev.landing_pad_size) {
                    const next = { ...prev };
                    delete next.landing_pad_size;
                    return next;
                  }
                  return prev;
                });
              }
            }}
            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
          />
          <label htmlFor="has_landing_pad" className="text-sm font-medium">
            Has landing pad
          </label>
        </div>

        {/* Landing Pad Size */}
        {form.has_landing_pad && (
          <div>
            <label
              htmlFor="landing_pad_size"
              className="block text-sm font-medium mb-1"
            >
              Landing Pad Size
            </label>
            <select
              id="landing_pad_size"
              value={form.landing_pad_size ?? ""}
              onChange={(e) =>
                handleFieldChange(
                  "landing_pad_size",
                  e.target.value || null,
                )
              }
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              <option value="">Select size…</option>
              {LANDING_PAD_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.landing_pad_size && (
              <p className="mt-1 text-xs text-[var(--color-danger)]">
                {errors.landing_pad_size}
              </p>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

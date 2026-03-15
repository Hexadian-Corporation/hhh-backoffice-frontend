import { useCallback, useEffect, useState } from "react";
import type { HaulingOrder } from "@/types/contract";
import { Button } from "@/components/ui/button";
import Autocomplete from "@/components/ui/Autocomplete";
import type { AutocompleteOption } from "@/components/ui/Autocomplete";
import { searchLocations, getLocation } from "@/api/locations";
import { Trash2, Plus } from "lucide-react";

interface HaulingOrdersTabProps {
  orders: HaulingOrder[];
  errors: Record<string, string>;
  onUpdate: (orders: HaulingOrder[]) => void;
}

const EMPTY_ORDER: HaulingOrder = {
  commodity: "",
  scu_min: 0,
  scu_max: 0,
  max_container_scu: 0,
  pickup_location_id: "",
  delivery_location_id: "",
};

export default function HaulingOrdersTab({
  orders,
  errors,
  onUpdate,
}: HaulingOrdersTabProps) {
  const [locationNames, setLocationNames] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const idsToResolve = new Set<string>();
    for (const order of orders) {
      if (order.pickup_location_id && !locationNames[order.pickup_location_id])
        idsToResolve.add(order.pickup_location_id);
      if (
        order.delivery_location_id &&
        !locationNames[order.delivery_location_id]
      )
        idsToResolve.add(order.delivery_location_id);
    }

    if (idsToResolve.size === 0) return;

    let cancelled = false;
    for (const locId of idsToResolve) {
      getLocation(locId)
        .then((loc) => {
          if (!cancelled) {
            setLocationNames((prev) => ({
              ...prev,
              [loc.id]: `${loc.name} (${loc.location_type})`,
            }));
          }
        })
        .catch(() => {
          // ignore resolution errors
        });
    }

    return () => {
      cancelled = true;
    };
    // Only resolve on mount / when order IDs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.map((o) => `${o.pickup_location_id}:${o.delivery_location_id}`).join(",")]);

  const handleLocationSearch = useCallback(
    async (query: string): Promise<AutocompleteOption[]> => {
      const locations = await searchLocations(query);
      return locations.map((loc) => ({
        id: loc.id,
        label: `${loc.name} (${loc.location_type})`,
      }));
    },
    [],
  );

  function addOrder() {
    onUpdate([...orders, { ...EMPTY_ORDER }]);
  }

  function removeOrder(index: number) {
    onUpdate(orders.filter((_, i) => i !== index));
  }

  function updateField(
    index: number,
    field: keyof HaulingOrder,
    value: string | number,
  ) {
    const updated = orders.map((o, i) =>
      i === index ? { ...o, [field]: value } : o,
    );
    onUpdate(updated);
  }

  function handleLocationSelect(
    index: number,
    field: "pickup_location_id" | "delivery_location_id",
    id: string,
    label: string,
  ) {
    updateField(index, field, id);
    setLocationNames((prev) => ({ ...prev, [id]: label }));
  }

  function handleLocationClear(
    index: number,
    field: "pickup_location_id" | "delivery_location_id",
  ) {
    updateField(index, field, "");
  }

  return (
    <div className="space-y-4">
      {errors.hauling_orders && (
        <p className="text-xs text-[var(--color-danger)]">
          {errors.hauling_orders}
        </p>
      )}

      {orders.map((order, index) => (
        <div
          key={index}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Order #{index + 1}</span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeOrder(index)}
              aria-label={`Remove order ${index + 1}`}
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`commodity_${index}`}
                className="block text-sm font-medium mb-1"
              >
                Commodity
              </label>
              <input
                id={`commodity_${index}`}
                type="text"
                value={order.commodity}
                onChange={(e) =>
                  updateField(index, "commodity", e.target.value)
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              {errors[`hauling_orders.${index}.commodity`] && (
                <p className="mt-1 text-xs text-[var(--color-danger)]">
                  {errors[`hauling_orders.${index}.commodity`]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`scu_min_${index}`}
                className="block text-sm font-medium mb-1"
              >
                SCU Min
              </label>
              <input
                id={`scu_min_${index}`}
                type="number"
                min={0}
                value={order.scu_min}
                onChange={(e) =>
                  updateField(index, "scu_min", Number(e.target.value))
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label
                htmlFor={`scu_max_${index}`}
                className="block text-sm font-medium mb-1"
              >
                SCU Max
              </label>
              <input
                id={`scu_max_${index}`}
                type="number"
                min={0}
                value={order.scu_max}
                onChange={(e) =>
                  updateField(index, "scu_max", Number(e.target.value))
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label
                htmlFor={`max_container_scu_${index}`}
                className="block text-sm font-medium mb-1"
              >
                Max Container SCU
              </label>
              <input
                id={`max_container_scu_${index}`}
                type="number"
                min={0}
                value={order.max_container_scu}
                onChange={(e) =>
                  updateField(
                    index,
                    "max_container_scu",
                    Number(e.target.value),
                  )
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label
                htmlFor={`pickup_location_id_${index}`}
                className="block text-sm font-medium mb-1"
              >
                Pickup Location
              </label>
              <Autocomplete
                id={`pickup_location_id_${index}`}
                value={order.pickup_location_id}
                displayValue={locationNames[order.pickup_location_id]}
                placeholder="Search pickup location…"
                search={handleLocationSearch}
                onSelect={(id, label) =>
                  handleLocationSelect(
                    index,
                    "pickup_location_id",
                    id,
                    label,
                  )
                }
                onClear={() =>
                  handleLocationClear(index, "pickup_location_id")
                }
              />
              {errors[`hauling_orders.${index}.pickup_location_id`] && (
                <p className="mt-1 text-xs text-[var(--color-danger)]">
                  {errors[`hauling_orders.${index}.pickup_location_id`]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`delivery_location_id_${index}`}
                className="block text-sm font-medium mb-1"
              >
                Delivery Location
              </label>
              <Autocomplete
                id={`delivery_location_id_${index}`}
                value={order.delivery_location_id}
                displayValue={locationNames[order.delivery_location_id]}
                placeholder="Search delivery location…"
                search={handleLocationSearch}
                onSelect={(id, label) =>
                  handleLocationSelect(
                    index,
                    "delivery_location_id",
                    id,
                    label,
                  )
                }
                onClear={() =>
                  handleLocationClear(index, "delivery_location_id")
                }
              />
              {errors[`hauling_orders.${index}.delivery_location_id`] && (
                <p className="mt-1 text-xs text-[var(--color-danger)]">
                  {errors[`hauling_orders.${index}.delivery_location_id`]}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addOrder}>
        <Plus className="h-4 w-4" />
        Add Order
      </Button>
    </div>
  );
}

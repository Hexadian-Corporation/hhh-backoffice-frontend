import type { HaulingOrder } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

interface HaulingOrdersTabProps {
  orders: HaulingOrder[];
  errors: Record<string, string>;
  onUpdate: (orders: HaulingOrder[]) => void;
}

const EMPTY_ORDER: HaulingOrder = {
  cargo_name: "",
  cargo_quantity_scu: 0,
  pickup_location_id: "",
  delivery_location_id: "",
};

export default function HaulingOrdersTab({
  orders,
  errors,
  onUpdate,
}: HaulingOrdersTabProps) {
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
                htmlFor={`cargo_name_${index}`}
                className="block text-sm font-medium mb-1"
              >
                Cargo Name
              </label>
              <input
                id={`cargo_name_${index}`}
                type="text"
                value={order.cargo_name}
                onChange={(e) =>
                  updateField(index, "cargo_name", e.target.value)
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              {errors[`hauling_orders.${index}.cargo_name`] && (
                <p className="mt-1 text-xs text-[var(--color-danger)]">
                  {errors[`hauling_orders.${index}.cargo_name`]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`cargo_quantity_scu_${index}`}
                className="block text-sm font-medium mb-1"
              >
                Quantity (SCU)
              </label>
              <input
                id={`cargo_quantity_scu_${index}`}
                type="number"
                min={0}
                value={order.cargo_quantity_scu}
                onChange={(e) =>
                  updateField(
                    index,
                    "cargo_quantity_scu",
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
                Pickup Location ID
              </label>
              <input
                id={`pickup_location_id_${index}`}
                type="text"
                value={order.pickup_location_id}
                onChange={(e) =>
                  updateField(index, "pickup_location_id", e.target.value)
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
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
                Delivery Location ID
              </label>
              <input
                id={`delivery_location_id_${index}`}
                type="text"
                value={order.delivery_location_id}
                onChange={(e) =>
                  updateField(index, "delivery_location_id", e.target.value)
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
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

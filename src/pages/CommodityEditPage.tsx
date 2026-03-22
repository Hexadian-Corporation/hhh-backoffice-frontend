import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import type { CommodityCreate } from "@/types/commodity";
import {
  getCommodity,
  createCommodity,
  updateCommodity,
} from "@/api/commodities";
import { Button } from "@/components/ui/button";

const INITIAL_FORM: CommodityCreate = {
  name: "",
  code: "",
  category: "",
  price_buy: 0,
  price_sell: 0,
};

function validate(form: CommodityCreate): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.code.trim()) errors.code = "Code is required";
  return errors;
}

export default function CommodityEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState<CommodityCreate>(INITIAL_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;

    setLoading(true);
    getCommodity(id)
      .then((commodity) => {
        if (cancelled) return;
        setForm({
          name: commodity.name,
          code: commodity.code,
          category: commodity.category ?? "",
          price_buy: commodity.price_buy ?? 0,
          price_sell: commodity.price_sell ?? 0,
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
    <K extends keyof CommodityCreate>(key: K, value: CommodityCreate[K]) => {
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

  async function handleSave() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const created = await createCommodity(form);
        setToast("Commodity created successfully");
        setTimeout(() => navigate(`/commodities/${created.id}`), 1000);
      } else {
        await updateCommodity(id, form);
        setToast("Commodity saved successfully");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Failed to save commodity");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading commodity…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Commodity Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-4">
          The commodity you are looking for does not exist.
        </p>
        <Button variant="outline" onClick={() => navigate("/commodities")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Commodities
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
          {isNew ? "New Commodity" : "Edit Commodity"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/commodities")}>
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

        {/* Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium mb-1">
            Code
          </label>
          <input
            id="code"
            type="text"
            value={form.code}
            onChange={(e) =>
              handleFieldChange("code", e.target.value.toUpperCase())
            }
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          {errors.code && (
            <p className="mt-1 text-xs text-[var(--color-danger)]">
              {errors.code}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category
          </label>
          <input
            id="category"
            type="text"
            value={form.category ?? ""}
            onChange={(e) => handleFieldChange("category", e.target.value)}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>

        {/* Price Buy */}
        <div>
          <label htmlFor="price_buy" className="block text-sm font-medium mb-1">
            Buy Price (UEC/SCU)
          </label>
          <input
            id="price_buy"
            type="number"
            min={0}
            step={0.01}
            value={form.price_buy ?? 0}
            onChange={(e) =>
              handleFieldChange("price_buy", parseFloat(e.target.value) || 0)
            }
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>

        {/* Price Sell */}
        <div>
          <label htmlFor="price_sell" className="block text-sm font-medium mb-1">
            Sell Price (UEC/SCU)
          </label>
          <input
            id="price_sell"
            type="number"
            min={0}
            step={0.01}
            value={form.price_sell ?? 0}
            onChange={(e) =>
              handleFieldChange("price_sell", parseFloat(e.target.value) || 0)
            }
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>
    </div>
  );
}

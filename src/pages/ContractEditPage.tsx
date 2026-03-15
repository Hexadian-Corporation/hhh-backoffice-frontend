import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, CheckCircle, Trash2, AlertCircle } from "lucide-react";
import type { ContractCreate, HaulingOrder, Requirements } from "@/types/contract";
import { getContract, updateContract, deleteContract } from "@/api/contracts";
import { Button } from "@/components/ui/button";
import GeneralTab from "@/components/contract/GeneralTab";
import HaulingOrdersTab from "@/components/contract/HaulingOrdersTab";
import RequirementsTab from "@/components/contract/RequirementsTab";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { cn } from "@/lib/utils";

type TabKey = "general" | "hauling" | "requirements";

const TABS: { key: TabKey; label: string }[] = [
  { key: "general", label: "General" },
  { key: "hauling", label: "Hauling Orders" },
  { key: "requirements", label: "Requirements" },
];

const INITIAL_FORM: ContractCreate = {
  title: "",
  description: "",
  faction: "",
  status: "draft",
  hauling_orders: [
    {
      commodity_id: "",
      scu_min: 0,
      scu_max: 0,
      max_container_scu: 0,
      pickup_location_id: "",
      delivery_location_id: "",
    },
  ],
  reward_uec: 0,
  collateral_uec: 0,
  deadline: "",
  requirements: {
    min_reputation: 0,
    required_ship_tags: [],
    max_crew_size: null,
  },
};

function validate(form: ContractCreate): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.description.trim()) errors.description = "Description is required";
  if (!form.faction.trim()) errors.faction = "Faction is required";
  if (form.reward_uec < 0) errors.reward_uec = "Reward must be ≥ 0";
  if (form.collateral_uec < 0)
    errors.collateral_uec = "Collateral must be ≥ 0";
  if (!form.deadline.trim()) errors.deadline = "Deadline is required";

  if (form.hauling_orders.length === 0)
    errors.hauling_orders = "At least 1 hauling order is required";

  form.hauling_orders.forEach((order, i) => {
    if (!order.commodity_id.trim())
      errors[`hauling_orders.${i}.commodity_id`] = "Commodity is required";
    if (!order.pickup_location_id.trim())
      errors[`hauling_orders.${i}.pickup_location_id`] =
        "Pickup location is required";
    if (!order.delivery_location_id.trim())
      errors[`hauling_orders.${i}.delivery_location_id`] =
        "Delivery location is required";
  });

  if (
    form.requirements.min_reputation < 0 ||
    form.requirements.min_reputation > 5
  )
    errors.min_reputation = "Reputation must be 0–5";

  return errors;
}

export default function ContractEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<ContractCreate>(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    getContract(id)
      .then((contract) => {
        if (cancelled) return;
        setForm({
          title: contract.title,
          description: contract.description,
          faction: contract.faction,
          status: contract.status,
          hauling_orders: contract.hauling_orders,
          reward_uec: contract.reward_uec,
          collateral_uec: contract.collateral_uec,
          deadline: contract.deadline,
          requirements: contract.requirements,
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
  }, [id]);

  const handleFieldChange = useCallback(
    <K extends keyof ContractCreate>(key: K, value: ContractCreate[K]) => {
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

  const handleHaulingUpdate = useCallback((orders: HaulingOrder[]) => {
    setForm((prev) => ({ ...prev, hauling_orders: orders }));
    setErrors((prev) => {
      if (prev.hauling_orders) {
        const next = { ...prev };
        delete next.hauling_orders;
        return next;
      }
      return prev;
    });
  }, []);

  const handleRequirementsChange = useCallback((requirements: Requirements) => {
    setForm((prev) => ({ ...prev, requirements }));
  }, []);

  async function handleSave() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await updateContract(id!, form);
      setToast({ message: "Contract saved successfully", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ message: "Failed to save contract", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteContract(id!);
      navigate("/contracts");
    } catch {
      setDeleteDialogOpen(false);
      setToast({ message: "Failed to delete contract", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-muted)]">Loading contract…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Contract Not Found</h1>
        <p className="text-[var(--color-text-muted)] mb-4">
          The contract you are looking for does not exist.
        </p>
        <Button variant="outline" onClick={() => navigate("/contracts")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
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
          className={`mb-4 flex items-center gap-2 rounded-md px-4 py-2 text-sm border ${
            toast.type === "success"
              ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20"
              : "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Contract</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/contracts")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            className="border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab Content */}
      <div className="max-w-2xl">
        {activeTab === "general" && (
          <GeneralTab form={form} errors={errors} onChange={handleFieldChange} />
        )}
        {activeTab === "hauling" && (
          <HaulingOrdersTab
            orders={form.hauling_orders}
            errors={errors}
            onUpdate={handleHaulingUpdate}
          />
        )}
        {activeTab === "requirements" && (
          <RequirementsTab
            requirements={form.requirements}
            errors={errors}
            onChange={handleRequirementsChange}
          />
        )}
      </div>

      {/* Confirmation dialog for delete */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete '${form.title}'? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}

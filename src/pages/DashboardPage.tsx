import { useEffect, useState } from "react";
import { Link } from "react-router";
import { FileText, MapPin, Package, Plus } from "lucide-react";
import { listContracts } from "@/api/contracts";
import { listLocations } from "@/api/locations";
import { listCommodities } from "@/api/commodities";
import type { Contract } from "@/types/contract";
import type { Location } from "@/types/location";
import type { Commodity } from "@/types/commodity";
import KpiCard from "@/components/dashboard/KpiCard";
import HealthPanel from "@/components/dashboard/HealthPanel";

interface KpiState<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
}

export default function DashboardPage() {
  const [contracts, setContracts] = useState<KpiState<Contract>>({ data: null, loading: true, error: null });
  const [locations, setLocations] = useState<KpiState<Location>>({ data: null, loading: true, error: null });
  const [commodities, setCommodities] = useState<KpiState<Commodity>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    listContracts()
      .then((data) => { if (!cancelled) setContracts({ data, loading: false, error: null }); })
      .catch((err: unknown) => { if (!cancelled) setContracts({ data: null, loading: false, error: err instanceof Error ? err.message : "Failed to load" }); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listLocations()
      .then((data) => { if (!cancelled) setLocations({ data, loading: false, error: null }); })
      .catch((err: unknown) => { if (!cancelled) setLocations({ data: null, loading: false, error: err instanceof Error ? err.message : "Failed to load" }); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listCommodities()
      .then((data) => { if (!cancelled) setCommodities({ data, loading: false, error: null }); })
      .catch((err: unknown) => { if (!cancelled) setCommodities({ data: null, loading: false, error: err instanceof Error ? err.message : "Failed to load" }); });
    return () => { cancelled = true; };
  }, []);

  const contractBreakdown = contracts.data
    ? (["draft", "active", "expired", "cancelled"] as const).map((s) => ({
        label: s,
        count: contracts.data!.filter((c) => c.status === s).length,
      }))
    : undefined;

  const locationBreakdown = locations.data
    ? ["system", "planet", "moon", "station", "city", "outpost"].map((t) => ({
        label: t,
        count: locations.data!.filter((l) => l.location_type === t).length,
      }))
    : undefined;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-[var(--color-text-muted)]">Welcome to the H³ Backoffice.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Contracts"
          count={contracts.data?.length ?? null}
          icon={<FileText className="h-5 w-5" />}
          href="/contracts"
          loading={contracts.loading}
          error={contracts.error}
          breakdown={contractBreakdown}
        />
        <KpiCard
          title="Locations"
          count={locations.data?.length ?? null}
          icon={<MapPin className="h-5 w-5" />}
          href="/locations"
          loading={locations.loading}
          error={locations.error}
          breakdown={locationBreakdown}
        />
        <KpiCard
          title="Commodities"
          count={commodities.data?.length ?? null}
          icon={<Package className="h-5 w-5" />}
          href="/commodities"
          loading={commodities.loading}
          error={commodities.error}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/contracts/new"
          className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium transition-all hover:border-[var(--color-accent)]/50 hover:shadow-[0_0_12px_var(--color-glow)]"
        >
          <Plus className="h-4 w-4" /> New Contract
        </Link>
        <Link
          to="/locations/new"
          className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium transition-all hover:border-[var(--color-accent)]/50 hover:shadow-[0_0_12px_var(--color-glow)]"
        >
          <Plus className="h-4 w-4" /> New Location
        </Link>
        <Link
          to="/commodities/new"
          className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium transition-all hover:border-[var(--color-accent)]/50 hover:shadow-[0_0_12px_var(--color-glow)]"
        >
          <Plus className="h-4 w-4" /> New Commodity
        </Link>
      </div>

      {/* System Health */}
      <HealthPanel />
    </div>
  );
}

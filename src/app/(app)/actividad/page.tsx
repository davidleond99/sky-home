import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AuditFilters } from "@/features/audit/components/audit-filters";
import { AuditTable } from "@/features/audit/components/audit-table";
import { listAuditLog } from "@/features/audit/queries";
import { auditFiltersSchema } from "@/features/audit/schemas";
import { listHouseholdUsers } from "@/features/users/queries";

export const metadata: Metadata = { title: "Actividad" };

export default async function ActividadPage({ searchParams }: PageProps<"/actividad">) {
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])),
  );
  const filters = auditFiltersSchema.parse(flat);
  const [{ rows, hasMore }, users] = await Promise.all([
    listAuditLog(filters),
    listHouseholdUsers(),
  ]);

  return (
    <>
      <PageHeader
        title="Actividad"
        description="Traza de todo lo que hace cada persona en SkyHome"
      />
      <AuditFilters users={users} />
      <AuditTable rows={rows} page={filters.page} hasMore={hasMore} searchParams={flat} />
    </>
  );
}

import type { Metadata } from "next";
import { TableSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AuditFilters } from "@/features/audit/components/audit-filters";
import { AuditTable } from "@/features/audit/components/audit-table";
import { listAuditLog } from "@/features/audit/queries";
import { auditFiltersSchema } from "@/features/audit/schemas";
import { listHouseholdUsers } from "@/features/users/queries";
import { flattenSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Actividad" };

async function ActividadContent({ searchParams }: PageProps<"/actividad">) {
  const flat = flattenSearchParams(await searchParams);
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

/**
 * La sesión y los datos se leen dentro de <Suspense>: así las navegaciones
 * (incluido cambiar filtros en la misma página) muestran el esqueleto al instante.
 */
export default function ActividadPage(props: PageProps<"/actividad">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ActividadContent {...props} />
    </Suspense>
  );
}

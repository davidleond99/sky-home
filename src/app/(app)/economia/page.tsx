import type { Metadata } from "next";
import { TableSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { PaginationLinks } from "@/components/pagination-links";
import { CatalogOptionsProvider } from "@/features/economia/components/catalog-options";
import { EconomiaFilters } from "@/features/economia/components/economia-filters";
import { MovementsTable } from "@/features/economia/components/movements-table";
import {
  listActiveCategories,
  listMovements,
  listProductOptions,
  movementFiltersSchema,
} from "@/features/economia/queries";
import { listHouseholdUsers } from "@/features/users/queries";
import { flattenSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Economía" };

async function MovimientosContent({ searchParams }: PageProps<"/economia">) {
  const flat = flattenSearchParams(await searchParams);
  const filters = movementFiltersSchema.parse(flat);
  const [{ rows, hasMore }, users, categories, products] = await Promise.all([
    listMovements(filters),
    listHouseholdUsers(),
    listActiveCategories(),
    listProductOptions(),
  ]);

  return (
    <CatalogOptionsProvider products={products} categories={categories}>
      <EconomiaFilters users={users} categories={categories} withKind />
      <MovementsTable rows={rows} />
      <PaginationLinks page={filters.page} hasMore={hasMore} searchParams={flat} />
    </CatalogOptionsProvider>
  );
}

/**
 * La sesión y los datos se leen dentro de <Suspense>: así las navegaciones
 * (incluido cambiar filtros en la misma página) muestran el esqueleto al instante.
 */
export default function MovimientosPage(props: PageProps<"/economia">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <MovimientosContent {...props} />
    </Suspense>
  );
}

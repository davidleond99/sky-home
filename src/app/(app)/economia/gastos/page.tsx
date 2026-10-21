import type { Metadata } from "next";
import { TableSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { PaginationLinks } from "@/components/pagination-links";
import { CatalogOptionsProvider } from "@/features/economia/components/catalog-options";
import { EconomiaFilters } from "@/features/economia/components/economia-filters";
import { ExpensesTable } from "@/features/economia/components/expenses-table";
import {
  listActiveCategories,
  listExpenses,
  listProductOptions,
  movementFiltersSchema,
} from "@/features/economia/queries";
import { listHouseholdUsers } from "@/features/users/queries";
import { flattenSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Gastos" };

async function GastosContent({ searchParams }: PageProps<"/economia/gastos">) {
  const flat = flattenSearchParams(await searchParams);
  const filters = movementFiltersSchema.parse(flat);
  const [{ rows, totals, pages }, users, categories, products] = await Promise.all([
    listExpenses(filters, "CUP"),
    listHouseholdUsers(),
    listActiveCategories(),
    listProductOptions(),
  ]);

  return (
    <CatalogOptionsProvider products={products} categories={categories}>
      <EconomiaFilters users={users} categories={categories} />
      <ExpensesTable rows={rows} totals={totals} currency="CUP" />
      <PaginationLinks page={filters.page} pages={pages} searchParams={flat} />
    </CatalogOptionsProvider>
  );
}

/**
 * La sesión y los datos se leen dentro de <Suspense>: así las navegaciones
 * (incluido cambiar filtros en la misma página) muestran el esqueleto al instante.
 */
export default function GastosPage(props: PageProps<"/economia/gastos">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <GastosContent {...props} />
    </Suspense>
  );
}

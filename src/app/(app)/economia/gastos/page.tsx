import type { Metadata } from "next";
import { TableSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { PaginationLinks } from "@/components/pagination-links";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CatalogOptionsProvider } from "@/features/economia/components/catalog-options";
import { EconomiaFilters } from "@/features/economia/components/economia-filters";
import { ExpenseRowActions } from "@/features/economia/components/row-actions";
import {
  listActiveCategories,
  listExpenses,
  listProductOptions,
  movementFiltersSchema,
} from "@/features/economia/queries";
import { listHouseholdUsers } from "@/features/users/queries";
import { formatDay } from "@/lib/dates";
import { formatCup, formatNumber } from "@/lib/money";
import { flattenSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Gastos" };

async function GastosContent({ searchParams }: PageProps<"/economia/gastos">) {
  const flat = flattenSearchParams(await searchParams);
  const filters = movementFiltersSchema.parse(flat);
  const [{ rows, totals, pages }, users, categories, products] = await Promise.all([
    listExpenses(filters),
    listHouseholdUsers(),
    listActiveCategories(),
    listProductOptions(),
  ]);

  return (
    <CatalogOptionsProvider products={products} categories={categories}>
      <EconomiaFilters users={users} categories={categories} />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Persona</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground h-24 text-center">
                  No hay gastos en este periodo.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{formatDay(r.occurredOn)}</TableCell>
                <TableCell>
                  {r.productName}
                  {r.note && <p className="text-muted-foreground text-xs">{r.note}</p>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{r.categoryName}</Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatNumber(r.quantity)} {r.unit}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatCup(r.unitPrice)}
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                  {formatCup(r.total)}
                </TableCell>
                <TableCell className="whitespace-nowrap">{r.userName}</TableCell>
                <TableCell>
                  <ExpenseRowActions expense={r} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {totals.count > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>
                  Total ({totals.count} {totals.count === 1 ? "gasto" : "gastos"})
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatCup(totals.cup)}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
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

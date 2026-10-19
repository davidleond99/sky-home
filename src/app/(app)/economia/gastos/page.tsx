import type { Metadata } from "next";
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
import { formatCup, formatNumber, sumMoney } from "@/lib/money";
import { flattenSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Gastos" };

export default async function GastosPage({ searchParams }: PageProps<"/economia/gastos">) {
  const filters = movementFiltersSchema.parse(flattenSearchParams(await searchParams));
  const [rows, users, categories, products] = await Promise.all([
    listExpenses(filters),
    listHouseholdUsers(),
    listActiveCategories(),
    listProductOptions(),
  ]);
  const total = sumMoney(rows.map((r) => r.total));

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
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>Total ({rows.length} gastos)</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatCup(total)}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </CatalogOptionsProvider>
  );
}

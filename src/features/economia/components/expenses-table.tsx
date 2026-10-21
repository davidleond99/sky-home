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
import { formatDay } from "@/lib/dates";
import { type Currency, formatCup, formatMoney, formatNumber } from "@/lib/money";
import type { ExpenseListItem, listExpenses } from "../queries";
import { ExpenseRowActions } from "./row-actions";

type Totals = Awaited<ReturnType<typeof listExpenses>>["totals"];

/** Tabla de gastos de una moneda. En USD añade la tasa y el equivalente en CUP. */
export function ExpensesTable({
  rows,
  totals,
  currency,
}: {
  rows: ExpenseListItem[];
  totals: Totals;
  currency: Currency;
}) {
  const usd = currency === "USD";
  const columns = usd ? 10 : 8;
  return (
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
            {usd && <TableHead className="text-right">Tasa</TableHead>}
            {usd && <TableHead className="text-right">≈ CUP</TableHead>}
            <TableHead>Persona</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns} className="text-muted-foreground h-24 text-center">
                {usd ? "No hay gastos en USD en este periodo." : "No hay gastos en este periodo."}
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
                {formatMoney(r.unitPrice, currency)}
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                {formatMoney(r.total, currency)}
              </TableCell>
              {usd && (
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {r.rate === null ? "—" : formatNumber(r.rate, 2)}
                </TableCell>
              )}
              {usd && (
                <TableCell className="text-muted-foreground text-right whitespace-nowrap tabular-nums">
                  {r.cupEquivalent === null ? "—" : formatCup(r.cupEquivalent)}
                </TableCell>
              )}
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
              <TableCell
                className="text-right whitespace-nowrap tabular-nums"
                data-testid="expenses-total"
              >
                {formatMoney(totals.amount, currency)}
              </TableCell>
              {usd && <TableCell />}
              {usd && (
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatCup(totals.cupEquivalent)}
                </TableCell>
              )}
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

import type { Metadata } from "next";
import { TableSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EconomiaFilters } from "@/features/economia/components/economia-filters";
import { ExchangeRowActions } from "@/features/economia/components/row-actions";
import { listExchanges, movementFiltersSchema } from "@/features/economia/queries";
import { listHouseholdUsers } from "@/features/users/queries";
import { formatDay } from "@/lib/dates";
import { formatCup, formatNumber, formatUsd, sumMoney } from "@/lib/money";
import { flattenSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Ventas de USD" };

async function VentasContent({ searchParams }: PageProps<"/economia/ventas">) {
  const filters = movementFiltersSchema.parse(flattenSearchParams(await searchParams));
  const [rows, users] = await Promise.all([listExchanges(filters), listHouseholdUsers()]);

  const usd = sumMoney(rows.map((r) => r.usdAmount));
  const cup = sumMoney(rows.map((r) => r.cupAmount));
  const avgRate = usd > 0 ? cup / usd : 0;

  return (
    <>
      <EconomiaFilters users={users} />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">USD</TableHead>
              <TableHead className="text-right">Tasa</TableHead>
              <TableHead className="text-right">CUP recibidos</TableHead>
              <TableHead>Persona</TableHead>
              <TableHead className="w-full">Nota</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                  No hay ventas de USD en este periodo.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{formatDay(r.occurredOn)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(r.usdAmount)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(r.rate, 2)}</TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                  {formatCup(r.cupAmount)}
                </TableCell>
                <TableCell className="whitespace-nowrap">{r.userName}</TableCell>
                <TableCell className="text-muted-foreground">{r.note}</TableCell>
                <TableCell>
                  <ExchangeRowActions exchange={r} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(usd)}</TableCell>
                <TableCell className="text-right tabular-nums" title="Tasa media ponderada">
                  ⌀ {formatNumber(avgRate, 2)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatCup(cup)}
                </TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </>
  );
}

/**
 * La sesión y los datos se leen dentro de <Suspense>: así las navegaciones
 * (incluido cambiar filtros en la misma página) muestran el esqueleto al instante.
 */
export default function VentasPage(props: PageProps<"/economia/ventas">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <VentasContent {...props} />
    </Suspense>
  );
}

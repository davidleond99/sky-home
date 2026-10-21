import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDay } from "@/lib/dates";
import { formatCup, formatNumber, formatUsd } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PriceComparison, PriceSide, Verdict } from "../comparison";

const percent = (diff: number) =>
  `${diff > 0 ? "+" : "−"}${formatNumber(Math.abs(diff) * 100, 1)} %`;

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  if (verdict.cheaper === "equal") return <Badge variant="secondary">Mismo precio</Badge>;
  return (
    <div className="flex flex-col items-end gap-1">
      <Badge
        className={cn(
          verdict.cheaper === "USD"
            ? "bg-emerald-600 text-white dark:bg-emerald-500"
            : "bg-sky-600 text-white dark:bg-sky-500",
        )}
      >
        Más barato en {verdict.cheaper}
      </Badge>
      <span className="text-muted-foreground text-xs tabular-nums">
        USD {percent(verdict.diff)} vs CUP
      </span>
    </div>
  );
}

function CupCell({ side, unit }: { side: PriceSide | null; unit: string }) {
  if (!side) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col items-end">
      <span className="font-medium">
        {formatCup(side.avgPrice)} / {unit}
      </span>
      <span className="text-muted-foreground text-xs">
        último {formatCup(side.last.price)} · {formatDay(side.last.occurredOn)}
      </span>
    </div>
  );
}

function UsdCell({ side, unit }: { side: PriceSide | null; unit: string }) {
  if (!side) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col items-end">
      <span className="font-medium">
        {formatUsd(side.avgPrice)} / {unit}
        <span className="text-muted-foreground font-normal"> ≈ {formatCup(side.avgCup)}</span>
      </span>
      <span className="text-muted-foreground text-xs">
        último {formatUsd(side.last.price)}
        {side.last.rate !== null && ` a ${formatNumber(side.last.rate, 2)}`} ·{" "}
        {formatDay(side.last.occurredOn)}
      </span>
    </div>
  );
}

/** Precio medio por producto en cada moneda y cuál salió más barato (USD llevado a CUP). */
export function ComparisonTable({ rows }: { rows: PriceComparison[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">En CUP</TableHead>
            <TableHead className="text-right">En USD</TableHead>
            <TableHead className="text-right">Resultado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                No hay compras en este periodo.
              </TableCell>
            </TableRow>
          )}
          {rows.map((r) => (
            <TableRow
              key={`${r.productId}-${r.unit}`}
              className={cn(!r.verdict && "text-muted-foreground")}
              data-testid="comparison-row"
            >
              <TableCell>
                <p className={cn("font-medium", !r.verdict && "font-normal")}>{r.productName}</p>
                <p className="text-muted-foreground text-xs">{r.categoryName}</p>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                <CupCell side={r.cup} unit={r.unit} />
              </TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                <UsdCell side={r.usd} unit={r.unit} />
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {r.verdict ? (
                  <VerdictBadge verdict={r.verdict} />
                ) : (
                  <Badge variant="outline">solo {r.cup ? "CUP" : "USD"}</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

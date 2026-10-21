import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Currency, formatMoney, formatNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Dashboard } from "../queries";

type SpendingKpis = Pick<Dashboard["kpis"], "dailyAverage" | "prevDailyAverage" | "days">;

export function DailyAverage({
  kpis,
  currency = "CUP",
}: {
  kpis: SpendingKpis;
  currency?: Currency;
}) {
  const { dailyAverage, prevDailyAverage, days } = kpis;
  // Sin periodo anterior (o sin gasto en él) no hay contra qué comparar.
  const change =
    prevDailyAverage && prevDailyAverage > 0
      ? ((dailyAverage - prevDailyAverage) / prevDailyAverage) * 100
      : null;

  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-4xl font-semibold tabular-nums">
          {formatMoney(dailyAverage, currency)}
          <span className="text-muted-foreground text-base font-normal"> / día</span>
        </p>
        {change !== null && (
          <Badge variant="secondary" className={cn(change > 0 ? "text-destructive" : "text-pos")}>
            {change > 0 ? <TrendingUp /> : <TrendingDown />}
            {change > 0 ? "+" : ""}
            {formatNumber(change, 1)} % vs periodo anterior
          </Badge>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Días del periodo</dt>
          <dd className="font-medium tabular-nums">{days}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Promedio periodo anterior</dt>
          <dd className="font-medium tabular-nums">
            {prevDailyAverage === null ? "—" : `${formatMoney(prevDailyAverage, currency)} / día`}
          </dd>
        </div>
      </dl>
    </div>
  );
}

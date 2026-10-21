import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCup, formatNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Dashboard } from "../queries";
import { PeriodTabs } from "./period-tabs";

/** Bloque azul de Inicio: saldo acumulado y gasto del periodo elegido. */
export function BalanceHero({
  kpis,
  periodLabel,
}: {
  kpis: Dashboard["kpis"];
  periodLabel: string;
}) {
  const { balance, spent, expenseCount, dailyAverage, prevDailyAverage, days } = kpis;
  // Sin periodo anterior (o sin gasto en él) no hay contra qué comparar.
  const change =
    prevDailyAverage && prevDailyAverage > 0
      ? ((dailyAverage - prevDailyAverage) / prevDailyAverage) * 100
      : null;

  return (
    <section
      aria-label="Resumen del saldo"
      className="glass-section flex flex-col gap-7 rounded-[20px] px-6 py-6 sm:px-8 sm:py-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-on-section-muted text-[13px]">
          <span>Saldo disponible</span> · <span>Total acumulado</span>
        </span>
        <PeriodTabs tone="section" />
      </div>

      <div className="flex flex-wrap items-end gap-x-10 gap-y-7">
        <p
          className={cn(
            "flex-[2_1_300px] text-[clamp(40px,6vw,60px)] leading-none font-medium tracking-[-0.035em] tabular-nums",
            balance < 0 && "text-on-section-neg",
          )}
        >
          {formatCup(balance)}
        </p>
        <HeroStat label="Gastado" className="flex-[1_1_180px]">
          <span className="text-[26px] font-medium tracking-[-0.02em] tabular-nums">
            {formatCup(spent)}
          </span>
          <span className="text-on-section-muted text-xs">
            {expenseCount} {expenseCount === 1 ? "gasto" : "gastos"} · {periodLabel}
          </span>
        </HeroStat>
        <HeroStat label="Gasto diario promedio" className="flex-[1_1_220px]">
          <span className="text-[26px] font-medium tracking-[-0.02em] tabular-nums">
            {formatCup(dailyAverage)}
            <span className="text-on-section-muted text-sm"> / día</span>
          </span>
          {change !== null && (
            <span className="inline-flex items-center gap-1.5 text-xs">
              {change > 0 ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {change > 0 ? "+" : ""}
              {formatNumber(change, 1)} % vs periodo anterior
            </span>
          )}
        </HeroStat>
      </div>

      <dl className="text-on-section-muted flex flex-wrap gap-x-7 gap-y-2 border-t border-white/16 pt-4 text-xs">
        <div className="flex gap-1">
          <dt>Días del periodo</dt>
          <dd className="text-on-section font-medium tabular-nums">{days}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Promedio periodo anterior</dt>
          <dd className="text-on-section font-medium tabular-nums">
            {prevDailyAverage === null ? "—" : `${formatCup(prevDailyAverage)} / día`}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function HeroStat({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1 border-l border-white/22 pl-6", className)}>
      <span className="text-on-section-muted text-[13px]">{label}</span>
      {children}
    </div>
  );
}

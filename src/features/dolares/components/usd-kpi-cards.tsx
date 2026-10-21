import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UsdDashboard } from "@/features/dashboard/queries";
import { formatDay } from "@/lib/dates";
import { formatCup, formatNumber, formatUsd } from "@/lib/money";

export function UsdKpiCards({ kpis }: { kpis: UsdDashboard["kpis"] }) {
  const items = [
    {
      label: "Gastado en USD",
      value: formatUsd(kpis.spent),
      hint: `${kpis.expenseCount} ${kpis.expenseCount === 1 ? "gasto" : "gastos"} · ≈ ${formatCup(kpis.cupEquivalent)}`,
    },
    {
      label: "Última tasa de venta",
      value: kpis.lastRate === null ? "—" : `${formatNumber(kpis.lastRate, 2)} CUP/USD`,
      hint: kpis.lastRateOn
        ? `Vendido el ${formatDay(kpis.lastRateOn)}`
        : "Aún no hay ventas de USD",
    },
    {
      label: "Tasa media del periodo",
      value: kpis.avgRate === null ? "—" : `${formatNumber(kpis.avgRate, 2)} CUP/USD`,
      hint:
        kpis.usdSold > 0
          ? `Ponderada · ${formatUsd(kpis.usdSold)} vendidos`
          : "Sin ventas en este periodo",
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="gap-1 py-4">
          <CardHeader className="px-4">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{item.value}</CardTitle>
            <p className="text-muted-foreground text-xs">{item.hint}</p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

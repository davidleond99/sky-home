import { StatStrip } from "@/components/stat-strip";
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
  return <StatStrip stats={items} />;
}

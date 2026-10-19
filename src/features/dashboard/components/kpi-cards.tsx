import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCup, formatNumber, formatUsd } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Dashboard } from "../queries";

export function KpiCards({ kpis }: { kpis: Dashboard["kpis"] }) {
  const items = [
    {
      label: "Saldo disponible",
      value: formatCup(kpis.balance),
      hint: "Total acumulado",
      negative: kpis.balance < 0,
    },
    {
      label: "USD vendidos",
      value: formatUsd(kpis.usdSold),
      hint: `${formatCup(kpis.cupIn)} recibidos`,
    },
    {
      label: "Gastado",
      value: formatCup(kpis.cupSpent),
      hint: `${kpis.expenseCount} ${kpis.expenseCount === 1 ? "gasto" : "gastos"}`,
    },
    {
      label: "Tasa media",
      value: kpis.avgRate === null ? "—" : `${formatNumber(kpis.avgRate, 2)}`,
      hint: "CUP por USD (ponderada)",
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="gap-1 py-4">
          <CardHeader className="px-4">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className={cn("text-2xl tabular-nums", item.negative && "text-destructive")}>
              {item.value}
            </CardTitle>
            <p className="text-muted-foreground text-xs">{item.hint}</p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

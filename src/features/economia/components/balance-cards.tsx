import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCup, formatUsd } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getBalance } from "../queries";

export async function BalanceCards() {
  const { balance, cupIn, cupOut, usdSold } = await getBalance();
  const items = [
    {
      label: "Saldo disponible",
      value: formatCup(balance),
      negative: balance < 0,
      testId: "balance",
    },
    { label: "CUP recibidos", value: formatCup(cupIn) },
    { label: "CUP gastados", value: formatCup(cupOut) },
    { label: "USD vendidos", value: formatUsd(usdSold) },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="gap-1 py-4">
          <CardHeader className="px-4">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle
              data-testid={item.testId}
              className={cn("text-2xl tabular-nums", item.negative && "text-destructive")}
            >
              {item.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

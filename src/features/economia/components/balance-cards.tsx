import { StatStrip } from "@/components/stat-strip";
import { formatCup, formatUsd } from "@/lib/money";
import { getBalance } from "../queries";

export async function BalanceCards() {
  const { balance, cupIn, cupOut, usdSold } = await getBalance();
  return (
    <StatStrip
      stats={[
        {
          label: "Saldo disponible",
          value: formatCup(balance),
          className: balance < 0 ? "text-destructive" : "text-primary",
          testId: "balance",
        },
        { label: "CUP recibidos", value: formatCup(cupIn) },
        { label: "CUP gastados", value: formatCup(cupOut) },
        { label: "USD vendidos", value: formatUsd(usdSold) },
      ]}
    />
  );
}

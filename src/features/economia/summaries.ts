import { formatCup, formatNumber, formatUsd } from "@/lib/money";

export function exchangeSummary(e: { usdAmount: number; rate: number; cupAmount: number }) {
  return `Venta de ${formatUsd(e.usdAmount)} a ${formatNumber(e.rate, 2)} CUP/USD = ${formatCup(e.cupAmount)}`;
}

export function expenseSummary(e: {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}) {
  return `${e.productName}: ${formatNumber(e.quantity)} ${e.unit} × ${formatCup(e.unitPrice)} = ${formatCup(e.total)}`;
}

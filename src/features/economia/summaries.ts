import { type Currency, formatCup, formatMoney, formatNumber, formatUsd } from "@/lib/money";

export function exchangeSummary(e: { usdAmount: number; rate: number; cupAmount: number }) {
  return `Venta de ${formatUsd(e.usdAmount)} a ${formatNumber(e.rate, 2)} CUP/USD = ${formatCup(e.cupAmount)}`;
}

export function expenseSummary(e: {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  currency?: Currency;
  rate?: number | null;
}) {
  const currency = e.currency ?? "CUP";
  const base = `${e.productName}: ${formatNumber(e.quantity)} ${e.unit} × ${formatMoney(e.unitPrice, currency)} = ${formatMoney(e.total, currency)}`;
  return currency === "USD" && e.rate ? `${base} a ${formatNumber(e.rate, 2)} CUP/USD` : base;
}

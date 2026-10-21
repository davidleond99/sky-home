import { comparableUnit } from "@/features/economia/units";
import { type Currency, multiplyMoney } from "@/lib/money";

/** Un gasto tal como lo necesita la comparativa. */
export type ComparisonInput = {
  productId: string;
  productName: string;
  categoryName: string;
  currency: Currency;
  quantity: number;
  unit: string;
  total: number;
  /** CUP por USD (solo en USD). */
  rate: number | null;
  occurredOn: string;
  createdAt: Date;
};

/** Lo pagado por un producto en una moneda, por unidad comparable. */
export type PriceSide = {
  count: number;
  /** Precio medio ponderado por cantidad, en la moneda del gasto. */
  avgPrice: number;
  /** Precio medio en CUP: en CUP es el mismo; en USD, con la tasa guardada en cada compra. */
  avgCup: number;
  last: { price: number; cupPrice: number; occurredOn: string; rate: number | null };
};

export type Verdict = { cheaper: Currency | "equal"; /** (USD en CUP − CUP) ÷ CUP */ diff: number };

export type PriceComparison = {
  productId: string;
  productName: string;
  categoryName: string;
  unit: string;
  cup: PriceSide | null;
  usd: PriceSide | null;
  verdict: Verdict | null;
};

/** Por debajo de esta diferencia relativa se considera el mismo precio. */
export const SAME_PRICE_THRESHOLD = 0.02;

const round2 = (v: number) => Math.round(v * 100) / 100;

function cupOf(row: ComparisonInput) {
  return row.currency === "USD" ? multiplyMoney(row.total, row.rate ?? 0) : row.total;
}

function side(rows: ComparisonInput[]): PriceSide | null {
  if (rows.length === 0) return null;
  let quantity = 0;
  let total = 0;
  let cup = 0;
  for (const r of rows) {
    quantity += comparableUnit(r.unit, r.quantity).quantity;
    total += r.total;
    cup += cupOf(r);
  }
  const last = rows.reduce((a, b) =>
    b.occurredOn > a.occurredOn || (b.occurredOn === a.occurredOn && b.createdAt > a.createdAt)
      ? b
      : a,
  );
  const lastQuantity = comparableUnit(last.unit, last.quantity).quantity;
  return {
    count: rows.length,
    avgPrice: round2(total / quantity),
    avgCup: round2(cup / quantity),
    last: {
      price: round2(last.total / lastQuantity),
      cupPrice: round2(cupOf(last) / lastQuantity),
      occurredOn: last.occurredOn,
      rate: last.rate,
    },
  };
}

export function verdict(cup: PriceSide | null, usd: PriceSide | null): Verdict | null {
  if (!cup || !usd || cup.avgCup <= 0) return null;
  const diff = (usd.avgCup - cup.avgCup) / cup.avgCup;
  if (Math.abs(diff) < SAME_PRICE_THRESHOLD) return { cheaper: "equal", diff };
  return { cheaper: diff < 0 ? "USD" : "CUP", diff };
}

/**
 * Agrupa los gastos por producto y unidad comparable (kg → lb) y compara lo
 * pagado en CUP con lo pagado en USD convertido a CUP con la tasa de cada compra.
 * Primero los productos comprados en las dos monedas.
 */
export function comparePrices(rows: ComparisonInput[]): PriceComparison[] {
  const groups = new Map<string, ComparisonInput[]>();
  for (const r of rows) {
    const key = `${r.productId}|${comparableUnit(r.unit, r.quantity).unit}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  const result = [...groups.values()].map((group): PriceComparison => {
    const first = group[0];
    const cup = side(group.filter((r) => r.currency === "CUP"));
    const usd = side(group.filter((r) => r.currency === "USD"));
    return {
      productId: first.productId,
      productName: first.productName,
      categoryName: first.categoryName,
      unit: comparableUnit(first.unit, first.quantity).unit,
      cup,
      usd,
      verdict: verdict(cup, usd),
    };
  });

  return result.sort(
    (a, b) =>
      Number(b.verdict !== null) - Number(a.verdict !== null) ||
      a.productName.localeCompare(b.productName, "es") ||
      a.unit.localeCompare(b.unit, "es"),
  );
}

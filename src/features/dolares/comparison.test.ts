import { describe, expect, it } from "vitest";
import { type ComparisonInput, comparePrices, verdict } from "./comparison";

const base = {
  productId: "p-arroz",
  productName: "Arroz",
  categoryName: "Granos",
  unit: "lb",
  rate: null,
  createdAt: new Date("2026-10-01T12:00:00Z"),
} satisfies Partial<ComparisonInput>;

const cup = (quantity: number, total: number, occurredOn = "2026-10-01"): ComparisonInput => ({
  ...base,
  currency: "CUP",
  quantity,
  total,
  occurredOn,
});

const usd = (
  quantity: number,
  total: number,
  rate: number,
  occurredOn = "2026-10-02",
): ComparisonInput => ({ ...base, currency: "USD", quantity, total, rate, occurredOn });

describe("comparePrices", () => {
  it("calcula medias ponderadas por cantidad y el último precio", () => {
    const [row] = comparePrices([cup(1, 200), cup(3, 900, "2026-10-05")]);
    expect(row.cup).toMatchObject({
      count: 2,
      avgPrice: 275, // 1100 CUP ÷ 4 lb
      avgCup: 275,
      last: { price: 300, occurredOn: "2026-10-05" },
    });
    expect(row.usd).toBeNull();
    expect(row.verdict).toBeNull();
  });

  it("lleva lo pagado en USD a CUP con la tasa de cada compra", () => {
    // 2 lb a 1 USD (tasa 400) + 2 lb a 1 USD (tasa 500) → 1800 CUP ÷ 4 lb
    const [row] = comparePrices([cup(1, 500), usd(2, 2, 400), usd(2, 2, 500, "2026-10-03")]);
    expect(row.usd).toMatchObject({
      count: 2,
      avgPrice: 1,
      avgCup: 450,
      last: { price: 1, cupPrice: 500, rate: 500, occurredOn: "2026-10-03" },
    });
    expect(row.verdict).toEqual({ cheaper: "USD", diff: -0.1 });
  });

  it("compara kg con lb", () => {
    // 1 kg a 1100 CUP ≈ 498,96 CUP/lb; 1 lb a 1,25 USD × 400 = 500 CUP/lb
    const rows = comparePrices([{ ...cup(1, 1100), unit: "kg" }, usd(1, 1.25, 400)]);
    expect(rows).toHaveLength(1);
    expect(rows[0].unit).toBe("lb");
    expect(rows[0].cup?.avgPrice).toBe(498.95);
    expect(rows[0].verdict?.cheaper).toBe("equal");
  });

  it("no mezcla unidades no comparables y ordena primero las que tienen veredicto", () => {
    const rows = comparePrices([
      { ...cup(1, 100), productId: "p-agua", productName: "Agua", unit: "botella" },
      { ...usd(1, 1, 400), productId: "p-agua", productName: "Agua", unit: "litro" },
      cup(1, 400),
      usd(1, 1.2, 400),
    ]);
    expect(rows.map((r) => [r.productName, r.unit])).toEqual([
      ["Arroz", "lb"],
      ["Agua", "botella"],
      ["Agua", "litro"],
    ]);
    expect(rows[0].verdict).toEqual({ cheaper: "CUP", diff: 0.2 });
  });
});

describe("verdict", () => {
  const side = (avgCup: number) => ({
    count: 1,
    avgPrice: avgCup,
    avgCup,
    last: { price: avgCup, cupPrice: avgCup, occurredOn: "2026-10-01", rate: null },
  });

  it("por debajo del 2 % es el mismo precio", () => {
    expect(verdict(side(100), side(101.5))?.cheaper).toBe("equal");
    expect(verdict(side(100), side(103))?.cheaper).toBe("CUP");
    expect(verdict(side(100), side(97))?.cheaper).toBe("USD");
  });

  it("sin las dos monedas no hay veredicto", () => {
    expect(verdict(side(100), null)).toBeNull();
    expect(verdict(null, side(100))).toBeNull();
  });
});

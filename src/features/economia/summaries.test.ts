import { describe, expect, it } from "vitest";
import { exchangeSummary, expenseSummary } from "./summaries";

describe("summaries", () => {
  it("venta de USD", () => {
    expect(exchangeSummary({ usdAmount: 100, rate: 400, cupAmount: 40000 })).toBe(
      "Venta de 100 USD a 400 CUP/USD = 40.000 CUP",
    );
  });

  it("gasto", () => {
    expect(
      expenseSummary({ productName: "Arroz", quantity: 2, unit: "lb", unitPrice: 250, total: 500 }),
    ).toBe("Arroz: 2 lb × 250 CUP = 500 CUP");
  });

  it("gasto en USD con su tasa", () => {
    expect(
      expenseSummary({
        productName: "Leche",
        quantity: 2,
        unit: "unidad",
        unitPrice: 3.5,
        total: 7,
        currency: "USD",
        rate: 410,
      }),
    ).toBe("Leche: 2 unidad × 3,50 USD = 7 USD a 410 CUP/USD");
  });
});

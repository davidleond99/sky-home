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
});

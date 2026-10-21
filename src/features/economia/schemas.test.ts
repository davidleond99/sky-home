import { describe, expect, it } from "vitest";
import { exchangeSchema, expenseSchema } from "./schemas";

const productId = "8b0f0b8e-3c0a-4c1e-9a53-2b6d1c3f4a5b";

describe("exchangeSchema", () => {
  it("acepta strings de formulario con coma decimal", () => {
    const parsed = exchangeSchema.parse({
      occurredOn: "2026-10-19",
      usdAmount: "100",
      rate: "412,5",
    });
    expect(parsed).toEqual({ occurredOn: "2026-10-19", usdAmount: 100, rate: 412.5, note: null });
  });

  it("es idempotente (la salida vuelve a validar)", () => {
    const once = exchangeSchema.parse({ occurredOn: "2026-10-19", usdAmount: "100", rate: "400" });
    expect(exchangeSchema.parse(once)).toEqual(once);
  });

  it("rechaza cantidades no positivas, texto y más de 2 decimales", () => {
    expect(
      exchangeSchema.safeParse({ occurredOn: "2026-10-19", usdAmount: "0", rate: "400" }).success,
    ).toBe(false);
    expect(
      exchangeSchema.safeParse({ occurredOn: "2026-10-19", usdAmount: "abc", rate: "400" }).success,
    ).toBe(false);
    expect(
      exchangeSchema.safeParse({ occurredOn: "2026-10-19", usdAmount: "1.234", rate: "400" })
        .success,
    ).toBe(false);
    expect(
      exchangeSchema.safeParse({ occurredOn: "19/10/2026", usdAmount: "1", rate: "400" }).success,
    ).toBe(false);
  });
});

describe("expenseSchema", () => {
  const base = { occurredOn: "2026-10-19", productId, quantity: "2", unit: "lb", unitPrice: "250" };

  it("acepta un gasto válido", () => {
    expect(expenseSchema.parse({ ...base, note: "  " })).toMatchObject({
      quantity: 2,
      unitPrice: 250,
      note: null,
    });
  });

  it("permite precio 0 (regalo) pero no cantidad 0", () => {
    expect(expenseSchema.safeParse({ ...base, unitPrice: "0" }).success).toBe(true);
    expect(expenseSchema.safeParse({ ...base, quantity: "0" }).success).toBe(false);
  });

  it("valida unidad y producto", () => {
    expect(expenseSchema.safeParse({ ...base, unit: "barril" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...base, productId: "x" }).success).toBe(false);
  });

  it("sin moneda es CUP y descarta la tasa", () => {
    expect(expenseSchema.parse(base)).toMatchObject({ currency: "CUP", rate: null });
    expect(expenseSchema.parse({ ...base, rate: "410" })).toMatchObject({
      currency: "CUP",
      rate: null,
    });
  });

  it("en USD exige la tasa y acepta coma decimal", () => {
    const usd = { ...base, unitPrice: "3,50", currency: "USD" };
    const missing = expenseSchema.safeParse({ ...usd, rate: "" });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues[0].path).toEqual(["rate"]);
    expect(expenseSchema.parse({ ...usd, rate: "410,5" })).toMatchObject({
      currency: "USD",
      unitPrice: 3.5,
      rate: 410.5,
    });
    expect(expenseSchema.safeParse({ ...usd, rate: "0" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...base, currency: "EUR" }).success).toBe(false);
  });

  it("es idempotente también en USD", () => {
    const once = expenseSchema.parse({ ...base, currency: "USD", rate: "400" });
    expect(expenseSchema.parse(once)).toEqual(once);
  });
});

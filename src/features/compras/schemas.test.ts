import { describe, expect, it } from "vitest";
import { listItemSchema, listSchema, purchaseSchema } from "./schemas";

const productId = "8b0f0b8e-3c0a-4c1e-9a53-2b6d1c3f4a5b";

describe("listSchema", () => {
  it("recorta el nombre y exige que no esté vacío", () => {
    expect(listSchema.parse({ name: "  Agromercado " })).toEqual({ name: "Agromercado" });
    expect(listSchema.safeParse({ name: "   " }).success).toBe(false);
  });
});

describe("listItemSchema", () => {
  it("la cantidad es opcional", () => {
    expect(listItemSchema.parse({ productId, quantity: "", unit: "lb" })).toEqual({
      productId,
      quantity: null,
      unit: "lb",
      note: null,
    });
    expect(listItemSchema.parse({ productId, unit: "lb" }).quantity).toBeUndefined();
  });

  it("acepta cantidad con coma decimal", () => {
    expect(listItemSchema.parse({ productId, quantity: "2,5", unit: "kg" }).quantity).toBe(2.5);
  });

  it("rechaza cantidad no positiva, unidad desconocida y producto vacío", () => {
    expect(listItemSchema.safeParse({ productId, quantity: "0", unit: "lb" }).success).toBe(false);
    expect(listItemSchema.safeParse({ productId, unit: "saco" }).success).toBe(false);
    expect(listItemSchema.safeParse({ productId: "", unit: "lb" }).success).toBe(false);
  });
});

describe("purchaseSchema", () => {
  const base = { occurredOn: "2026-10-20", quantity: "3", unit: "lb", unitPrice: "120" };

  it("acepta una compra válida (precio 0 incluido)", () => {
    expect(purchaseSchema.parse(base)).toMatchObject({ quantity: 3, unitPrice: 120, note: null });
    expect(purchaseSchema.parse({ ...base, unitPrice: "0" }).unitPrice).toBe(0);
  });

  it("es idempotente (la salida vuelve a validar)", () => {
    const once = purchaseSchema.parse(base);
    expect(purchaseSchema.parse(once)).toEqual(once);
  });

  it("exige cantidad, precio y fecha válidos", () => {
    expect(purchaseSchema.safeParse({ ...base, quantity: "" }).success).toBe(false);
    expect(purchaseSchema.safeParse({ ...base, unitPrice: "1.234" }).success).toBe(false);
    expect(purchaseSchema.safeParse({ ...base, occurredOn: "20/10/2026" }).success).toBe(false);
  });
});

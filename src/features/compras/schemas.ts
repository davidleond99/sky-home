import { z } from "zod";
import { decimal, isoDay, name, note } from "@/features/economia/schemas";
import { UNIT_VALUES } from "@/features/economia/units";

export const listSchema = z.object({
  name: name("de la lista"),
});

const unit = z.enum(UNIT_VALUES, { error: "Elige una unidad" });

export const listItemSchema = z.object({
  productId: z.uuid({ error: "Elige un producto" }),
  /** Cantidad prevista: opcional. */
  quantity: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    decimal({ decimals: 3, label: "la cantidad", max: 1_000_000 }).nullish(),
  ),
  unit,
  note,
});

/** Datos de la compra real de un producto de la lista: se registra como gasto. */
export const purchaseSchema = z.object({
  occurredOn: isoDay,
  quantity: decimal({ decimals: 3, label: "la cantidad", max: 1_000_000 }),
  unit,
  unitPrice: decimal({ decimals: 2, label: "el precio", inclusive: true }),
  note,
});

export type ListInput = z.input<typeof listSchema>;
export type ListItemInput = z.input<typeof listItemSchema>;
export type PurchaseInput = z.input<typeof purchaseSchema>;

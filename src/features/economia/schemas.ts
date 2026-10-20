import { z } from "zod";
import { hasMaxDecimals } from "@/lib/money";
import { UNIT_VALUES } from "./units";

/** Número desde formulario ("2,5" o "2.5") o ya numérico; valida decimales y rango. */
function decimal({
  decimals,
  min = 0,
  inclusive = false,
  max = 1_000_000_000,
  label,
}: {
  decimals: number;
  min?: number;
  inclusive?: boolean;
  max?: number;
  label: string;
}) {
  return z
    .union([z.number(), z.string().trim().min(1, `Indica ${label}`)])
    .transform((v) => (typeof v === "number" ? v : Number(v.replace(/\s/g, "").replace(",", "."))))
    .pipe(
      z
        .number({ error: `${capitalize(label)} no es un número válido` })
        .refine((v) => Number.isFinite(v), `${capitalize(label)} no es un número válido`)
        .refine(
          (v) => (inclusive ? v >= min : v > min),
          `${capitalize(label)} debe ser mayor que ${min}`,
        )
        .refine((v) => v <= max, `${capitalize(label)} es demasiado grande`)
        .refine((v) => hasMaxDecimals(v, decimals), `Máximo ${decimals} decimales`),
    );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const isoDay = z.iso.date({ error: "Fecha no válida" });
const note = z
  .string()
  .trim()
  .max(500, "Máximo 500 caracteres")
  .nullish()
  .transform((v) => v || null);
const name = (label: string) =>
  z.string().trim().min(1, `Escribe el nombre ${label}`).max(80, "Máximo 80 caracteres");

export const idSchema = z.uuid();

export const exchangeSchema = z.object({
  occurredOn: isoDay,
  usdAmount: decimal({ decimals: 2, label: "la cantidad de USD" }),
  rate: decimal({ decimals: 2, label: "la tasa", max: 100_000 }),
  note,
});

export const expenseSchema = z.object({
  occurredOn: isoDay,
  productId: z.uuid({ error: "Elige un producto" }),
  quantity: decimal({ decimals: 3, label: "la cantidad", max: 1_000_000 }),
  unit: z.enum(UNIT_VALUES, { error: "Elige una unidad" }),
  unitPrice: decimal({ decimals: 2, label: "el precio", inclusive: true }),
  note,
});

export const productSchema = z.object({
  name: name("del producto"),
  categoryId: z.uuid({ error: "Elige una categoría" }),
  defaultUnit: z.enum(UNIT_VALUES, { error: "Elige una unidad" }),
});

export const categorySchema = z.object({
  name: name("de la categoría"),
});

export type ExchangeInput = z.input<typeof exchangeSchema>;
export type ExpenseInput = z.input<typeof expenseSchema>;
export type ProductInput = z.input<typeof productSchema>;
export type CategoryInput = z.input<typeof categorySchema>;

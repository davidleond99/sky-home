import "server-only";
import { eq } from "drizzle-orm";
import type { Tx } from "@/db";
import { categories, expenses, products } from "@/db/schema";
import { recordAudit } from "@/features/audit/record";
import { type Currency, multiplyMoney } from "@/lib/money";
import { expenseSummary } from "./summaries";

/** Escrituras de gastos compartidas por economía y la lista de la compra. */

type ExpenseRow = typeof expenses.$inferSelect;
type ProductInfo = { productName: string; categoryName: string };

export function expenseSnapshot(e: ExpenseRow, product: ProductInfo) {
  return {
    occurredOn: e.occurredOn,
    productName: product.productName,
    categoryName: product.categoryName,
    currency: e.currency,
    quantity: e.quantity,
    unit: e.unit,
    unitPrice: e.unitPrice,
    total: e.total,
    rate: e.rate,
    note: e.note,
    deletedAt: e.deletedAt,
  };
}

export async function findProduct(tx: Tx, productId: string) {
  const [row] = await tx
    .select({
      id: products.id,
      productName: products.name,
      categoryName: categories.name,
      archivedAt: products.archivedAt,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.id, productId));
  return row;
}

export type NewExpense = {
  occurredOn: string;
  productId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: Currency;
  /** CUP por USD; null en CUP. */
  rate: number | null;
  note: string | null;
};

/** Inserta un gasto (total calculado en servidor) y su traza. */
export async function insertExpense(
  tx: Tx,
  userId: string,
  data: NewExpense,
  product: ProductInfo,
  summarySuffix = "",
) {
  const total = multiplyMoney(data.quantity, data.unitPrice);
  const [row] = await tx
    .insert(expenses)
    .values({ ...data, total, createdBy: userId, updatedBy: userId })
    .returning();
  await recordAudit(tx, {
    userId,
    action: "create",
    entity: "expense",
    entityId: row.id,
    summary: expenseSummary({ ...row, productName: product.productName }) + summarySuffix,
    after: expenseSnapshot(row, product),
  });
  return row;
}

/** Borrado lógico de un gasto ya bloqueado (`for update`) y su traza. */
export async function softDeleteExpense(
  tx: Tx,
  userId: string,
  current: ExpenseRow,
  product: ProductInfo,
  summarySuffix = "",
) {
  const [row] = await tx
    .update(expenses)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedBy: userId })
    .where(eq(expenses.id, current.id))
    .returning();
  await recordAudit(tx, {
    userId,
    action: "delete",
    entity: "expense",
    entityId: current.id,
    summary: expenseSummary({ ...current, productName: product.productName }) + summarySuffix,
    before: expenseSnapshot(current, product),
    after: expenseSnapshot(row, product),
  });
  return row;
}

import "server-only";
import { and, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { categories, expenses, products } from "@/db/schema";
import { periodStart, type Period } from "@/features/dashboard/period";
import { economiaCache } from "@/features/economia/queries";
import { todayIso } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { comparePrices } from "./comparison";

/** Comparativa de precios CUP vs USD por producto en el periodo. */
export async function getPriceComparison(period: Period) {
  await requireUser();
  return getPriceComparisonCached(periodStart(period, todayIso()));
}

async function getPriceComparisonCached(from: string | null) {
  "use cache";
  economiaCache();
  const rows = await db
    .select({
      productId: expenses.productId,
      productName: products.name,
      categoryName: categories.name,
      currency: expenses.currency,
      quantity: expenses.quantity,
      unit: expenses.unit,
      total: expenses.total,
      rate: expenses.rate,
      occurredOn: expenses.occurredOn,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .innerJoin(products, eq(products.id, expenses.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(isNull(expenses.deletedAt), from ? gte(expenses.occurredOn, from) : undefined));
  return comparePrices(rows);
}

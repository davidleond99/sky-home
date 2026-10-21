"use server";

import { and, eq, isNull, max } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db, type Tx } from "@/db";
import { categories, currencyExchanges, expenses, products } from "@/db/schema";
import { recordAudit } from "@/features/audit/record";
import { type ActionResult, fail, invalid, isUniqueViolation, ok } from "@/lib/action-result";
import { multiplyMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";
import {
  type CategoryInput,
  categorySchema,
  type ExchangeInput,
  exchangeSchema,
  type ExpenseInput,
  expenseSchema,
  idSchema,
  type ProductInput,
  productSchema,
} from "./schemas";
import { expenseSnapshot, findProduct, insertExpense, softDeleteExpense } from "./expense-writes";
import { ECONOMIA_TAG } from "./queries";
import { exchangeSummary, expenseSummary } from "./summaries";

/**
 * Todas las vistas de economía comparten la caché `ECONOMIA_TAG`: se expira al
 * instante para que quien hizo el cambio lo vea ya (read-your-own-writes).
 */
function refresh() {
  updateTag(ECONOMIA_TAG);
}

// ─── Snapshots para la traza (solo campos con significado para una persona) ───

type ExchangeRow = typeof currencyExchanges.$inferSelect;

function exchangeSnapshot(e: ExchangeRow) {
  return {
    occurredOn: e.occurredOn,
    usdAmount: e.usdAmount,
    rate: e.rate,
    cupAmount: e.cupAmount,
    note: e.note,
    deletedAt: e.deletedAt,
  };
}

// ─── Ventas de USD ───

export async function createExchange(input: ExchangeInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = exchangeSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const data = parsed.data;
  const cupAmount = multiplyMoney(data.usdAmount, data.rate);

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(currencyExchanges)
      .values({ ...data, cupAmount, createdBy: user.id, updatedBy: user.id })
      .returning();
    await recordAudit(tx, {
      userId: user.id,
      action: "create",
      entity: "exchange",
      entityId: row.id,
      summary: exchangeSummary(row),
      after: exchangeSnapshot(row),
    });
    return row.id;
  });

  refresh();
  return ok({ id });
}

export async function updateExchange(
  id: string,
  input: ExchangeInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Venta no válida");
  const parsed = exchangeSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const data = parsed.data;
  const cupAmount = multiplyMoney(data.usdAmount, data.rate);

  const updated = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(currencyExchanges)
      .where(and(eq(currencyExchanges.id, id), isNull(currencyExchanges.deletedAt)))
      .for("update");
    if (!current) return null;

    const [row] = await tx
      .update(currencyExchanges)
      .set({ ...data, cupAmount, updatedBy: user.id })
      .where(eq(currencyExchanges.id, id))
      .returning();
    await recordAudit(tx, {
      userId: user.id,
      action: "update",
      entity: "exchange",
      entityId: id,
      summary: exchangeSummary(row),
      before: exchangeSnapshot(current),
      after: exchangeSnapshot(row),
    });
    return row;
  });

  if (!updated) return fail("La venta no existe o ya fue eliminada");
  refresh();
  return ok({ id });
}

export async function deleteExchange(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Venta no válida");

  const deleted = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(currencyExchanges)
      .where(and(eq(currencyExchanges.id, id), isNull(currencyExchanges.deletedAt)))
      .for("update");
    if (!current) return false;

    const [row] = await tx
      .update(currencyExchanges)
      .set({ deletedAt: new Date(), deletedBy: user.id, updatedBy: user.id })
      .where(eq(currencyExchanges.id, id))
      .returning();
    await recordAudit(tx, {
      userId: user.id,
      action: "delete",
      entity: "exchange",
      entityId: id,
      summary: exchangeSummary(current),
      before: exchangeSnapshot(current),
      after: exchangeSnapshot(row),
    });
    return true;
  });

  if (!deleted) return fail("La venta no existe o ya fue eliminada");
  refresh();
  return ok(undefined);
}

// ─── Gastos ───

export async function createExpense(input: ExpenseInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const data = parsed.data;
  const id = await db.transaction(async (tx) => {
    const product = await findProduct(tx, data.productId);
    if (!product || product.archivedAt) return null;
    const row = await insertExpense(tx, user.id, data, product);
    return row.id;
  });

  if (!id) return fail("El producto no existe o está archivado", { productId: ["Elige otro"] });
  refresh();
  return ok({ id });
}

export async function updateExpense(
  id: string,
  input: ExpenseInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Gasto no válido");
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const data = parsed.data;
  const total = multiplyMoney(data.quantity, data.unitPrice);

  const result = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
      .for("update");
    if (!current) return "not-found" as const;
    // La moneda es fija: un gasto en USD no se convierte en CUP (ni al revés) al editarlo.
    if (current.currency !== data.currency) return "currency-changed" as const;

    const product = await findProduct(tx, data.productId);
    // Un producto archivado solo se acepta si el gasto ya lo tenía.
    if (!product || (product.archivedAt && product.id !== current.productId)) {
      return "bad-product" as const;
    }
    const previousProduct =
      current.productId === product.id ? product : await findProduct(tx, current.productId);

    const [row] = await tx
      .update(expenses)
      .set({ ...data, total, updatedBy: user.id })
      .where(eq(expenses.id, id))
      .returning();
    await recordAudit(tx, {
      userId: user.id,
      action: "update",
      entity: "expense",
      entityId: id,
      summary: expenseSummary({ ...row, productName: product.productName }),
      before: expenseSnapshot(current, previousProduct),
      after: expenseSnapshot(row, product),
    });
    return "ok" as const;
  });

  if (result === "not-found") return fail("El gasto no existe o ya fue eliminado");
  if (result === "currency-changed") {
    return fail("No se puede cambiar la moneda de un gasto: elimínalo y regístralo de nuevo");
  }
  if (result === "bad-product") {
    return fail("El producto no existe o está archivado", { productId: ["Elige otro"] });
  }
  refresh();
  return ok({ id });
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Gasto no válido");

  const deleted = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
      .for("update");
    if (!current) return false;

    const product = await findProduct(tx, current.productId);
    await softDeleteExpense(tx, user.id, current, product);
    return true;
  });

  if (!deleted) return fail("El gasto no existe o ya fue eliminado");
  refresh();
  return ok(undefined);
}

// ─── Catálogo: productos ───

export type CreatedProduct = {
  id: string;
  name: string;
  defaultUnit: string;
  categoryId: string;
  categoryName: string;
};

async function findCategory(tx: Tx, categoryId: string) {
  const [row] = await tx.select().from(categories).where(eq(categories.id, categoryId));
  return row;
}

export async function createProduct(input: ProductInput): Promise<ActionResult<CreatedProduct>> {
  const user = await requireUser();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    const created = await db.transaction(async (tx) => {
      const category = await findCategory(tx, data.categoryId);
      if (!category || category.archivedAt) return null;

      const [row] = await tx
        .insert(products)
        .values({ ...data, createdBy: user.id, updatedBy: user.id })
        .returning();
      await recordAudit(tx, {
        userId: user.id,
        action: "create",
        entity: "product",
        entityId: row.id,
        summary: `Producto «${row.name}» en ${category.name}`,
        after: { name: row.name, categoryName: category.name, defaultUnit: row.defaultUnit },
      });
      return {
        id: row.id,
        name: row.name,
        defaultUnit: row.defaultUnit,
        categoryId: category.id,
        categoryName: category.name,
      };
    });

    if (!created)
      return fail("La categoría no existe o está archivada", { categoryId: ["Elige otra"] });
    refresh();
    return ok(created);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Ya existe un producto con ese nombre", { name: ["Ya existe"] });
    }
    throw error;
  }
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Producto no válido");
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    const done = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(products).where(eq(products.id, id)).for("update");
      if (!current) return false;
      const [before, after] = await Promise.all([
        findCategory(tx, current.categoryId),
        findCategory(tx, data.categoryId),
      ]);
      if (!after) return false;

      const [row] = await tx
        .update(products)
        .set({ ...data, updatedBy: user.id })
        .where(eq(products.id, id))
        .returning();
      await recordAudit(tx, {
        userId: user.id,
        action: "update",
        entity: "product",
        entityId: id,
        summary: `Producto «${row.name}»`,
        before: {
          name: current.name,
          categoryName: before?.name,
          defaultUnit: current.defaultUnit,
        },
        after: { name: row.name, categoryName: after.name, defaultUnit: row.defaultUnit },
      });
      return true;
    });
    if (!done) return fail("El producto o la categoría no existen");
    refresh();
    return ok(undefined);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Ya existe un producto con ese nombre", { name: ["Ya existe"] });
    }
    throw error;
  }
}

export async function setProductArchived(id: string, archived: boolean): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Producto no válido");

  const done = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(products).where(eq(products.id, id)).for("update");
    if (!current) return false;
    const [row] = await tx
      .update(products)
      .set({
        archivedAt: archived ? new Date() : null,
        archivedBy: archived ? user.id : null,
        updatedBy: user.id,
      })
      .where(eq(products.id, id))
      .returning();
    await recordAudit(tx, {
      userId: user.id,
      action: archived ? "archive" : "restore",
      entity: "product",
      entityId: id,
      summary: `Producto «${row.name}»`,
      before: { archivedAt: current.archivedAt },
      after: { archivedAt: row.archivedAt },
    });
    return true;
  });

  if (!done) return fail("El producto no existe");
  refresh();
  return ok(undefined);
}

// ─── Catálogo: categorías ───

export async function createCategory(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const id = await db.transaction(async (tx) => {
      const [{ last }] = await tx.select({ last: max(categories.sortOrder) }).from(categories);
      const [row] = await tx
        .insert(categories)
        .values({
          name: parsed.data.name,
          sortOrder: (last ?? -1) + 1,
          createdBy: user.id,
          updatedBy: user.id,
        })
        .returning();
      await recordAudit(tx, {
        userId: user.id,
        action: "create",
        entity: "category",
        entityId: row.id,
        summary: `Categoría «${row.name}»`,
        after: { name: row.name },
      });
      return row.id;
    });
    refresh();
    return ok({ id });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Ya existe una categoría con ese nombre", { name: ["Ya existe"] });
    }
    throw error;
  }
}

export async function updateCategory(id: string, input: CategoryInput): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Categoría no válida");
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const done = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .for("update");
      if (!current) return false;
      const [row] = await tx
        .update(categories)
        .set({ name: parsed.data.name, updatedBy: user.id })
        .where(eq(categories.id, id))
        .returning();
      await recordAudit(tx, {
        userId: user.id,
        action: "update",
        entity: "category",
        entityId: id,
        summary: `Categoría «${row.name}»`,
        before: { name: current.name },
        after: { name: row.name },
      });
      return true;
    });
    if (!done) return fail("La categoría no existe");
    refresh();
    return ok(undefined);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Ya existe una categoría con ese nombre", { name: ["Ya existe"] });
    }
    throw error;
  }
}

export async function setCategoryArchived(id: string, archived: boolean): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Categoría no válida");

  const done = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(categories).where(eq(categories.id, id)).for("update");
    if (!current) return false;
    const [row] = await tx
      .update(categories)
      .set({
        archivedAt: archived ? new Date() : null,
        archivedBy: archived ? user.id : null,
        updatedBy: user.id,
      })
      .where(eq(categories.id, id))
      .returning();
    await recordAudit(tx, {
      userId: user.id,
      action: archived ? "archive" : "restore",
      entity: "category",
      entityId: id,
      summary: `Categoría «${row.name}»`,
      before: { archivedAt: current.archivedAt },
      after: { archivedAt: row.archivedAt },
    });
    return true;
  });

  if (!done) return fail("La categoría no existe");
  refresh();
  return ok(undefined);
}

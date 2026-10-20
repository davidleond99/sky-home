"use server";

import { and, eq, isNull } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db, type Tx } from "@/db";
import { expenses, shoppingListItems, shoppingLists } from "@/db/schema";
import { recordAudit } from "@/features/audit/record";
import { findProduct, insertExpense, softDeleteExpense } from "@/features/economia/expense-writes";
import { ECONOMIA_TAG } from "@/features/economia/queries";
import { idSchema } from "@/features/economia/schemas";
import { type ActionResult, fail, invalid, isUniqueViolation, ok } from "@/lib/action-result";
import { formatNumber } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { COMPRAS_TAG } from "./queries";
import {
  type ListInput,
  type ListItemInput,
  listItemSchema,
  listSchema,
  type PurchaseInput,
  purchaseSchema,
} from "./schemas";

/** Las consultas de compras también dependen de ECONOMIA_TAG (ver queries.ts). */
function refresh({ economia = false } = {}) {
  updateTag(COMPRAS_TAG);
  if (economia) updateTag(ECONOMIA_TAG);
}

const CLOSED = "La lista está cerrada. Reábrela para cambiarla.";

// ─── Listas ───

type ListRow = typeof shoppingLists.$inferSelect;

function listSnapshot(l: ListRow) {
  return { name: l.name, closedAt: l.closedAt, deletedAt: l.deletedAt };
}

async function lockList(tx: Tx, id: string) {
  const [row] = await tx
    .select()
    .from(shoppingLists)
    .where(and(eq(shoppingLists.id, id), isNull(shoppingLists.deletedAt)))
    .for("update");
  return row;
}

export async function createList(input: ListInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = listSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(shoppingLists)
      .values({ name: parsed.data.name, createdBy: user.id, updatedBy: user.id })
      .returning();
    await recordAudit(tx, {
      userId: user.id,
      action: "create",
      entity: "shopping_list",
      entityId: row.id,
      summary: `Lista «${row.name}»`,
      after: listSnapshot(row),
    });
    return row.id;
  });

  refresh();
  return ok({ id });
}

export async function renameList(id: string, input: ListInput): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Lista no válida");
  const parsed = listSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const done = await db.transaction(async (tx) => {
    const current = await lockList(tx, id);
    if (!current) return false;
    const [row] = await tx
      .update(shoppingLists)
      .set({ name: parsed.data.name, updatedBy: user.id })
      .where(eq(shoppingLists.id, id))
      .returning();
    await recordAudit(tx, {
      userId: user.id,
      action: "update",
      entity: "shopping_list",
      entityId: id,
      summary: `Lista «${row.name}»`,
      before: listSnapshot(current),
      after: listSnapshot(row),
    });
    return true;
  });

  if (!done) return fail("La lista no existe o fue eliminada");
  refresh();
  return ok(undefined);
}

export async function setListClosed(id: string, closed: boolean): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Lista no válida");

  const done = await db.transaction(async (tx) => {
    const current = await lockList(tx, id);
    if (!current) return false;
    const [row] = await tx
      .update(shoppingLists)
      .set({
        closedAt: closed ? new Date() : null,
        closedBy: closed ? user.id : null,
        updatedBy: user.id,
      })
      .where(eq(shoppingLists.id, id))
      .returning();
    await recordAudit(tx, {
      userId: user.id,
      action: closed ? "archive" : "restore",
      entity: "shopping_list",
      entityId: id,
      summary: `${closed ? "Cerró" : "Reabrió"} la lista «${row.name}»`,
      before: listSnapshot(current),
      after: listSnapshot(row),
    });
    return true;
  });

  if (!done) return fail("La lista no existe o fue eliminada");
  refresh();
  return ok(undefined);
}

/** Borrado lógico de la lista. Los gastos ya registrados se conservan. */
export async function deleteList(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(id).success) return fail("Lista no válida");

  const done = await db.transaction(async (tx) => {
    const current = await lockList(tx, id);
    if (!current) return false;
    const [row] = await tx
      .update(shoppingLists)
      .set({ deletedAt: new Date(), deletedBy: user.id, updatedBy: user.id })
      .where(eq(shoppingLists.id, id))
      .returning();
    await recordAudit(tx, {
      userId: user.id,
      action: "delete",
      entity: "shopping_list",
      entityId: id,
      summary: `Lista «${row.name}»`,
      before: listSnapshot(current),
      after: listSnapshot(row),
    });
    return true;
  });

  if (!done) return fail("La lista no existe o ya fue eliminada");
  refresh();
  return ok(undefined);
}

// ─── Productos de la lista ───

type ItemRow = typeof shoppingListItems.$inferSelect;

function itemSnapshot(
  i: ItemRow,
  ctx: { productName: string; listName: string },
  purchased: boolean,
) {
  return {
    listName: ctx.listName,
    productName: ctx.productName,
    quantity: i.quantity,
    unit: i.unit,
    note: i.note,
    status: purchased ? "Comprado" : "Pendiente",
    deletedAt: i.deletedAt,
  };
}

/**
 * Bloquea el producto de la lista (y su lista) y devuelve el gasto enlazado si
 * sigue vigente: un gasto borrado desde Economía deja el producto pendiente.
 */
async function lockItem(tx: Tx, itemId: string) {
  const [item] = await tx
    .select()
    .from(shoppingListItems)
    .where(and(eq(shoppingListItems.id, itemId), isNull(shoppingListItems.deletedAt)))
    .for("update");
  if (!item) return null;
  const list = await lockList(tx, item.listId);
  if (!list) return null;
  const product = await findProduct(tx, item.productId);
  const [expense] = item.expenseId
    ? await tx
        .select()
        .from(expenses)
        .where(and(eq(expenses.id, item.expenseId), isNull(expenses.deletedAt)))
        .for("update")
    : [];
  return { item, list, product, expense: expense ?? null };
}

function itemLabel(ctx: { productName: string; listName: string }) {
  return `«${ctx.productName}» en la lista «${ctx.listName}»`;
}

export async function addItem(
  listId: string,
  input: ListItemInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  if (!idSchema.safeParse(listId).success) return fail("Lista no válida");
  const parsed = listItemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const list = await lockList(tx, listId);
      if (!list) return "no-list" as const;
      if (list.closedAt) return "closed" as const;
      const product = await findProduct(tx, data.productId);
      if (!product || product.archivedAt) return "bad-product" as const;

      const [row] = await tx
        .insert(shoppingListItems)
        .values({
          listId,
          productId: data.productId,
          quantity: data.quantity ?? null,
          unit: data.unit,
          note: data.note,
          createdBy: user.id,
          updatedBy: user.id,
        })
        .returning();
      const ctx = { productName: product.productName, listName: list.name };
      await recordAudit(tx, {
        userId: user.id,
        action: "create",
        entity: "shopping_list_item",
        entityId: row.id,
        summary: `Apuntó ${itemLabel(ctx)}`,
        after: itemSnapshot(row, ctx, false),
      });
      return row.id;
    });

    if (result === "no-list") return fail("La lista no existe o fue eliminada");
    if (result === "closed") return fail(CLOSED);
    if (result === "bad-product") {
      return fail("El producto no existe o está archivado", { productId: ["Elige otro"] });
    }
    refresh();
    return ok({ id: result });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Ese producto ya está en la lista", { productId: ["Ya está en la lista"] });
    }
    throw error;
  }
}

/** Cambia cantidad prevista, unidad o nota (el producto no se cambia). */
export async function updateItem(itemId: string, input: ListItemInput): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(itemId).success) return fail("Producto no válido");
  const parsed = listItemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    const locked = await lockItem(tx, itemId);
    if (!locked) return "not-found" as const;
    const { item, list, product, expense } = locked;
    if (list.closedAt) return "closed" as const;

    const [row] = await tx
      .update(shoppingListItems)
      .set({
        quantity: data.quantity ?? null,
        unit: data.unit,
        note: data.note,
        updatedBy: user.id,
      })
      .where(eq(shoppingListItems.id, itemId))
      .returning();
    const ctx = { productName: product.productName, listName: list.name };
    await recordAudit(tx, {
      userId: user.id,
      action: "update",
      entity: "shopping_list_item",
      entityId: itemId,
      summary: itemLabel(ctx),
      before: itemSnapshot(item, ctx, !!expense),
      after: itemSnapshot(row, ctx, !!expense),
    });
    return "ok" as const;
  });

  if (result === "not-found") return fail("El producto ya no está en la lista");
  if (result === "closed") return fail(CLOSED);
  refresh();
  return ok(undefined);
}

export async function removeItem(itemId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(itemId).success) return fail("Producto no válido");

  const result = await db.transaction(async (tx) => {
    const locked = await lockItem(tx, itemId);
    if (!locked) return "not-found" as const;
    const { item, list, product, expense } = locked;
    if (list.closedAt) return "closed" as const;
    if (expense) return "purchased" as const;

    const [row] = await tx
      .update(shoppingListItems)
      .set({ deletedAt: new Date(), deletedBy: user.id, updatedBy: user.id })
      .where(eq(shoppingListItems.id, itemId))
      .returning();
    const ctx = { productName: product.productName, listName: list.name };
    await recordAudit(tx, {
      userId: user.id,
      action: "delete",
      entity: "shopping_list_item",
      entityId: itemId,
      summary: `Quitó ${itemLabel(ctx)}`,
      before: itemSnapshot(item, ctx, false),
      after: itemSnapshot(row, ctx, false),
    });
    return "ok" as const;
  });

  if (result === "not-found") return fail("El producto ya no está en la lista");
  if (result === "closed") return fail(CLOSED);
  if (result === "purchased") return fail("Ya está comprado: deshaz la compra antes de quitarlo");
  refresh();
  return ok(undefined);
}

/** Marca como comprado: registra el gasto en Economía y lo enlaza al producto. */
export async function purchaseItem(
  itemId: string,
  input: PurchaseInput,
): Promise<ActionResult<{ expenseId: string }>> {
  const user = await requireUser();
  if (!idSchema.safeParse(itemId).success) return fail("Producto no válido");
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    const locked = await lockItem(tx, itemId);
    if (!locked) return "not-found" as const;
    const { item, list, product, expense: previous } = locked;
    if (list.closedAt) return "closed" as const;
    if (previous) return "already" as const;

    // El producto pudo archivarse después de apuntarlo: la compra se acepta igual.
    const expense = await insertExpense(
      tx,
      user.id,
      { ...data, productId: item.productId },
      product,
      ` (lista «${list.name}»)`,
    );
    const [row] = await tx
      .update(shoppingListItems)
      .set({ expenseId: expense.id, updatedBy: user.id })
      .where(eq(shoppingListItems.id, itemId))
      .returning();
    const ctx = { productName: product.productName, listName: list.name };
    await recordAudit(tx, {
      userId: user.id,
      action: "update",
      entity: "shopping_list_item",
      entityId: itemId,
      summary: `Compró ${formatNumber(data.quantity)} ${data.unit} de ${itemLabel(ctx)}`,
      before: itemSnapshot(item, ctx, false),
      after: itemSnapshot(row, ctx, true),
    });
    return { expenseId: expense.id };
  });

  if (result === "not-found") return fail("El producto ya no está en la lista");
  if (result === "closed") return fail(CLOSED);
  if (result === "already") return fail("Ese producto ya está marcado como comprado");
  refresh({ economia: true });
  return ok(result);
}

/** Deshace la compra: anula (borrado lógico) el gasto y el producto vuelve a pendiente. */
export async function unpurchaseItem(itemId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!idSchema.safeParse(itemId).success) return fail("Producto no válido");

  const result = await db.transaction(async (tx) => {
    const locked = await lockItem(tx, itemId);
    if (!locked) return "not-found" as const;
    const { item, list, product, expense } = locked;
    if (list.closedAt) return "closed" as const;

    if (expense) {
      await softDeleteExpense(tx, user.id, expense, product, ` (lista «${list.name}»)`);
    }
    const [row] = await tx
      .update(shoppingListItems)
      .set({ expenseId: null, updatedBy: user.id })
      .where(eq(shoppingListItems.id, itemId))
      .returning();
    const ctx = { productName: product.productName, listName: list.name };
    await recordAudit(tx, {
      userId: user.id,
      action: "update",
      entity: "shopping_list_item",
      entityId: itemId,
      summary: `Deshizo la compra de ${itemLabel(ctx)}`,
      before: itemSnapshot(item, ctx, !!expense),
      after: itemSnapshot(row, ctx, false),
    });
    return "ok" as const;
  });

  if (result === "not-found") return fail("El producto ya no está en la lista");
  if (result === "closed") return fail(CLOSED);
  refresh({ economia: true });
  return ok(undefined);
}

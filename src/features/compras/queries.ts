import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, expenses, products, shoppingListItems, shoppingLists } from "@/db/schema";
import { ECONOMIA_TAG } from "@/features/economia/queries";
import { type Currency, sumMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

/**
 * Las listas se cachean bajo su propio tag y también bajo el de economía: el
 * estado “comprado” sale del gasto enlazado, así que editar o borrar un gasto
 * desde Economía también invalida las listas.
 */
export const COMPRAS_TAG = "compras";

function comprasCache() {
  cacheTag(COMPRAS_TAG, ECONOMIA_TAG);
  cacheLife("minutes");
}

export type ListItem = {
  id: string;
  listId: string;
  productId: string;
  productName: string;
  categoryName: string;
  quantity: number | null;
  unit: string;
  note: string | null;
  /** Gasto registrado al comprarlo; null si sigue pendiente (o si se borró el gasto). */
  purchase: {
    expenseId: string;
    occurredOn: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    currency: Currency;
    rate: number | null;
  } | null;
};

export type ListSummary = {
  id: string;
  name: string;
  createdAt: Date;
  closedAt: Date | null;
  itemCount: number;
  purchasedCount: number;
  /** Gastado por moneda. */
  spent: Record<Currency, number>;
  pending: ListItem[];
  purchased: ListItem[];
};

async function loadItems(listIds: string[]): Promise<ListItem[]> {
  if (listIds.length === 0) return [];
  const rows = await db
    .select({
      id: shoppingListItems.id,
      listId: shoppingListItems.listId,
      productId: shoppingListItems.productId,
      productName: products.name,
      categoryName: categories.name,
      quantity: shoppingListItems.quantity,
      unit: shoppingListItems.unit,
      note: shoppingListItems.note,
      expenseId: expenses.id,
      occurredOn: expenses.occurredOn,
      boughtQuantity: expenses.quantity,
      boughtUnit: expenses.unit,
      unitPrice: expenses.unitPrice,
      total: expenses.total,
      currency: expenses.currency,
      rate: expenses.rate,
    })
    .from(shoppingListItems)
    .innerJoin(products, eq(products.id, shoppingListItems.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(
      expenses,
      and(eq(expenses.id, shoppingListItems.expenseId), isNull(expenses.deletedAt)),
    )
    .where(and(inArray(shoppingListItems.listId, listIds), isNull(shoppingListItems.deletedAt)))
    .orderBy(asc(categories.sortOrder), asc(categories.name), asc(products.name));

  return rows.map((r) => ({
    id: r.id,
    listId: r.listId,
    productId: r.productId,
    productName: r.productName,
    categoryName: r.categoryName,
    quantity: r.quantity,
    unit: r.unit,
    note: r.note,
    purchase:
      r.expenseId === null
        ? null
        : {
            expenseId: r.expenseId,
            occurredOn: r.occurredOn!,
            quantity: r.boughtQuantity!,
            unit: r.boughtUnit!,
            unitPrice: r.unitPrice!,
            total: r.total!,
            currency: r.currency!,
            rate: r.rate,
          },
  }));
}

function spentIn(items: ListItem[], currency: Currency) {
  return sumMoney(
    items.filter((i) => i.purchase!.currency === currency).map((i) => i.purchase!.total),
  );
}

function summarize(
  list: { id: string; name: string; createdAt: Date; closedAt: Date | null },
  items: ListItem[],
): ListSummary {
  const own = items.filter((i) => i.listId === list.id);
  const purchased = own.filter((i) => i.purchase);
  return {
    ...list,
    itemCount: own.length,
    purchasedCount: purchased.length,
    spent: {
      CUP: spentIn(purchased, "CUP"),
      USD: spentIn(purchased, "USD"),
    },
    pending: own.filter((i) => !i.purchase),
    purchased,
  };
}

const listColumns = {
  id: shoppingLists.id,
  name: shoppingLists.name,
  createdAt: shoppingLists.createdAt,
  closedAt: shoppingLists.closedAt,
};

/** Listas abiertas, la más reciente primero (para Inicio y /compras). */
export async function listOpenLists(): Promise<ListSummary[]> {
  await requireUser();
  return listOpenListsCached();
}

async function listOpenListsCached(): Promise<ListSummary[]> {
  "use cache";
  comprasCache();
  const lists = await db
    .select(listColumns)
    .from(shoppingLists)
    .where(and(isNull(shoppingLists.closedAt), isNull(shoppingLists.deletedAt)))
    .orderBy(desc(shoppingLists.createdAt));
  const items = await loadItems(lists.map((l) => l.id));
  return lists.map((l) => summarize(l, items));
}

export const CLOSED_LISTS_LIMIT = 20;

/** Últimas listas cerradas. */
export async function listClosedLists(): Promise<ListSummary[]> {
  await requireUser();
  return listClosedListsCached();
}

async function listClosedListsCached(): Promise<ListSummary[]> {
  "use cache";
  comprasCache();
  const lists = await db
    .select(listColumns)
    .from(shoppingLists)
    .where(and(isNotNull(shoppingLists.closedAt), isNull(shoppingLists.deletedAt)))
    .orderBy(desc(shoppingLists.closedAt))
    .limit(CLOSED_LISTS_LIMIT);
  const items = await loadItems(lists.map((l) => l.id));
  return lists.map((l) => summarize(l, items));
}

/** Una lista con todos sus productos; null si no existe o está eliminada. */
export async function getList(id: string): Promise<ListSummary | null> {
  await requireUser();
  return getListCached(id);
}

async function getListCached(id: string): Promise<ListSummary | null> {
  "use cache";
  comprasCache();
  const [list] = await db
    .select(listColumns)
    .from(shoppingLists)
    .where(and(eq(shoppingLists.id, id), isNull(shoppingLists.deletedAt)));
  if (!list) return null;
  return summarize(list, await loadItems([list.id]));
}

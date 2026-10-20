import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { expenses, products, softDelete, tracking } from "./economia";

/** Lista de la compra. Abierta mientras `closedAt` es null. */
export const shoppingLists = pgTable(
  "shopping_lists",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    closedAt: timestamp({ withTimezone: true }),
    closedBy: text().references(() => user.id),
    ...softDelete(),
    ...tracking(),
  },
  (t) => [index("shopping_lists_closed_at_idx").on(t.closedAt)],
);

/**
 * Producto apuntado en una lista. Pendiente mientras no tenga gasto; al comprarlo
 * se registra un gasto (fuente de verdad de cantidad y precio) y se enlaza aquí.
 */
export const shoppingListItems = pgTable(
  "shopping_list_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    listId: uuid()
      .notNull()
      .references(() => shoppingLists.id),
    productId: uuid()
      .notNull()
      .references(() => products.id),
    /** Cantidad prevista (opcional). */
    quantity: numeric({ precision: 12, scale: 3, mode: "number" }),
    unit: text().notNull(),
    note: text(),
    expenseId: uuid().references(() => expenses.id),
    ...softDelete(),
    ...tracking(),
  },
  (t) => [
    index("shopping_list_items_list_idx").on(t.listId),
    uniqueIndex("shopping_list_items_list_product_unique")
      .on(t.listId, t.productId)
      .where(sql`${t.deletedAt} is null`),
    uniqueIndex("shopping_list_items_expense_unique")
      .on(t.expenseId)
      .where(sql`${t.expenseId} is not null`),
    check("shopping_list_items_quantity_positive", sql`${t.quantity} is null or ${t.quantity} > 0`),
  ],
);

export const shoppingListsRelations = relations(shoppingLists, ({ many }) => ({
  items: many(shoppingListItems),
}));

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
  list: one(shoppingLists, { fields: [shoppingListItems.listId], references: [shoppingLists.id] }),
  product: one(products, { fields: [shoppingListItems.productId], references: [products.id] }),
  expense: one(expenses, { fields: [shoppingListItems.expenseId], references: [expenses.id] }),
}));

import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/** Quién y cuándo creó/modificó la fila. */
const tracking = () => ({
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  createdBy: text()
    .notNull()
    .references(() => user.id),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  updatedBy: text()
    .notNull()
    .references(() => user.id),
});

/** Borrado lógico: los registros nunca se eliminan físicamente. */
const softDelete = () => ({
  deletedAt: timestamp({ withTimezone: true }),
  deletedBy: text().references(() => user.id),
});

/** Archivado para el catálogo: deja de ofrecerse, pero el histórico se conserva. */
const archivable = () => ({
  archivedAt: timestamp({ withTimezone: true }),
  archivedBy: text().references(() => user.id),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    sortOrder: integer().notNull().default(0),
    ...archivable(),
    ...tracking(),
  },
  (t) => [uniqueIndex("categories_name_unique").on(sql`lower(${t.name})`)],
);

export const products = pgTable(
  "products",
  {
    id: uuid().primaryKey().defaultRandom(),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id),
    name: text().notNull(),
    defaultUnit: text().notNull(),
    ...archivable(),
    ...tracking(),
  },
  (t) => [
    uniqueIndex("products_name_unique").on(sql`lower(${t.name})`),
    index("products_category_idx").on(t.categoryId),
  ],
);

/** Venta de USD a cambio de CUP: suma al saldo en CUP. */
export const currencyExchanges = pgTable(
  "currency_exchanges",
  {
    id: uuid().primaryKey().defaultRandom(),
    occurredOn: date({ mode: "string" }).notNull(),
    usdAmount: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    /** CUP recibidos por cada USD. */
    rate: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    /** usdAmount × rate, calculado en el servidor. */
    cupAmount: numeric({ precision: 14, scale: 2, mode: "number" }).notNull(),
    note: text(),
    ...softDelete(),
    ...tracking(),
  },
  (t) => [
    index("currency_exchanges_occurred_on_idx").on(t.occurredOn),
    check("currency_exchanges_usd_positive", sql`${t.usdAmount} > 0`),
    check("currency_exchanges_rate_positive", sql`${t.rate} > 0`),
  ],
);

/** Gasto en CUP: resta del saldo. */
export const expenses = pgTable(
  "expenses",
  {
    id: uuid().primaryKey().defaultRandom(),
    occurredOn: date({ mode: "string" }).notNull(),
    productId: uuid()
      .notNull()
      .references(() => products.id),
    quantity: numeric({ precision: 12, scale: 3, mode: "number" }).notNull(),
    /** Unidad en el momento del gasto (copia de la unidad del producto). */
    unit: text().notNull(),
    unitPrice: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    /** quantity × unitPrice, calculado en el servidor. */
    total: numeric({ precision: 14, scale: 2, mode: "number" }).notNull(),
    note: text(),
    ...softDelete(),
    ...tracking(),
  },
  (t) => [
    index("expenses_occurred_on_idx").on(t.occurredOn),
    index("expenses_product_idx").on(t.productId),
    check("expenses_quantity_positive", sql`${t.quantity} > 0`),
    check("expenses_unit_price_non_negative", sql`${t.unitPrice} >= 0`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  expenses: many(expenses),
}));

export const currencyExchangesRelations = relations(currencyExchanges, ({ one }) => ({
  creator: one(user, { fields: [currencyExchanges.createdBy], references: [user.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  product: one(products, { fields: [expenses.productId], references: [products.id] }),
  creator: one(user, { fields: [expenses.createdBy], references: [user.id] }),
}));

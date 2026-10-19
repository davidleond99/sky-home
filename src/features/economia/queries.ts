import "server-only";
import { and, asc, desc, eq, gte, isNull, lte, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, currencyExchanges, expenses, products, user } from "@/db/schema";
import { sumMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";

const num = (column: SQL) => sql<number>`coalesce(${column}, 0)`.mapWith(Number);

// ─── Saldo ───

export async function getBalance() {
  await requireUser();
  const [[income], [spent]] = await Promise.all([
    db
      .select({
        cup: num(sql`sum(${currencyExchanges.cupAmount})`),
        usd: num(sql`sum(${currencyExchanges.usdAmount})`),
      })
      .from(currencyExchanges)
      .where(isNull(currencyExchanges.deletedAt)),
    db
      .select({ cup: num(sql`sum(${expenses.total})`) })
      .from(expenses)
      .where(isNull(expenses.deletedAt)),
  ]);
  return {
    cupIn: income.cup,
    cupOut: spent.cup,
    usdSold: income.usd,
    balance: sumMoney([income.cup, -spent.cup]),
  };
}

// ─── Filtros compartidos ───

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" || v === "all" ? undefined : v), schema.optional());

export const movementFiltersSchema = z.object({
  from: optional(z.iso.date()).catch(undefined),
  to: optional(z.iso.date()).catch(undefined),
  user: optional(z.string()),
  kind: optional(z.enum(["exchange", "expense"])).catch(undefined),
  category: optional(z.uuid()).catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

export type MovementFilters = z.infer<typeof movementFiltersSchema>;

export const PAGE_SIZE = 50;

// ─── Movimientos (ventas + gastos) con saldo acumulado ───

export type Movement = {
  kind: "exchange" | "expense";
  id: string;
  occurredOn: string;
  createdAt: Date;
  /** Positivo si entra CUP, negativo si sale. */
  amount: number;
  /** Saldo en CUP después de este movimiento (sobre todos los movimientos, sin filtros). */
  balance: number;
  usdAmount: number | null;
  rate: number | null;
  productId: string | null;
  productName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  note: string | null;
  userId: string;
  userName: string;
};

type MovementRow = Record<keyof Movement, unknown>;

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function listMovements(filters: MovementFilters) {
  await requireUser();

  const where: SQL[] = [sql`true`];
  if (filters.from) where.push(sql`b.occurred_on >= ${filters.from}`);
  if (filters.to) where.push(sql`b.occurred_on <= ${filters.to}`);
  if (filters.user) where.push(sql`b.created_by = ${filters.user}`);
  if (filters.kind) where.push(sql`b.kind = ${filters.kind}`);
  if (filters.category) where.push(sql`b.category_id = ${filters.category}`);

  const result = await db.execute<MovementRow>(sql`
    with m as (
      select 'exchange'::text as kind, e.id, e.occurred_on, e.created_at, e.cup_amount as amount,
             e.usd_amount, e.rate, null::uuid as product_id, null::text as product_name,
             null::uuid as category_id, null::text as category_name, null::numeric as quantity,
             null::text as unit, null::numeric as unit_price, e.note, e.created_by
        from ${currencyExchanges} e
       where e.deleted_at is null
      union all
      select 'expense', x.id, x.occurred_on, x.created_at, -x.total,
             null, null, p.id, p.name, c.id, c.name, x.quantity, x.unit, x.unit_price, x.note, x.created_by
        from ${expenses} x
        join ${products} p on p.id = x.product_id
        join ${categories} c on c.id = p.category_id
       where x.deleted_at is null
    ),
    b as (
      select m.*, sum(m.amount) over (
               order by m.occurred_on, m.created_at, m.id
               rows between unbounded preceding and current row
             ) as balance
        from m
    )
    select b.kind, b.id, b.occurred_on as "occurredOn", b.created_at as "createdAt", b.amount,
           b.balance, b.usd_amount as "usdAmount", b.rate, b.product_id as "productId",
           b.product_name as "productName", b.category_id as "categoryId",
           b.category_name as "categoryName", b.quantity, b.unit, b.unit_price as "unitPrice",
           b.note, b.created_by as "userId", u.name as "userName"
      from b
      join ${user} u on u.id = b.created_by
     where ${sql.join(where, sql` and `)}
     order by b.occurred_on desc, b.created_at desc, b.id desc
     limit ${PAGE_SIZE + 1} offset ${(filters.page - 1) * PAGE_SIZE}
  `);

  const rows: Movement[] = result.rows.map((r) => ({
    kind: r.kind as Movement["kind"],
    id: String(r.id),
    occurredOn: toIsoDay(r.occurredOn),
    createdAt: new Date(r.createdAt as string),
    amount: Number(r.amount),
    balance: Number(r.balance),
    usdAmount: n(r.usdAmount),
    rate: n(r.rate),
    productId: (r.productId as string | null) ?? null,
    productName: (r.productName as string | null) ?? null,
    categoryId: (r.categoryId as string | null) ?? null,
    categoryName: (r.categoryName as string | null) ?? null,
    quantity: n(r.quantity),
    unit: (r.unit as string | null) ?? null,
    unitPrice: n(r.unitPrice),
    note: (r.note as string | null) ?? null,
    userId: String(r.userId),
    userName: String(r.userName),
  }));

  return { rows: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

/** node-postgres devuelve `date` como string "YYYY-MM-DD" o como Date según la configuración. */
function toIsoDay(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

// ─── Ventas de USD ───

export async function listExchanges(filters: Pick<MovementFilters, "from" | "to" | "user">) {
  await requireUser();
  const where: SQL[] = [isNull(currencyExchanges.deletedAt)];
  if (filters.from) where.push(gte(currencyExchanges.occurredOn, filters.from));
  if (filters.to) where.push(lte(currencyExchanges.occurredOn, filters.to));
  if (filters.user) where.push(eq(currencyExchanges.createdBy, filters.user));

  return db
    .select({
      id: currencyExchanges.id,
      occurredOn: currencyExchanges.occurredOn,
      usdAmount: currencyExchanges.usdAmount,
      rate: currencyExchanges.rate,
      cupAmount: currencyExchanges.cupAmount,
      note: currencyExchanges.note,
      createdAt: currencyExchanges.createdAt,
      userName: user.name,
    })
    .from(currencyExchanges)
    .innerJoin(user, eq(user.id, currencyExchanges.createdBy))
    .where(and(...where))
    .orderBy(desc(currencyExchanges.occurredOn), desc(currencyExchanges.createdAt));
}

export type ExchangeListItem = Awaited<ReturnType<typeof listExchanges>>[number];

// ─── Gastos ───

export async function listExpenses(
  filters: Pick<MovementFilters, "from" | "to" | "user" | "category">,
) {
  await requireUser();
  const where: SQL[] = [isNull(expenses.deletedAt)];
  if (filters.from) where.push(gte(expenses.occurredOn, filters.from));
  if (filters.to) where.push(lte(expenses.occurredOn, filters.to));
  if (filters.user) where.push(eq(expenses.createdBy, filters.user));
  if (filters.category) where.push(eq(products.categoryId, filters.category));

  return db
    .select({
      id: expenses.id,
      occurredOn: expenses.occurredOn,
      productId: expenses.productId,
      productName: products.name,
      categoryName: categories.name,
      quantity: expenses.quantity,
      unit: expenses.unit,
      unitPrice: expenses.unitPrice,
      total: expenses.total,
      note: expenses.note,
      createdAt: expenses.createdAt,
      userName: user.name,
    })
    .from(expenses)
    .innerJoin(products, eq(products.id, expenses.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .innerJoin(user, eq(user.id, expenses.createdBy))
    .where(and(...where))
    .orderBy(desc(expenses.occurredOn), desc(expenses.createdAt));
}

export type ExpenseListItem = Awaited<ReturnType<typeof listExpenses>>[number];

// ─── Catálogo ───

export type ProductOption = {
  id: string;
  name: string;
  defaultUnit: string;
  categoryId: string;
  categoryName: string;
  lastPrice: number | null;
  lastUnit: string | null;
};

/** Productos activos, ordenados por categoría, con el último precio pagado. */
export async function listProductOptions(): Promise<ProductOption[]> {
  await requireUser();
  const [items, lastPrices] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        defaultUnit: products.defaultUnit,
        categoryId: categories.id,
        categoryName: categories.name,
      })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(isNull(products.archivedAt), isNull(categories.archivedAt)))
      .orderBy(asc(categories.sortOrder), asc(categories.name), asc(products.name)),
    db
      .selectDistinctOn([expenses.productId], {
        productId: expenses.productId,
        unitPrice: expenses.unitPrice,
        unit: expenses.unit,
      })
      .from(expenses)
      .where(isNull(expenses.deletedAt))
      .orderBy(expenses.productId, desc(expenses.occurredOn), desc(expenses.createdAt)),
  ]);

  const last = new Map(lastPrices.map((p) => [p.productId, p]));
  return items.map((p) => ({
    ...p,
    lastPrice: last.get(p.id)?.unitPrice ?? null,
    lastUnit: last.get(p.id)?.unit ?? null,
  }));
}

export type CategoryOption = { id: string; name: string };

export async function listActiveCategories(): Promise<CategoryOption[]> {
  await requireUser();
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(isNull(categories.archivedAt))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

/** Catálogo completo (incluye archivados) para la pantalla de gestión. */
export async function getCatalog() {
  await requireUser();
  const [cats, prods, usage] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(products).orderBy(asc(products.name)),
    db
      .select({ productId: expenses.productId, count: sql<number>`count(*)::int` })
      .from(expenses)
      .where(isNull(expenses.deletedAt))
      .groupBy(expenses.productId),
  ]);
  const uses = new Map(usage.map((u) => [u.productId, u.count]));

  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    archived: c.archivedAt !== null,
    products: prods
      .filter((p) => p.categoryId === c.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        defaultUnit: p.defaultUnit,
        categoryId: p.categoryId,
        archived: p.archivedAt !== null,
        uses: uses.get(p.id) ?? 0,
      })),
  }));
}

export type CatalogCategory = Awaited<ReturnType<typeof getCatalog>>[number];
export type CatalogProduct = CatalogCategory["products"][number];

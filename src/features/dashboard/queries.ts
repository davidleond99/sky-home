import "server-only";
import { and, desc, eq, gte, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, currencyExchanges, expenses, products } from "@/db/schema";
import { balanceTotals, economiaCache } from "@/features/economia/queries";
import { todayIso } from "@/lib/dates";
import { fromCents, toCents } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { daysBetween, lastMonths, type Period, periodStart, previousWindow } from "./period";
import { categorySlots, pivotMonthly } from "./pivot";

const money = (expr: SQL) => sql<number>`coalesce(${expr}, 0)`.mapWith(Number);

export async function getDashboard(period: Period) {
  await requireUser();
  // La fecha de hoy se resuelve fuera de la caché: forma parte de la clave.
  const today = todayIso();
  return getDashboardCached(periodStart(period, today), today, lastMonths(6, today));
}

async function getDashboardCached(from: string | null, today: string, months: string[]) {
  "use cache";
  economiaCache();

  const expenseInPeriod = and(
    isNull(expenses.deletedAt),
    from ? gte(expenses.occurredOn, from) : undefined,
  );

  const sinceFrom = from ? sql`and occurred_on >= ${from}` : sql``;
  const prev = from ? previousWindow(from, today) : null;

  const [
    balance,
    {
      rows: [period],
    },
    categoryTotals,
    monthlyRows,
    balanceSeries,
    topProducts,
  ] = await Promise.all([
    balanceTotals(),

    // Gasto del periodo y del periodo anterior equivalente en una sola query.
    db.execute<{
      spent: string;
      count: number;
      prev_spent: string | null;
      first_day: string | null;
    }>(sql`
      select
        (select coalesce(sum(total), 0) from ${expenses}
          where deleted_at is null ${sinceFrom}) as spent,
        (select count(*)::int from ${expenses}
          where deleted_at is null ${sinceFrom}) as count,
        ${
          prev
            ? sql`(select coalesce(sum(total), 0) from ${expenses}
                where deleted_at is null
                  and occurred_on between ${prev.prevFrom} and ${prev.prevTo})`
            : sql`null`
        } as prev_spent,
        (select to_char(min(occurred_on), 'YYYY-MM-DD') from ${expenses}
          where deleted_at is null) as first_day
    `),

    // Por categoría: el total histórico fija qué categorías tienen color propio;
    // el del periodo alimenta el donut.
    db
      .select({
        name: categories.name,
        total: money(
          from
            ? sql`sum(${expenses.total}) filter (where ${expenses.occurredOn} >= ${from})`
            : sql`sum(${expenses.total})`,
        ),
      })
      .from(expenses)
      .innerJoin(products, eq(products.id, expenses.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(isNull(expenses.deletedAt))
      .groupBy(categories.name)
      .orderBy(desc(sql`sum(${expenses.total})`)),

    db
      .select({
        month: sql<string>`to_char(${expenses.occurredOn}, 'YYYY-MM')`,
        category: categories.name,
        total: money(sql`sum(${expenses.total})`),
      })
      .from(expenses)
      .innerJoin(products, eq(products.id, expenses.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(isNull(expenses.deletedAt), gte(expenses.occurredOn, `${months[0]}-01`)))
      .groupBy(sql`1`, categories.name),

    // Saldo al cierre de cada día con movimientos (acumulado histórico).
    db.execute<{ day: string; balance: string }>(sql`
      with daily as (
        select occurred_on as day, cup_amount as net from ${currencyExchanges} where deleted_at is null
        union all
        select occurred_on, -total from ${expenses} where deleted_at is null
      ),
      agg as (select day, sum(net) as net from daily group by day),
      run as (select day, sum(net) over (order by day) as balance from agg)
      select to_char(day, 'YYYY-MM-DD') as day, balance from run
      ${from ? sql`where day >= ${from}` : sql``}
      order by day
    `),

    db
      .select({
        name: products.name,
        total: money(sql`sum(${expenses.total})`),
      })
      .from(expenses)
      .innerJoin(products, eq(products.id, expenses.productId))
      .where(expenseInPeriod)
      .groupBy(products.name)
      .orderBy(desc(sql`sum(${expenses.total})`))
      .limit(5),
  ]);

  const { slots, keyOf } = categorySlots(categoryTotals.map((c) => c.name));
  const byCategory = categoryTotals.filter((c) => c.total > 0).sort((x, y) => y.total - x.total);
  const keys = slots.map((s) => s.key);

  // Donut: agrega el periodo por slot (las que no están en el top van a «Otras»).
  const bySlot = new Map<string, number>();
  for (const c of byCategory) bySlot.set(keyOf(c.name), (bySlot.get(keyOf(c.name)) ?? 0) + c.total);
  const categoryShare = slots
    .map((s) => ({ ...s, total: Math.round((bySlot.get(s.key) ?? 0) * 100) / 100 }))
    .filter((s) => s.total > 0);

  // Promedio diario: en «Todo» se cuenta desde el primer gasto registrado.
  const cupSpent = Number(period.spent);
  const days = daysBetween(from ?? period.first_day ?? today, today);
  const perDay = (total: number) => fromCents(Math.round(toCents(total) / days));

  return {
    kpis: {
      balance: balance.balance,
      cupSpent,
      expenseCount: Number(period.count),
      days,
      dailyAverage: perDay(cupSpent),
      prevDailyAverage: period.prev_spent === null ? null : perDay(Number(period.prev_spent)),
    },
    slots,
    categoryShare,
    categoryDetail: byCategory,
    monthly: pivotMonthly(months, monthlyRows, keyOf, keys),
    balanceSeries: balanceSeries.rows.map((r) => ({ day: r.day, balance: Number(r.balance) })),
    topProducts,
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

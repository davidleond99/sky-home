import "server-only";
import { and, desc, eq, gte, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, currencyExchanges, expenses, products, user } from "@/db/schema";
import { getBalance } from "@/features/economia/queries";
import { requireUser } from "@/lib/session";
import { lastMonths, type Period, periodStart } from "./period";
import { categorySlots, pivotMonthly } from "./pivot";

const money = (expr: SQL) => sql<number>`coalesce(${expr}, 0)`.mapWith(Number);

export async function getDashboard(period: Period) {
  await requireUser();
  const from = periodStart(period);
  const months = lastMonths(6);

  const exchangeInPeriod = and(
    isNull(currencyExchanges.deletedAt),
    from ? gte(currencyExchanges.occurredOn, from) : undefined,
  );
  const expenseInPeriod = and(
    isNull(expenses.deletedAt),
    from ? gte(expenses.occurredOn, from) : undefined,
  );

  const [
    balance,
    [income],
    [spent],
    categoryRanking,
    byCategory,
    monthlyRows,
    balanceSeries,
    rateSeries,
    byPerson,
    topProducts,
  ] = await Promise.all([
    getBalance(),

    db
      .select({
        usd: money(sql`sum(${currencyExchanges.usdAmount})`),
        cup: money(sql`sum(${currencyExchanges.cupAmount})`),
      })
      .from(currencyExchanges)
      .where(exchangeInPeriod),

    db
      .select({ cup: money(sql`sum(${expenses.total})`), count: sql<number>`count(*)::int` })
      .from(expenses)
      .where(expenseInPeriod),

    // Ranking histórico: fija qué categorías tienen color propio.
    db
      .select({ name: categories.name })
      .from(expenses)
      .innerJoin(products, eq(products.id, expenses.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(isNull(expenses.deletedAt))
      .groupBy(categories.name)
      .orderBy(desc(sql`sum(${expenses.total})`)),

    db
      .select({ name: categories.name, total: money(sql`sum(${expenses.total})`) })
      .from(expenses)
      .innerJoin(products, eq(products.id, expenses.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(expenseInPeriod)
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
        day: sql<string>`to_char(${currencyExchanges.occurredOn}, 'YYYY-MM-DD')`,
        rate: money(
          sql`round(sum(${currencyExchanges.cupAmount}) / sum(${currencyExchanges.usdAmount}), 2)`,
        ),
      })
      .from(currencyExchanges)
      .where(exchangeInPeriod)
      .groupBy(sql`1`)
      .orderBy(sql`1`),

    db
      .select({ name: user.name, total: money(sql`sum(${expenses.total})`) })
      .from(expenses)
      .innerJoin(user, eq(user.id, expenses.createdBy))
      .where(expenseInPeriod)
      .groupBy(user.name)
      .orderBy(desc(sql`sum(${expenses.total})`)),

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

  const { slots, keyOf } = categorySlots(categoryRanking.map((c) => c.name));
  const keys = slots.map((s) => s.key);

  // Donut: agrega el periodo por slot (las que no están en el top van a «Otras»).
  const bySlot = new Map<string, number>();
  for (const c of byCategory) bySlot.set(keyOf(c.name), (bySlot.get(keyOf(c.name)) ?? 0) + c.total);
  const categoryShare = slots
    .map((s) => ({ ...s, total: Math.round((bySlot.get(s.key) ?? 0) * 100) / 100 }))
    .filter((s) => s.total > 0);

  return {
    kpis: {
      balance: balance.balance,
      usdSold: income.usd,
      cupIn: income.cup,
      cupSpent: spent.cup,
      expenseCount: spent.count,
      avgRate: income.usd > 0 ? Math.round((income.cup / income.usd) * 100) / 100 : null,
    },
    slots,
    categoryShare,
    categoryDetail: byCategory,
    monthly: pivotMonthly(months, monthlyRows, keyOf, keys),
    balanceSeries: balanceSeries.rows.map((r) => ({ day: r.day, balance: Number(r.balance) })),
    rateSeries,
    byPerson,
    topProducts,
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

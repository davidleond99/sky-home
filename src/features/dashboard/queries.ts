import "server-only";
import { and, desc, eq, gte, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, currencyExchanges, expenses, products } from "@/db/schema";
import { balanceTotals, economiaCache } from "@/features/economia/queries";
import { todayIso } from "@/lib/dates";
import { type Currency, fromCents, toCents } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { daysBetween, lastMonths, type Period, periodStart, previousWindow } from "./period";
import { categorySlots, pivotMonthly } from "./pivot";

const money = (expr: SQL) => sql<number>`coalesce(${expr}, 0)`.mapWith(Number);

/** Inicio: gasto en CUP y saldo. */
export async function getDashboard(period: Period) {
  await requireUser();
  // La fecha de hoy se resuelve fuera de la caché: forma parte de la clave.
  const today = todayIso();
  return getDashboardCached(periodStart(period, today), today, lastMonths(6, today));
}

async function getDashboardCached(from: string | null, today: string, months: string[]) {
  "use cache";
  economiaCache();

  const [balance, spending, balanceSeries] = await Promise.all([
    balanceTotals(),
    spendingIn("CUP", from, today, months),

    // Saldo al cierre de cada día con movimientos (acumulado histórico).
    db.execute<{ day: string; balance: string }>(sql`
      with daily as (
        select occurred_on as day, cup_amount as net from ${currencyExchanges} where deleted_at is null
        union all
        select occurred_on, -total from ${expenses} where deleted_at is null and currency = 'CUP'
      ),
      agg as (select day, sum(net) as net from daily group by day),
      run as (select day, sum(net) over (order by day) as balance from agg)
      select to_char(day, 'YYYY-MM-DD') as day, balance from run
      ${from ? sql`where day >= ${from}` : sql``}
      order by day
    `),
  ]);

  return {
    ...spending,
    kpis: { ...spending.kpis, balance: balance.balance },
    balanceSeries: balanceSeries.rows.map((r) => ({ day: r.day, balance: Number(r.balance) })),
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/** Dólares: gasto en USD, su equivalente en CUP y las tasas a las que se vendió USD. */
export async function getUsdDashboard(period: Period) {
  await requireUser();
  const today = todayIso();
  return getUsdDashboardCached(periodStart(period, today), today, lastMonths(6, today));
}

async function getUsdDashboardCached(from: string | null, today: string, months: string[]) {
  "use cache";
  economiaCache();

  const exchangeInPeriod = and(
    isNull(currencyExchanges.deletedAt),
    from ? gte(currencyExchanges.occurredOn, from) : undefined,
  );

  const [spending, [cupEq], [rates], [last], rateSeries] = await Promise.all([
    spendingIn("USD", from, today, months),

    db
      .select({ total: money(sql`sum(round(${expenses.total} * ${expenses.rate}, 2))`) })
      .from(expenses)
      .where(
        and(
          isNull(expenses.deletedAt),
          eq(expenses.currency, "USD"),
          from ? gte(expenses.occurredOn, from) : undefined,
        ),
      ),

    // Tasa media ponderada de las ventas del periodo.
    db
      .select({
        usd: money(sql`sum(${currencyExchanges.usdAmount})`),
        cup: money(sql`sum(${currencyExchanges.cupAmount})`),
      })
      .from(currencyExchanges)
      .where(exchangeInPeriod),

    db
      .select({ rate: currencyExchanges.rate, occurredOn: currencyExchanges.occurredOn })
      .from(currencyExchanges)
      .where(isNull(currencyExchanges.deletedAt))
      .orderBy(desc(currencyExchanges.occurredOn), desc(currencyExchanges.createdAt))
      .limit(1),

    // Tasa media de cada día con ventas.
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
  ]);

  return {
    ...spending,
    kpis: {
      ...spending.kpis,
      cupEquivalent: cupEq.total,
      avgRate: rates.usd > 0 ? Math.round((rates.cup / rates.usd) * 100) / 100 : null,
      usdSold: rates.usd,
      lastRate: last?.rate ?? null,
      lastRateOn: last?.occurredOn ?? null,
    },
    rateSeries,
  };
}

export type UsdDashboard = Awaited<ReturnType<typeof getUsdDashboard>>;

/** Gasto de una moneda: KPIs, categorías, meses y top productos. Llamar desde una función cacheada. */
async function spendingIn(
  currency: Currency,
  from: string | null,
  today: string,
  months: string[],
) {
  const inCurrency = and(isNull(expenses.deletedAt), eq(expenses.currency, currency));
  const expenseInPeriod = and(inCurrency, from ? gte(expenses.occurredOn, from) : undefined);

  const base = sql`deleted_at is null and currency = ${currency}`;
  const sinceFrom = from ? sql`and occurred_on >= ${from}` : sql``;
  const prev = from ? previousWindow(from, today) : null;

  const [
    {
      rows: [period],
    },
    categoryTotals,
    monthlyRows,
    topProducts,
  ] = await Promise.all([
    // Gasto del periodo y del periodo anterior equivalente en una sola query.
    db.execute<{
      spent: string;
      count: number;
      prev_spent: string | null;
      first_day: string | null;
    }>(sql`
      select
        (select coalesce(sum(total), 0) from ${expenses}
          where ${base} ${sinceFrom}) as spent,
        (select count(*)::int from ${expenses}
          where ${base} ${sinceFrom}) as count,
        ${
          prev
            ? sql`(select coalesce(sum(total), 0) from ${expenses}
                where ${base}
                  and occurred_on between ${prev.prevFrom} and ${prev.prevTo})`
            : sql`null`
        } as prev_spent,
        (select to_char(min(occurred_on), 'YYYY-MM-DD') from ${expenses}
          where ${base}) as first_day
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
      .where(inCurrency)
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
      .where(and(inCurrency, gte(expenses.occurredOn, `${months[0]}-01`)))
      .groupBy(sql`1`, categories.name),

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
  const spent = Number(period.spent);
  const days = daysBetween(from ?? period.first_day ?? today, today);
  const perDay = (total: number) => fromCents(Math.round(toCents(total) / days));

  return {
    kpis: {
      spent,
      expenseCount: Number(period.count),
      days,
      dailyAverage: perDay(spent),
      prevDailyAverage: period.prev_spent === null ? null : perDay(Number(period.prev_spent)),
    },
    slots,
    categoryShare,
    monthly: pivotMonthly(months, monthlyRows, keyOf, keys),
    topProducts,
  };
}

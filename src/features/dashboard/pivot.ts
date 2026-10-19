/** Número de categorías con color propio; el resto se agrupa en «Otras». */
export const TOP_CATEGORIES = 5;
export const OTHER_KEY = "other";

export type CategorySlot = { key: string; name: string; color: string };

/**
 * Asigna slots de color estables a las categorías con más gasto histórico.
 * El color sigue a la categoría (no a su posición en el periodo filtrado).
 */
export function categorySlots(rankedNames: string[]): {
  slots: CategorySlot[];
  keyOf: (name: string) => string;
} {
  const top = rankedNames.slice(0, TOP_CATEGORIES);
  const slots: CategorySlot[] = top.map((name, i) => ({
    key: `c${i}`,
    name,
    color: `var(--chart-${i + 1})`,
  }));
  if (rankedNames.length > TOP_CATEGORIES) {
    slots.push({ key: OTHER_KEY, name: "Otras", color: `var(--chart-${TOP_CATEGORIES + 1})` });
  }
  const index = new Map(top.map((name, i) => [name, `c${i}`]));
  return { slots, keyOf: (name) => index.get(name) ?? OTHER_KEY };
}

/** Pivota filas (mes, categoría, total) a una fila por mes con una columna por slot. */
export function pivotMonthly(
  months: string[],
  rows: { month: string; category: string; total: number }[],
  keyOf: (name: string) => string,
  keys: string[],
) {
  const byMonth = new Map(
    months.map((month) => [
      month,
      Object.fromEntries(keys.map((k) => [k, 0])) as Record<string, number>,
    ]),
  );
  for (const row of rows) {
    const bucket = byMonth.get(row.month);
    if (!bucket) continue;
    const key = keyOf(row.category);
    bucket[key] = Math.round(((bucket[key] ?? 0) + row.total) * 100) / 100;
  }
  return months.map((month) => ({ month, ...byMonth.get(month)! }));
}

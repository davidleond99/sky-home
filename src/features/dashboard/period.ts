import { z } from "zod";
import { todayIso } from "@/lib/dates";

export const PERIODS = [
  { value: "month", label: "Este mes" },
  { value: "3m", label: "3 meses" },
  { value: "year", label: "Este año" },
  { value: "all", label: "Todo" },
] as const;

export type Period = (typeof PERIODS)[number]["value"];

export const periodSchema = z
  .enum(PERIODS.map((p) => p.value) as [Period, ...Period[]])
  .catch("month");

/** Primer día (YYYY-MM-DD, hora de Cuba) del periodo, o null para "todo". */
export function periodStart(period: Period, today: string = todayIso()): string | null {
  const [y, m] = today.split("-").map(Number);
  const iso = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}-01`;
  switch (period) {
    case "month":
      return iso(y, m);
    case "3m": {
      const d = new Date(Date.UTC(y, m - 1 - 2, 1));
      return iso(d.getUTCFullYear(), d.getUTCMonth() + 1);
    }
    case "year":
      return iso(y, 1);
    case "all":
      return null;
  }
}

/** Los últimos `count` meses como "YYYY-MM", del más antiguo al actual. */
export function lastMonths(count: number, today: string = todayIso()): string[] {
  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

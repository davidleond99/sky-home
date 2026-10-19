export const TIME_ZONE = "America/Havana";
const LOCALE = "es-ES";

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const isoDayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "19 oct 2026, 16:05" en hora de Cuba. */
export function formatDateTime(value: Date | string) {
  return dateTimeFmt.format(new Date(value));
}

/** Fecha de hoy en Cuba como "YYYY-MM-DD". */
export function todayIso(now: Date = new Date()) {
  return isoDayFmt.format(now);
}

/** "2026-10-19" → "19 oct 2026" (sin desfase por zona horaria). */
export function formatDay(isoDay: string) {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "2026-10" → "oct 2026". */
export function formatMonth(isoMonth: string) {
  const [y, m] = isoMonth.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/**
 * Aritmética de dinero en enteros (centavos) para evitar errores de coma flotante.
 * Las columnas en BD son numeric(…, 2); aquí solo se calcula y se formatea.
 */

/** Escala un decimal a entero usando notación exponencial (evita 1.005*100 = 100.49999…). */
function scale(value: number, decimals: number) {
  return Math.round(Number(`${value}e${decimals}`));
}

export function toCents(value: number) {
  return scale(value, 2);
}

export function fromCents(cents: number) {
  return cents / 100;
}

/**
 * Multiplica una cantidad (hasta 3 decimales) por un precio (2 decimales) y
 * redondea al centavo más cercano: 2.5 lb × 250,25 = 625,63.
 */
export function multiplyMoney(quantity: number, price: number) {
  const milli = scale(quantity, 3);
  const cents = toCents(price);
  return fromCents(Math.round((milli * cents) / 1000));
}

/** Suma exacta de importes. */
export function sumMoney(values: number[]) {
  return fromCents(values.reduce((acc, v) => acc + toCents(v), 0));
}

/** true si el número no tiene más de `decimals` decimales. */
export function hasMaxDecimals(value: number, decimals: number) {
  return Number.isFinite(value) && Math.abs(Number(`${value}e${decimals}`) % 1) < 1e-9;
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, fractionDigits: number) {
  const key = `${currency}:${fractionDigits}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping: "always",
    });
    formatters.set(key, f);
  }
  return f;
}

export const CURRENCIES = ["CUP", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** "40.000 CUP", "39.500,50 CUP" (decimales solo si hacen falta). */
export function formatMoney(value: number, currency: Currency = "CUP") {
  const digits = Number.isInteger(value) ? 0 : 2;
  return formatter(currency, digits).format(value).replace(/ /g, " ");
}

export const formatCup = (value: number) => formatMoney(value, "CUP");

/** Importes en varias monedas: "2.500 CUP + 12 USD" (omite las que están a cero). */
export function formatAmounts(amounts: Partial<Record<Currency, number>>) {
  const parts = CURRENCIES.filter((c) => (amounts[c] ?? 0) !== 0).map((c) =>
    formatMoney(amounts[c]!, c),
  );
  return parts.length > 0 ? parts.join(" + ") : formatMoney(0, "CUP");
}
export const formatUsd = (value: number) => formatMoney(value, "USD");

/** Número simple con separadores: 2,5 / 1.250 */
export function formatNumber(value: number, maxDecimals = 3) {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: maxDecimals,
    useGrouping: "always",
  }).format(value);
}

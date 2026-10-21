export const UNITS = [
  { value: "unidad", label: "unidad" },
  { value: "lb", label: "libra (lb)" },
  { value: "kg", label: "kilogramo (kg)" },
  { value: "litro", label: "litro" },
  { value: "paquete", label: "paquete" },
  { value: "cartón", label: "cartón" },
  { value: "lata", label: "lata" },
  { value: "botella", label: "botella" },
  { value: "servicio", label: "servicio" },
] as const;

export type Unit = (typeof UNITS)[number]["value"];

export const UNIT_VALUES = UNITS.map((u) => u.value) as [Unit, ...Unit[]];

export const LB_PER_KG = 2.20462;

/** Unidad en la que se comparan precios: los kg se pasan a lb; el resto queda igual. */
export function comparableUnit(unit: string, quantity: number) {
  return unit === "kg" ? { unit: "lb", quantity: quantity * LB_PER_KG } : { unit, quantity };
}

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

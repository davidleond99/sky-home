import type { Unit } from "@/features/economia/units";

export const SEED_USERS = [
  { name: "David León", email: "davidleond99@gmail.com" },
  { name: "Gabriela", email: "gbrlsigler@gmail.com" },
] as const;

type SeedCategory = { name: string; products: [name: string, unit: Unit][] };

/** Catálogo de ejemplo. Se puede ampliar desde la app (Economía → Catálogo). */
export const SEED_CATALOG: SeedCategory[] = [
  {
    name: "Alimentos básicos",
    products: [
      ["Arroz", "lb"],
      ["Frijoles negros", "lb"],
      ["Azúcar", "lb"],
      ["Aceite", "litro"],
      ["Sal", "paquete"],
      ["Harina", "lb"],
      ["Espaguetis", "paquete"],
      ["Café", "paquete"],
      ["Puré de tomate", "lata"],
      ["Pan", "unidad"],
      ["Leche en polvo", "kg"],
    ],
  },
  {
    name: "Carnes y proteínas",
    products: [
      ["Pollo", "kg"],
      ["Carne de cerdo", "lb"],
      ["Picadillo", "lb"],
      ["Huevos", "cartón"],
      ["Salchichas", "paquete"],
      ["Mortadella", "lb"],
      ["Pescado", "lb"],
    ],
  },
  {
    name: "Frutas y vegetales",
    products: [
      ["Plátano", "unidad"],
      ["Papa", "lb"],
      ["Boniato", "lb"],
      ["Yuca", "lb"],
      ["Tomate", "lb"],
      ["Cebolla", "lb"],
      ["Ajo", "unidad"],
      ["Aguacate", "unidad"],
      ["Guayaba", "lb"],
      ["Fruta bomba", "unidad"],
    ],
  },
  {
    name: "Bebidas",
    products: [
      ["Refresco", "lata"],
      ["Jugo", "litro"],
      ["Cerveza", "lata"],
      ["Ron", "botella"],
      ["Agua", "botella"],
    ],
  },
  {
    name: "Chucherías",
    products: [
      ["Galletas", "paquete"],
      ["Caramelos", "paquete"],
      ["Chocolate", "unidad"],
      ["Helado", "litro"],
      ["Maní", "paquete"],
      ["Papitas", "paquete"],
    ],
  },
  {
    name: "Lujos",
    products: [
      ["Perfume", "unidad"],
      ["Electrónica", "unidad"],
      ["Regalos", "unidad"],
    ],
  },
  {
    name: "Salidas",
    products: [
      ["Restaurante", "servicio"],
      ["Cafetería", "servicio"],
      ["Pizza", "unidad"],
      ["Paseo", "servicio"],
      ["Cine", "servicio"],
    ],
  },
  {
    name: "Aseo e higiene",
    products: [
      ["Jabón", "unidad"],
      ["Champú", "botella"],
      ["Pasta dental", "unidad"],
      ["Detergente", "paquete"],
      ["Papel higiénico", "paquete"],
      ["Desodorante", "unidad"],
      ["Cloro", "litro"],
    ],
  },
  {
    name: "Hogar",
    products: [
      ["Gas (balón)", "unidad"],
      ["Carbón", "paquete"],
      ["Bombillos", "unidad"],
      ["Utensilios de cocina", "unidad"],
    ],
  },
  {
    name: "Servicios",
    products: [
      ["Electricidad", "servicio"],
      ["Agua (servicio)", "servicio"],
      ["Recarga de teléfono", "servicio"],
      ["Datos móviles / Nauta", "servicio"],
    ],
  },
  {
    name: "Transporte",
    products: [
      ["Taxi / almendrón", "servicio"],
      ["Gasolina", "litro"],
      ["Guagua", "servicio"],
    ],
  },
  {
    name: "Salud",
    products: [
      ["Medicamentos", "unidad"],
      ["Consulta médica", "servicio"],
    ],
  },
  {
    name: "Ropa y calzado",
    products: [
      ["Ropa", "unidad"],
      ["Zapatos", "unidad"],
    ],
  },
  {
    name: "Otros",
    products: [["Otro gasto", "unidad"]],
  },
];

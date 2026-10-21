import { LinkTabs } from "@/components/link-tabs";

const TABS = [
  { href: "/economia", label: "Movimientos" },
  { href: "/economia/ventas", label: "Ventas USD" },
  { href: "/economia/gastos", label: "Gastos" },
  { href: "/economia/catalogo", label: "Catálogo" },
];

export function EconomiaTabs() {
  return <LinkTabs tabs={TABS} />;
}

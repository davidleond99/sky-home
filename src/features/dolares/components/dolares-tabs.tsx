import { LinkTabs } from "@/components/link-tabs";

const TABS = [
  { href: "/dolares", label: "Resumen" },
  { href: "/dolares/gastos", label: "Gastos USD" },
  { href: "/dolares/comparativa", label: "Comparativa" },
];

export function DolaresTabs() {
  return <LinkTabs tabs={TABS} />;
}

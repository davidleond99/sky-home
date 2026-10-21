"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { href: "/dolares", label: "Resumen" },
  { href: "/dolares/gastos", label: "Gastos USD" },
  { href: "/dolares/comparativa", label: "Comparativa" },
];

export function DolaresTabs() {
  const pathname = usePathname();
  return (
    <Tabs value={pathname}>
      <TabsList className="max-w-full overflow-x-auto">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.href} value={tab.href} asChild>
            <Link href={tab.href}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

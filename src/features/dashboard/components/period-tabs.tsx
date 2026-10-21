"use client";

import { cn } from "cn";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Period, PERIODS, parsePeriod } from "../period";

/**
 * Pestañas de periodo como enlaces; el periodo por defecto no lleva `?period=`.
 * `tone="section"` es la variante clara sobre el bloque azul de Inicio.
 */
export function PeriodTabs({
  basePath = "/",
  defaultPeriod = "month",
  tone = "default",
}: {
  basePath?: string;
  defaultPeriod?: Period;
  tone?: "default" | "section";
}) {
  const current = parsePeriod(useSearchParams().get("period") ?? undefined, defaultPeriod);
  const onSection = tone === "section";
  return (
    <Tabs value={current}>
      <TabsList className={cn("max-w-full flex-wrap", onSection && "h-auto! gap-0.5 bg-white/12")}>
        {PERIODS.map((p) => (
          <TabsTrigger
            key={p.value}
            value={p.value}
            asChild
            className={cn(
              onSection &&
                "text-on-section hover:text-on-section data-active:bg-on-section data-active:text-chelsea dark:data-active:bg-on-section dark:data-active:text-chelsea flex-none px-2.5 py-1.5 text-[13px] data-active:shadow-none sm:px-3",
            )}
          >
            <Link
              href={p.value === defaultPeriod ? basePath : `${basePath}?period=${p.value}`}
              scroll={false}
            >
              {p.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

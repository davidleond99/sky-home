"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Period, PERIODS, parsePeriod } from "../period";

/** Pestañas de periodo como enlaces; el periodo por defecto no lleva `?period=`. */
export function PeriodTabs({
  basePath = "/",
  defaultPeriod = "month",
}: {
  basePath?: string;
  defaultPeriod?: Period;
}) {
  const current = parsePeriod(useSearchParams().get("period") ?? undefined, defaultPeriod);
  return (
    <Tabs value={current}>
      <TabsList>
        {PERIODS.map((p) => (
          <TabsTrigger key={p.value} value={p.value} asChild>
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

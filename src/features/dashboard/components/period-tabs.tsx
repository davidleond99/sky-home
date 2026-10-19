"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERIODS, periodSchema } from "../period";

export function PeriodTabs() {
  const current = periodSchema.parse(useSearchParams().get("period") ?? undefined);
  return (
    <Tabs value={current}>
      <TabsList>
        {PERIODS.map((p) => (
          <TabsTrigger key={p.value} value={p.value} asChild>
            <Link href={p.value === "month" ? "/" : `/?period=${p.value}`} scroll={false}>
              {p.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

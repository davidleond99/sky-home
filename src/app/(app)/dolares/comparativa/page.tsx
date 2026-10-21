import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodTabs } from "@/features/dashboard/components/period-tabs";
import { parsePeriod } from "@/features/dashboard/period";
import { ComparisonTable } from "@/features/dolares/components/comparison-table";
import { getPriceComparison } from "@/features/dolares/queries";

export const metadata: Metadata = { title: "Comparativa CUP vs USD" };

/** Los precios cambian rápido: por defecto se comparan los últimos 3 meses. */
const DEFAULT_PERIOD = "3m";

async function ComparativaContent({ searchParams }: PageProps<"/dolares/comparativa">) {
  const { period } = await searchParams;
  const rows = await getPriceComparison(parsePeriod(period, DEFAULT_PERIOD));
  return <ComparisonTable rows={rows} />;
}

export default function ComparativaPage(props: PageProps<"/dolares/comparativa">) {
  return (
    <>
      <p className="text-muted-foreground text-sm">
        Precio medio por unidad de cada producto según la moneda en que lo pagaste. Lo pagado en USD
        se pasa a CUP con la tasa guardada en cada compra; los kg se comparan como lb.
      </p>
      {/* useSearchParams: necesita su propia frontera de Suspense. */}
      <Suspense fallback={<Skeleton className="h-9 w-80" />}>
        <PeriodTabs basePath="/dolares/comparativa" defaultPeriod={DEFAULT_PERIOD} />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <ComparativaContent {...props} />
      </Suspense>
    </>
  );
}

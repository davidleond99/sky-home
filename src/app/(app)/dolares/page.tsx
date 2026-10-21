import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/features/dashboard/components/chart-card";
import {
  CategoryDonut,
  HorizontalBars,
  MonthlyChart,
  RateChart,
} from "@/features/dashboard/components/charts";
import { DailyAverage } from "@/features/dashboard/components/daily-average";
import { PeriodTabs } from "@/features/dashboard/components/period-tabs";
import { PERIODS, parsePeriod } from "@/features/dashboard/period";
import { getUsdDashboard } from "@/features/dashboard/queries";
import { UsdKpiCards } from "@/features/dolares/components/usd-kpi-cards";

export const metadata: Metadata = { title: "Dólares" };

async function ResumenContent({ searchParams }: PageProps<"/dolares">) {
  const { period: rawPeriod } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const periodLabel = PERIODS.find((p) => p.value === period)!.label.toLowerCase();
  const data = await getUsdDashboard(period);

  return (
    <>
      <UsdKpiCards kpis={data.kpis} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Gasto diario promedio" description={`USD por día · ${periodLabel}`}>
          <DailyAverage kpis={data.kpis} currency="USD" />
        </ChartCard>

        <ChartCard
          title="Tasa a la que vendiste USD"
          description={`CUP recibidos por USD · ${periodLabel}`}
        >
          <RateChart data={data.rateSeries} />
        </ChartCard>

        <ChartCard
          title="¿En qué se van los dólares?"
          description={`Gasto en USD por categoría · ${periodLabel}`}
        >
          <CategoryDonut data={data.categoryShare} total={data.kpis.spent} currency="USD" />
        </ChartCard>

        <ChartCard
          title="Top 5 productos en USD"
          description={`Donde más se gasta · ${periodLabel}`}
        >
          <HorizontalBars data={data.topProducts} currency="USD" />
        </ChartCard>

        <ChartCard
          title="Gasto mensual en USD"
          description="Últimos 6 meses, por categoría"
          className="lg:col-span-2"
        >
          <MonthlyChart data={data.monthly} slots={data.slots} currency="USD" />
        </ChartCard>
      </div>
    </>
  );
}

/**
 * La sesión y los datos se leen dentro de <Suspense>: así las navegaciones
 * (incluido cambiar de periodo en la misma página) muestran el esqueleto al instante.
 */
export default function ResumenPage(props: PageProps<"/dolares">) {
  return (
    <>
      {/* useSearchParams: necesita su propia frontera de Suspense. */}
      <Suspense fallback={<Skeleton className="h-9 w-80" />}>
        <PeriodTabs basePath="/dolares" />
      </Suspense>
      <Suspense fallback={<DashboardSkeleton />}>
        <ResumenContent {...props} />
      </Suspense>
    </>
  );
}

import { DashboardSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BalanceChart,
  CategoryDonut,
  HorizontalBars,
  MonthlyChart,
} from "@/features/dashboard/components/charts";
import { DailyAverage } from "@/features/dashboard/components/daily-average";
import { KpiCards } from "@/features/dashboard/components/kpi-cards";
import { PeriodTabs } from "@/features/dashboard/components/period-tabs";
import { PERIODS, periodSchema } from "@/features/dashboard/period";
import { getDashboard } from "@/features/dashboard/queries";
import { OpenLists } from "@/features/compras/components/open-lists";
import { QuickActions } from "@/features/economia/components/quick-actions";
import { requireUser } from "@/lib/session";

function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}

async function HomeContent({ searchParams }: PageProps<"/">) {
  const { period: rawPeriod } = await searchParams;
  const period = periodSchema.parse(rawPeriod);
  const periodLabel = PERIODS.find((p) => p.value === period)!.label.toLowerCase();
  const [user, data] = await Promise.all([requireUser(), getDashboard(period)]);

  return (
    <>
      <PageHeader
        title={`Hola, ${user.name.split(" ")[0]}`}
        description="Resumen de la economía de la casa"
        actions={
          <Suspense fallback={<Skeleton className="h-9 w-72" />}>
            <QuickActions />
          </Suspense>
        }
      />
      <section aria-labelledby="compras-title" className="flex flex-col gap-3">
        <h2 id="compras-title" className="text-lg font-semibold">
          Lista de la compra
        </h2>
        <Suspense fallback={<Skeleton className="h-40" />}>
          <OpenLists />
        </Suspense>
      </section>
      <PeriodTabs />
      <KpiCards kpis={data.kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Saldo en CUP"
          description={`Saldo al cierre de cada día · ${periodLabel}`}
        >
          <BalanceChart data={data.balanceSeries} />
        </ChartCard>

        <ChartCard title="Gasto diario promedio" description={`CUP por día · ${periodLabel}`}>
          <DailyAverage kpis={data.kpis} />
        </ChartCard>

        <ChartCard
          title="¿En qué se va el dinero?"
          description={`Gasto por categoría · ${periodLabel}`}
        >
          <CategoryDonut data={data.categoryShare} total={data.kpis.cupSpent} />
        </ChartCard>

        <ChartCard title="Top 5 productos" description={`Donde más se gasta · ${periodLabel}`}>
          <HorizontalBars data={data.topProducts} />
        </ChartCard>

        <ChartCard
          title="Gasto mensual"
          description="Últimos 6 meses, por categoría"
          className="lg:col-span-2"
        >
          <MonthlyChart data={data.monthly} slots={data.slots} />
        </ChartCard>
      </div>
    </>
  );
}

/**
 * La sesión y los datos se leen dentro de <Suspense>: así las navegaciones
 * (incluido cambiar filtros en la misma página) muestran el esqueleto al instante.
 */
export default function HomePage(props: PageProps<"/">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <HomeContent {...props} />
    </Suspense>
  );
}

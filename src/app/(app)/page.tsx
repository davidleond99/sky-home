import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BalanceChart,
  CategoryDonut,
  HorizontalBars,
  MonthlyChart,
} from "@/features/dashboard/components/charts";
import { BalanceHero } from "@/features/dashboard/components/balance-hero";
import { ChartCard } from "@/features/dashboard/components/chart-card";
import { PERIODS, periodSchema } from "@/features/dashboard/period";
import { getDashboard } from "@/features/dashboard/queries";
import { OpenLists } from "@/features/compras/components/open-lists";
import { QuickActions } from "@/features/economia/components/quick-actions";
import { requireUser } from "@/lib/session";

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
      <BalanceHero kpis={data.kpis} periodLabel={periodLabel} />
      <section aria-labelledby="compras-title" className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="compras-title" className="text-xl font-medium tracking-[-0.015em]">
            Lista de la compra
          </h2>
          <Button variant="ghost" className="text-primary hover:text-primary" asChild>
            <Link href="/compras">
              Ver todas
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <Suspense fallback={<Skeleton className="h-52 rounded-2xl" />}>
          <OpenLists />
        </Suspense>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] gap-4">
        <ChartCard
          title="Saldo en CUP"
          description={`Saldo al cierre de cada día · ${periodLabel}`}
        >
          <BalanceChart data={data.balanceSeries} />
        </ChartCard>

        <ChartCard
          title="¿En qué se va el dinero?"
          description={`Gasto por categoría · ${periodLabel}`}
        >
          <CategoryDonut data={data.categoryShare} total={data.kpis.spent} />
        </ChartCard>

        <ChartCard title="Top 5 productos" description={`Donde más se gasta · ${periodLabel}`}>
          <HorizontalBars data={data.topProducts} />
        </ChartCard>

        <ChartCard title="Gasto mensual" description="Últimos 6 meses, por categoría">
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

import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { BalanceCards } from "@/features/economia/components/balance-cards";
import { EconomiaTabs } from "@/features/economia/components/economia-tabs";
import { QuickActions } from "@/features/economia/components/quick-actions";

export default function EconomiaLayout({ children }: LayoutProps<"/economia">) {
  return (
    <>
      <PageHeader
        title="Economía"
        description="Ventas de USD, gastos y saldo de la casa"
        actions={
          <Suspense fallback={<Skeleton className="h-9 w-72" />}>
            <QuickActions />
          </Suspense>
        }
      />
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        }
      >
        <BalanceCards />
      </Suspense>
      <EconomiaTabs />
      {children}
    </>
  );
}

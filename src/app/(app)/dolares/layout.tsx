import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DolaresTabs } from "@/features/dolares/components/dolares-tabs";
import { UsdQuickActions } from "@/features/dolares/components/usd-quick-actions";

export default function DolaresLayout({ children }: LayoutProps<"/dolares">) {
  return (
    <>
      <PageHeader
        title="Dólares"
        description="Compras pagadas en USD y comparativa con lo que pagas en CUP"
        actions={
          <Suspense fallback={<Skeleton className="h-9 w-48" />}>
            <UsdQuickActions />
          </Suspense>
        }
      />
      <DolaresTabs />
      {children}
    </>
  );
}

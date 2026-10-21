import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-9 w-full max-w-xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-12 w-56" />
      <Skeleton className="h-[260px] rounded-[20px]" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

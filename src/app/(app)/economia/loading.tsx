import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-9 w-full max-w-xl" />
      <Skeleton className="h-96" />
    </div>
  );
}

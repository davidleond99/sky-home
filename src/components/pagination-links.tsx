import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PaginationLinks({
  page,
  hasMore,
  searchParams,
}: {
  page: number;
  hasMore: boolean;
  searchParams: Record<string, string>;
}) {
  if (page === 1 && !hasMore) return null;
  const href = (p: number) => `?${new URLSearchParams({ ...searchParams, page: String(p) })}`;
  return (
    <div className="flex items-center justify-end gap-2">
      {page > 1 && (
        <Button variant="outline" size="sm" asChild>
          <Link href={href(page - 1)}>Anterior</Link>
        </Button>
      )}
      <span className="text-muted-foreground text-sm">Página {page}</span>
      {hasMore && (
        <Button variant="outline" size="sm" asChild>
          <Link href={href(page + 1)}>Siguiente</Link>
        </Button>
      )}
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PaginationLinks({
  page,
  pages,
  searchParams,
}: {
  page: number;
  /** Total de páginas del filtro actual. */
  pages: number;
  searchParams: Record<string, string>;
}) {
  if (pages <= 1 && page === 1) return null;
  const href = (p: number) => `?${new URLSearchParams({ ...searchParams, page: String(p) })}`;
  const hasPrev = page > 1;
  const hasNext = page < pages;
  return (
    <nav aria-label="Paginación" className="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" disabled={!hasPrev} asChild={hasPrev}>
        {hasPrev ? (
          <Link href={href(page - 1)} scroll={false}>
            Anterior
          </Link>
        ) : (
          "Anterior"
        )}
      </Button>
      <span className="text-muted-foreground text-sm tabular-nums">
        Página {page} de {pages}
      </span>
      <Button variant="outline" size="sm" disabled={!hasNext} asChild={hasNext}>
        {hasNext ? (
          <Link href={href(page + 1)} scroll={false}>
            Siguiente
          </Link>
        ) : (
          "Siguiente"
        )}
      </Button>
    </nav>
  );
}

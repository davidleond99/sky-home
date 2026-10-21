import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <nav
      aria-label="Paginación"
      className="text-muted-foreground flex items-center justify-between gap-3 text-[13px]"
    >
      <span className="tabular-nums">
        Página {page} de {pages}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={!hasPrev} asChild={hasPrev}>
          {hasPrev ? (
            <Link href={href(page - 1)} scroll={false}>
              <ChevronLeft />
              Anterior
            </Link>
          ) : (
            <>
              <ChevronLeft />
              Anterior
            </>
          )}
        </Button>
        <Button variant="secondary" disabled={!hasNext} asChild={hasNext}>
          {hasNext ? (
            <Link href={href(page + 1)} scroll={false}>
              Siguiente
              <ChevronRight />
            </Link>
          ) : (
            <>
              Siguiente
              <ChevronRight />
            </>
          )}
        </Button>
      </div>
    </nav>
  );
}

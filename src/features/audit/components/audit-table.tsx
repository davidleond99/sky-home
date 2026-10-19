import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import { ACTION_LABELS, ENTITY_LABELS } from "../labels";
import type { AuditRow } from "../queries";
import type { AuditAction, AuditEntity } from "../record";
import { AuditChanges } from "./audit-changes";

const ACTION_VARIANT: Partial<
  Record<AuditAction, "default" | "secondary" | "destructive" | "outline">
> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  archive: "destructive",
};

export function AuditTable({
  rows,
  page,
  hasMore,
  searchParams,
}: {
  rows: AuditRow[];
  page: number;
  hasMore: boolean;
  searchParams: Record<string, string>;
}) {
  const pageHref = (p: number) => `?${new URLSearchParams({ ...searchParams, page: String(p) })}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y hora</TableHead>
              <TableHead>Persona</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-full">Descripción</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                  No hay actividad con estos filtros.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(row.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap">{row.userName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={ACTION_VARIANT[row.action] ?? "outline"}>
                    {ACTION_LABELS[row.action]}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {ENTITY_LABELS[row.entity as AuditEntity] ?? row.entity}
                </TableCell>
                <TableCell>{row.summary}</TableCell>
                <TableCell>
                  <AuditChanges
                    summary={row.summary}
                    before={row.before}
                    after={row.after}
                    userAgent={row.userAgent}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        {page > 1 && (
          <Button variant="outline" size="sm" asChild>
            <Link href={pageHref(page - 1)}>Anterior</Link>
          </Button>
        )}
        <span className="text-muted-foreground text-sm">Página {page}</span>
        {hasMore && (
          <Button variant="outline" size="sm" asChild>
            <Link href={pageHref(page + 1)}>Siguiente</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

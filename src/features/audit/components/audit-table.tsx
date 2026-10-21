import { PaginationLinks } from "@/components/pagination-links";
import { Badge } from "@/components/ui/badge";
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

const ACTION_BADGE: Record<
  AuditAction,
  { variant: "accent" | "secondary" | "destructive" | "positive"; className?: string }
> = {
  create: { variant: "accent" },
  update: { variant: "secondary" },
  delete: { variant: "destructive" },
  archive: { variant: "destructive" },
  restore: { variant: "positive" },
  login: { variant: "secondary", className: "text-muted-foreground" },
  logout: { variant: "secondary", className: "text-muted-foreground" },
};

export function AuditTable({
  rows,
  page,
  pages,
  searchParams,
}: {
  rows: AuditRow[];
  page: number;
  pages: number;
  searchParams: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="glass overflow-hidden rounded-2xl">
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
                  <Badge
                    variant={ACTION_BADGE[row.action].variant}
                    className={ACTION_BADGE[row.action].className}
                  >
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
      <PaginationLinks page={page} pages={pages} searchParams={searchParams} />
    </div>
  );
}

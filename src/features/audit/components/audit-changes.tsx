"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { diffSnapshots } from "../diff";
import { FIELD_LABELS } from "../labels";

function show(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString("es-ES");
  return String(value);
}

export function AuditChanges({
  summary,
  before,
  after,
  userAgent,
}: {
  summary: string;
  before: unknown;
  after: unknown;
  userAgent: string | null;
}) {
  const changes = diffSnapshots(before, after);
  if (changes.length === 0 && !userAgent) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
          Ver cambios
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle</DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>
        {changes.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campo</TableHead>
                <TableHead>Antes</TableHead>
                <TableHead>Después</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changes.map((c) => (
                <TableRow key={c.field}>
                  <TableCell className="font-medium">{FIELD_LABELS[c.field] ?? c.field}</TableCell>
                  <TableCell className="text-muted-foreground">{show(c.before)}</TableCell>
                  <TableCell>{show(c.after)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {userAgent && <p className="text-muted-foreground text-xs break-all">{userAgent}</p>}
      </DialogContent>
    </Dialog>
  );
}

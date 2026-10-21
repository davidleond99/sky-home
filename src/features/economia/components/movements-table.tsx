import { ArrowDownLeft, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDay } from "@/lib/dates";
import { formatCup, formatNumber, formatUsd } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Movement } from "../queries";
import { ExchangeRowActions, ExpenseRowActions } from "./row-actions";

function ConceptIcon({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "grid size-[30px] shrink-0 place-items-center rounded-[9px] [&_svg]:size-[15px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Concept({ m }: { m: Movement }) {
  if (m.kind === "exchange") {
    return (
      <span className="flex items-center gap-2.5">
        <ConceptIcon className="bg-tint-pos text-pos">
          <ArrowDownLeft />
        </ConceptIcon>
        Venta de {formatUsd(m.usdAmount!)} a {formatNumber(m.rate!, 2)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2.5">
      <ConceptIcon className="bg-muted text-muted-foreground">
        <ShoppingCart />
      </ConceptIcon>
      <span>
        {m.productName}
        <span className="text-muted-foreground">
          {" "}
          · {formatNumber(m.quantity!)} {m.unit} × {formatCup(m.unitPrice!)}
        </span>
      </span>
    </span>
  );
}

export function MovementsTable({ rows }: { rows: Movement[] }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Persona</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                Aún no hay movimientos. Empieza con «Vender USD».
              </TableCell>
            </TableRow>
          )}
          {rows.map((m) => (
            <TableRow key={`${m.kind}-${m.id}`}>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatDay(m.occurredOn)}
              </TableCell>
              <TableCell>
                <Concept m={m} />
                {m.note && <p className="text-muted-foreground mt-0.5 pl-10 text-xs">{m.note}</p>}
              </TableCell>
              <TableCell>
                {m.categoryName ? (
                  <Badge variant="secondary">{m.categoryName}</Badge>
                ) : (
                  <Badge variant="positive">Venta USD</Badge>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">{m.userName}</TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium whitespace-nowrap tabular-nums",
                  m.amount >= 0 ? "text-pos" : "text-foreground",
                )}
              >
                {m.amount >= 0 ? "+" : ""}
                {formatCup(m.amount)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right whitespace-nowrap tabular-nums",
                  m.balance < 0 ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {formatCup(m.balance)}
              </TableCell>
              <TableCell>
                {m.kind === "exchange" ? (
                  <ExchangeRowActions
                    exchange={{
                      id: m.id,
                      occurredOn: m.occurredOn,
                      usdAmount: m.usdAmount!,
                      rate: m.rate!,
                      cupAmount: m.amount,
                      note: m.note,
                    }}
                  />
                ) : (
                  <ExpenseRowActions
                    expense={{
                      id: m.id,
                      occurredOn: m.occurredOn,
                      productId: m.productId!,
                      productName: m.productName!,
                      quantity: m.quantity!,
                      unit: m.unit!,
                      unitPrice: m.unitPrice!,
                      total: -m.amount,
                      // Movimientos solo incluye gastos en CUP.
                      currency: "CUP",
                      rate: null,
                      note: m.note,
                    }}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

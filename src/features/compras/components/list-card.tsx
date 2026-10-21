import Link from "next/link";
import { ArrowRight, Circle, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";
import { formatAmounts, formatMoney, formatNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ListItem, ListSummary } from "../queries";

const MAX_SHOWN = 6;

function plannedLabel(item: ListItem) {
  return item.quantity === null ? null : `${formatNumber(item.quantity)} ${item.unit}`;
}

export function ListProgress({
  done,
  total,
  className,
}: {
  done: number;
  total: number;
  className?: string;
}) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      className={cn("bg-muted h-2 w-full overflow-hidden rounded-full", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={`${done} de ${total} comprados`}
    >
      <div
        className="bg-primary h-full rounded-full transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** Resumen de una lista: lo que falta y lo que ya se compró. */
export function ListCard({ list }: { list: ListSummary }) {
  const pendingShown = list.pending.slice(0, MAX_SHOWN);
  const purchasedShown = list.purchased.slice(0, MAX_SHOWN);

  return (
    <Card className="h-full gap-4" data-testid="shopping-list-card">
      <CardHeader className="gap-0.5">
        <CardTitle className="text-[17px] tracking-[-0.01em]">
          <Link href={`/compras/${list.id}`} className="hover:text-primary transition-colors">
            {list.name}
          </Link>
        </CardTitle>
        <CardDescription className="text-[13px]">
          {list.closedAt
            ? `Cerrada el ${formatDateTime(list.closedAt)}`
            : `${list.purchasedCount} de ${list.itemCount} comprados · ${formatAmounts(list.spent)}`}
        </CardDescription>
        <CardAction>
          {list.closedAt ? (
            <Badge variant="secondary">Cerrada</Badge>
          ) : (
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
              <Link href={`/compras/${list.id}`}>
                Abrir
                <ArrowRight />
              </Link>
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ListProgress done={list.purchasedCount} total={list.itemCount} className="h-1.5" />
        {list.itemCount === 0 && (
          <p className="text-muted-foreground text-sm">Todavía no hay productos apuntados.</p>
        )}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
          {list.pending.length > 0 && (
            <section aria-label="Pendientes" className="min-w-0">
              <h3 className="text-muted-foreground mb-2 text-[11px] font-medium tracking-[0.08em] uppercase">
                Pendientes ({list.pending.length})
              </h3>
              <ul className="flex flex-col gap-1.5 text-sm">
                {pendingShown.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <Circle className="text-muted-foreground/70 size-4 shrink-0" />
                    <span className="truncate">{item.productName}</span>
                    {plannedLabel(item) && (
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {plannedLabel(item)}
                      </span>
                    )}
                  </li>
                ))}
                {list.pending.length > MAX_SHOWN && (
                  <li className="text-muted-foreground text-xs">
                    y {list.pending.length - MAX_SHOWN} más…
                  </li>
                )}
              </ul>
            </section>
          )}
          {list.purchased.length > 0 && (
            <section aria-label="Comprados" className="min-w-0">
              <h3 className="text-muted-foreground mb-2 text-[11px] font-medium tracking-[0.08em] uppercase">
                Comprados ({list.purchased.length})
              </h3>
              <ul className="flex flex-col gap-1.5 text-sm">
                {purchasedShown.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <CircleCheck className="text-pos size-4 shrink-0" />
                    <span className="text-muted-foreground truncate line-through">
                      {item.productName}
                    </span>
                    <span className="ml-auto text-xs whitespace-nowrap tabular-nums">
                      {formatMoney(item.purchase!.total, item.purchase!.currency)}
                    </span>
                  </li>
                ))}
                {list.purchased.length > MAX_SHOWN && (
                  <li className="text-muted-foreground text-xs">
                    y {list.purchased.length - MAX_SHOWN} más…
                  </li>
                )}
              </ul>
            </section>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

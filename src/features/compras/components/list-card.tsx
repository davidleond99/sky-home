import Link from "next/link";
import { CircleCheck, Circle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { ListItem, ListSummary } from "../queries";

const MAX_SHOWN = 6;

function plannedLabel(item: ListItem) {
  return item.quantity === null ? null : `${formatNumber(item.quantity)} ${item.unit}`;
}

export function ListProgress({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      className="bg-muted h-2 w-full overflow-hidden rounded-full"
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
    <Card className="gap-4" data-testid="shopping-list-card">
      <CardHeader>
        <CardTitle>
          <Link href={`/compras/${list.id}`} className="hover:underline">
            {list.name}
          </Link>
        </CardTitle>
        <CardDescription>
          {list.closedAt
            ? `Cerrada el ${formatDateTime(list.closedAt)}`
            : `${list.purchasedCount} de ${list.itemCount} comprados · ${formatAmounts(list.spent)}`}
        </CardDescription>
        <CardAction>
          {list.closedAt ? (
            <Badge variant="secondary">Cerrada</Badge>
          ) : (
            <Link
              href={`/compras/${list.id}`}
              className="text-primary inline-flex items-center text-sm font-medium"
            >
              Abrir
              <ChevronRight className="size-4" />
            </Link>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ListProgress done={list.purchasedCount} total={list.itemCount} />
        {list.itemCount === 0 && (
          <p className="text-muted-foreground text-sm">Todavía no hay productos apuntados.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {list.pending.length > 0 && (
            <section aria-label="Pendientes">
              <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Pendientes ({list.pending.length})
              </h3>
              <ul className="flex flex-col gap-1 text-sm">
                {pendingShown.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <Circle className="text-muted-foreground size-4 shrink-0" />
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
            <section aria-label="Comprados">
              <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Comprados ({list.purchased.length})
              </h3>
              <ul className="flex flex-col gap-1 text-sm">
                {purchasedShown.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <CircleCheck className="size-4 shrink-0 text-emerald-600" />
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

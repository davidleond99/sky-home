import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/skeletons";
import { AddItemForm } from "@/features/compras/components/add-item-form";
import { ListProgress } from "@/features/compras/components/list-card";
import { ListActions } from "@/features/compras/components/list-actions";
import { PendingItems, PurchasedItems } from "@/features/compras/components/list-items";
import { getList } from "@/features/compras/queries";
import {
  getLatestRate,
  listActiveCategories,
  listProductOptions,
} from "@/features/economia/queries";
import { formatAmounts, formatCup, formatUsd } from "@/lib/money";

export const metadata: Metadata = { title: "Lista de la compra" };

async function ListContent({ params }: PageProps<"/compras/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [list, products, categories, latestRate] = await Promise.all([
    getList(id),
    listProductOptions(),
    listActiveCategories(),
    getLatestRate(),
  ]);
  if (!list) notFound();

  const open = !list.closedAt;
  const lastPrices = Object.fromEntries(products.map((p) => [p.id, p.lastPrice]));
  const inList = [...list.pending, ...list.purchased].map((i) => i.productId);

  return (
    <>
      <PageHeader
        title={list.name}
        description={
          open
            ? `${list.purchasedCount} de ${list.itemCount} comprados · ${formatAmounts(list.spent)} gastados`
            : `Lista cerrada · ${formatAmounts(list.spent)} gastados`
        }
        actions={<ListActions list={{ id: list.id, name: list.name, closed: !open }} />}
      />
      <ListProgress done={list.purchasedCount} total={list.itemCount} />
      {open && (
        <AddItemForm listId={list.id} products={products} categories={categories} inList={inList} />
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(400px,100%),1fr))] items-start gap-5">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Pendientes ({list.pending.length})</h2>
          <PendingItems
            items={list.pending}
            lastPrices={lastPrices}
            defaultRate={latestRate}
            editable={open}
          />
        </section>
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-medium">Comprados ({list.purchased.length})</h2>
            <span className="font-semibold tabular-nums">
              <span data-testid="list-spent">{formatCup(list.spent.CUP)}</span>
              {list.spent.USD > 0 && (
                <>
                  {" + "}
                  <span data-testid="list-spent-usd">{formatUsd(list.spent.USD)}</span>
                </>
              )}
            </span>
          </div>
          <PurchasedItems items={list.purchased} editable={open} />
        </section>
      </div>
    </>
  );
}

/** El id llega como dato de ejecución: se lee dentro de <Suspense> (Cache Components). */
export default function ListPage(props: PageProps<"/compras/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" className="text-muted-foreground -mb-3 self-start" asChild>
        <Link href="/compras">
          <ChevronLeft />
          Todas las listas
        </Link>
      </Button>
      <Suspense fallback={<TableSkeleton />}>
        <ListContent {...props} />
      </Suspense>
    </div>
  );
}

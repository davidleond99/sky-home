import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/skeletons";
import { AddItemForm } from "@/features/compras/components/add-item-form";
import { ListProgress } from "@/features/compras/components/list-card";
import { ListActions } from "@/features/compras/components/list-actions";
import { PendingItems, PurchasedItems } from "@/features/compras/components/list-items";
import { getList } from "@/features/compras/queries";
import { listActiveCategories, listProductOptions } from "@/features/economia/queries";
import { formatCup } from "@/lib/money";

export const metadata: Metadata = { title: "Lista de la compra" };

async function ListContent({ params }: PageProps<"/compras/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [list, products, categories] = await Promise.all([
    getList(id),
    listProductOptions(),
    listActiveCategories(),
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
            ? `${list.purchasedCount} de ${list.itemCount} comprados · ${formatCup(list.spent)} gastados`
            : `Lista cerrada · ${formatCup(list.spent)} gastados`
        }
        actions={<ListActions list={{ id: list.id, name: list.name, closed: !open }} />}
      />
      <ListProgress done={list.purchasedCount} total={list.itemCount} />
      {open && (
        <AddItemForm listId={list.id} products={products} categories={categories} inList={inList} />
      )}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Pendientes ({list.pending.length})</h2>
        <PendingItems items={list.pending} lastPrices={lastPrices} editable={open} />
      </section>
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Comprados ({list.purchased.length})</h2>
          <span className="font-semibold tabular-nums" data-testid="list-spent">
            {formatCup(list.spent)}
          </span>
        </div>
        <PurchasedItems items={list.purchased} editable={open} />
      </section>
    </>
  );
}

/** El id llega como dato de ejecución: se lee dentro de <Suspense> (Cache Components). */
export default function ListPage(props: PageProps<"/compras/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/compras"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center text-sm"
      >
        <ChevronLeft className="size-4" />
        Todas las listas
      </Link>
      <Suspense fallback={<TableSkeleton />}>
        <ListContent {...props} />
      </Suspense>
    </div>
  );
}

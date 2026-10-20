import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ListCard } from "@/features/compras/components/list-card";
import { ListNameDialog } from "@/features/compras/components/list-name-dialog";
import { newListButton, OpenLists } from "@/features/compras/components/open-lists";
import { CLOSED_LISTS_LIMIT, listClosedLists } from "@/features/compras/queries";

export const metadata: Metadata = { title: "Lista de la compra" };

async function ClosedLists() {
  const lists = await listClosedLists();
  if (lists.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Cerradas</h2>
      <p className="text-muted-foreground -mt-2 text-sm">
        Las últimas {CLOSED_LISTS_LIMIT} listas terminadas.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {lists.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
      </div>
    </section>
  );
}

function ListsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  );
}

export default function ComprasPage() {
  return (
    <>
      <PageHeader
        title="Lista de la compra"
        description="Apunta lo que hace falta y márcalo al comprarlo: se registra como gasto."
        actions={<ListNameDialog trigger={newListButton} />}
      />
      <Suspense fallback={<ListsSkeleton />}>
        <OpenLists />
      </Suspense>
      <Suspense fallback={null}>
        <ClosedLists />
      </Suspense>
    </>
  );
}

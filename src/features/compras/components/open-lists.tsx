import { Plus, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listOpenLists } from "../queries";
import { ListCard } from "./list-card";
import { ListNameDialog } from "./list-name-dialog";

export const newListButton = (
  <Button size="lg">
    <Plus />
    Nueva lista
  </Button>
);

/** Listas abiertas (Inicio y /compras): lo pendiente y lo ya comprado. */
export async function OpenLists() {
  const lists = await listOpenLists();

  if (lists.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <ShoppingBasket className="text-muted-foreground size-5" />
          <p className="text-muted-foreground flex-1 text-sm">
            No hay listas de la compra abiertas.
          </p>
          <ListNameDialog trigger={newListButton} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4">
      {lists.map((list) => (
        <ListCard key={list.id} list={list} />
      ))}
    </div>
  );
}

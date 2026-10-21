"use client";

import { Lock, LockOpen, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Button } from "@/components/ui/button";
import { deleteList, renameList, setListClosed } from "../actions";
import { ListNameDialog } from "./list-name-dialog";

export function ListActions({ list }: { list: { id: string; name: string; closed: boolean } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleClosed() {
    startTransition(async () => {
      const result = await setListClosed(list.id, !list.closed);
      if (result.ok) toast.success(list.closed ? "Lista reabierta" : "Lista cerrada");
      else toast.error(result.error);
    });
  }

  return (
    <>
      {!list.closed && (
        <ListNameDialog
          title="Renombrar lista"
          initialName={list.name}
          onSubmitList={(values) => renameList(list.id, values)}
          trigger={
            <Button variant="secondary" size="lg">
              <Pencil />
              Renombrar
            </Button>
          }
        />
      )}
      <Button variant="secondary" size="lg" disabled={pending} onClick={toggleClosed}>
        {list.closed ? <LockOpen /> : <Lock />}
        {list.closed ? "Reabrir" : "Cerrar lista"}
      </Button>
      <ConfirmDelete
        title="¿Eliminar esta lista?"
        description="La lista desaparecerá, pero los gastos ya registrados con ella se conservan en Economía. Quedará registrado en la actividad."
        onConfirm={async () => {
          const result = await deleteList(list.id);
          if (result.ok) router.push("/compras");
          return result;
        }}
        successMessage="Lista eliminada"
      />
    </>
  );
}

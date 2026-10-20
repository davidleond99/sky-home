"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatDay, todayIso } from "@/lib/dates";
import { applyServerErrors } from "@/lib/form-errors";
import type { ActionResult } from "@/lib/action-result";
import { createList } from "../actions";
import { type ListInput, listSchema } from "../schemas";

/**
 * Diálogo para el nombre de una lista. Sin `onSubmitList` crea una lista nueva
 * y navega a ella; con él, delega el guardado (p. ej. para renombrar).
 */
export function ListNameDialog({
  trigger,
  title = "Nueva lista de la compra",
  initialName,
  onSubmitList,
}: {
  trigger: ReactNode;
  title?: string;
  initialName?: string;
  onSubmitList?: (values: ListInput) => Promise<ActionResult<unknown>>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Ponle un nombre para reconocerla, p. ej. «Agromercado».
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ListNameForm
            initialName={initialName ?? `Compra del ${formatDay(todayIso())}`}
            onSubmitList={onSubmitList}
            onDone={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ListNameForm({
  initialName,
  onSubmitList,
  onDone,
}: {
  initialName: string;
  onSubmitList?: (values: ListInput) => Promise<ActionResult<unknown>>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(listSchema),
    defaultValues: { name: initialName } satisfies ListInput,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      if (onSubmitList) {
        const result = await onSubmitList(values);
        if (!result.ok) {
          applyServerErrors(form, result);
          toast.error(result.error);
          return;
        }
        toast.success("Lista actualizada");
        onDone();
        return;
      }
      const result = await createList(values);
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error);
        return;
      }
      toast.success("Lista creada");
      onDone();
      router.push(`/compras/${result.data.id}`);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="list-name">Nombre</FieldLabel>
              <Input {...field} id="list-name" autoFocus aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : onSubmitList ? "Guardar" : "Crear lista"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

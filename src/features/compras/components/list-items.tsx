"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Circle, CircleCheck, Pencil, ShoppingCart, Undo2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/confirm-delete";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Unit, UNITS } from "@/features/economia/units";
import { formatDay } from "@/lib/dates";
import { applyServerErrors } from "@/lib/form-errors";
import { type Currency, formatMoney, formatNumber } from "@/lib/money";
import { removeItem, unpurchaseItem, updateItem } from "../actions";
import type { ListItem } from "../queries";
import { type ListItemInput, listItemSchema } from "../schemas";
import { PurchaseDialog } from "./purchase-dialog";

const LIST_CLASS = "glass divide-y overflow-hidden rounded-2xl";

function EmptyList({ children }: { children: string }) {
  return <p className="glass text-muted-foreground rounded-2xl px-4 py-5 text-sm">{children}</p>;
}

/** "Último precio 240 CUP" con el precio más reciente pagado (CUP primero). */
function lastPriceLabel(prices: Record<Currency, number | null> | undefined) {
  if (prices?.CUP != null) return `Último precio ${formatMoney(prices.CUP, "CUP")}`;
  if (prices?.USD != null) return `Último precio ${formatMoney(prices.USD, "USD")}`;
  return "Sin precio previo";
}

export function PendingItems({
  items,
  lastPrices,
  defaultRate,
  editable,
}: {
  items: ListItem[];
  lastPrices: Record<string, Record<Currency, number | null>>;
  /** Tasa de la última venta de USD, para compras en USD. */
  defaultRate: number | null;
  editable: boolean;
}) {
  if (items.length === 0) {
    return <EmptyList>No queda nada pendiente.</EmptyList>;
  }
  return (
    <ul className={LIST_CLASS}>
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-3" data-testid="pending-item">
          <Circle className="text-muted-foreground/60 size-5 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col leading-snug">
            <p className="truncate text-sm font-medium">
              {item.productName}
              <span className="text-muted-foreground font-normal">
                {" · "}
                {item.quantity === null
                  ? "Sin cantidad"
                  : `${formatNumber(item.quantity)} ${item.unit}`}
              </span>
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {item.categoryName} · {lastPriceLabel(lastPrices[item.productId])}
              {item.note && ` · ${item.note}`}
            </p>
          </div>
          {editable && (
            <div className="flex shrink-0 items-center">
              <EditItemDialog item={item} />
              <ConfirmDelete
                title="¿Quitar de la lista?"
                description={`«${item.productName}» dejará de estar apuntado en esta lista.`}
                onConfirm={() => removeItem(item.id)}
                successMessage="Quitado de la lista"
              />
              <PurchaseDialog
                item={item}
                lastPrice={lastPrices[item.productId] ?? { CUP: null, USD: null }}
                defaultRate={defaultRate}
                trigger={
                  <Button size="sm" className="ml-1">
                    <ShoppingCart />
                    Comprar
                  </Button>
                }
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function PurchasedItems({ items, editable }: { items: ListItem[]; editable: boolean }) {
  if (items.length === 0) {
    return <EmptyList>Aún no has comprado nada.</EmptyList>;
  }
  return (
    <ul className={LIST_CLASS}>
      {items.map((item) => {
        const p = item.purchase!;
        return (
          <li
            key={item.id}
            className="flex items-center gap-3 px-4 py-3"
            data-testid="purchased-item"
          >
            <CircleCheck className="text-pos size-5 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col leading-snug">
              <p className="text-muted-foreground truncate text-sm line-through">
                {item.productName}
              </p>
              <p className="text-muted-foreground truncate text-xs tabular-nums">
                {formatNumber(p.quantity)} {p.unit} × {formatMoney(p.unitPrice, p.currency)} ·{" "}
                {formatDay(p.occurredOn)}
              </p>
            </div>
            <span className="text-sm font-medium whitespace-nowrap tabular-nums">
              {formatMoney(p.total, p.currency)}
            </span>
            {editable && <UndoPurchase item={item} />}
          </li>
        );
      })}
    </ul>
  );
}

function UndoPurchase({ item }: { item: ListItem }) {
  const [pending, startTransition] = useTransition();
  function confirm() {
    startTransition(async () => {
      const result = await unpurchaseItem(item.id);
      if (result.ok) toast.success(`«${item.productName}» vuelve a pendiente`);
      else toast.error(result.error);
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Deshacer compra"
          title="Deshacer compra"
          className="text-muted-foreground"
          disabled={pending}
        >
          <Undo2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Deshacer la compra?</AlertDialogTitle>
          <AlertDialogDescription>
            Se anulará el gasto de {formatMoney(item.purchase!.total, item.purchase!.currency)}
            {item.purchase!.currency === "CUP"
              ? " y se devolverá al saldo"
              : " (pagado en USD, no cambia el saldo en CUP)"}
            . «{item.productName}» volverá a pendiente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>Deshacer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditItemDialog({ item }: { item: ListItem }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Editar">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{item.productName}</DialogTitle>
        </DialogHeader>
        {open && <EditItemForm item={item} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EditItemForm({ item, onDone }: { item: ListItem; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(listItemSchema),
    defaultValues: {
      productId: item.productId,
      quantity: item.quantity === null ? "" : String(item.quantity),
      unit: item.unit as Unit,
      note: item.note ?? "",
    } satisfies ListItemInput,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateItem(item.id, values);
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error);
        return;
      }
      toast.success("Producto actualizado");
      onDone();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="quantity"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-item-quantity">Cantidad</FieldLabel>
                <Input
                  {...field}
                  value={String(field.value ?? "")}
                  id="edit-item-quantity"
                  inputMode="decimal"
                  placeholder="Opcional"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="unit"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-item-unit">Unidad</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="edit-item-unit" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        <Controller
          name="note"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="edit-item-note">Nota (opcional)</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="edit-item-note" rows={2} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

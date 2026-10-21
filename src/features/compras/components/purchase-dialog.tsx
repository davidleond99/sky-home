"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { liveTotal, RateField, TotalBox } from "@/features/economia/components/expense-dialog";
import { type Unit, UNITS } from "@/features/economia/units";
import { todayIso } from "@/lib/dates";
import { applyServerErrors } from "@/lib/form-errors";
import { CURRENCIES, type Currency } from "@/lib/money";
import { purchaseItem } from "../actions";
import type { ListItem } from "../queries";
import { type PurchaseInput, purchaseSchema } from "../schemas";

type PriceHints = {
  /** Último precio pagado por el producto en cada moneda, para precargarlo. */
  lastPrice: Record<Currency, number | null>;
  /** Tasa de la última venta de USD, para compras en USD. */
  defaultRate: number | null;
};

export function PurchaseDialog({
  trigger,
  item,
  ...hints
}: { trigger: ReactNode; item: ListItem } & PriceHints) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Comprar «{item.productName}»</DialogTitle>
          <DialogDescription>
            Se registra como gasto. Si pagas en CUP, el total se descuenta del saldo.
          </DialogDescription>
        </DialogHeader>
        {open && <PurchaseForm item={item} {...hints} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PurchaseForm({
  item,
  lastPrice,
  defaultRate,
  onDone,
}: { item: ListItem; onDone: () => void } & PriceHints) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      occurredOn: todayIso(),
      quantity: String(item.quantity ?? 1),
      unit: item.unit as Unit,
      unitPrice: lastPrice.CUP === null ? "" : String(lastPrice.CUP),
      currency: "CUP",
      rate: "",
      note: item.note ?? "",
    } satisfies PurchaseInput,
  });

  const [quantity, unitPrice, currency, rate] = useWatch({
    control: form.control,
    name: ["quantity", "unitPrice", "currency", "rate"],
  });
  const { total, cupEquivalent } = liveTotal(quantity, unitPrice, rate);

  /** Al cambiar de moneda se propone el último precio en esa moneda (y la tasa en USD). */
  function changeCurrency(next: Currency) {
    form.setValue("currency", next);
    const price = lastPrice[next];
    form.setValue("unitPrice", price === null ? "" : String(price));
    form.setValue("rate", next === "USD" && defaultRate !== null ? String(defaultRate) : "");
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await purchaseItem(item.id, values);
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error);
        return;
      }
      toast.success(`«${item.productName}» comprado`);
      onDone();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Controller
          name="currency"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="purchase-currency">Moneda</FieldLabel>
              <Select value={field.value} onValueChange={(v) => changeCurrency(v as Currency)}>
                <SelectTrigger
                  id="purchase-currency"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === "CUP" ? "CUP (del saldo)" : "USD (pagado en dólares)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="quantity"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="purchase-quantity">Cantidad</FieldLabel>
                <Input
                  {...field}
                  value={String(field.value ?? "")}
                  id="purchase-quantity"
                  inputMode="decimal"
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
                <FieldLabel htmlFor="purchase-unit">Unidad</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="purchase-unit"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
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
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="unitPrice"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="purchase-price">
                  Precio por unidad ({currency ?? "CUP"})
                </FieldLabel>
                <Input
                  {...field}
                  value={String(field.value ?? "")}
                  id="purchase-price"
                  inputMode="decimal"
                  placeholder="0"
                  autoFocus
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="occurredOn"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="purchase-date">Fecha</FieldLabel>
                <Input
                  {...field}
                  id="purchase-date"
                  type="date"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        {currency === "USD" && <RateField control={form.control} id="purchase-rate" />}
        <TotalBox
          currency={currency ?? "CUP"}
          total={total}
          cupEquivalent={cupEquivalent}
          testId="purchase-total"
        />
        <Controller
          name="note"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="purchase-note">Nota (opcional)</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="purchase-note" rows={2} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Marcar como comprado"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

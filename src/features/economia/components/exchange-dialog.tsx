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
import { Textarea } from "@/components/ui/textarea";
import { todayIso } from "@/lib/dates";
import { applyServerErrors } from "@/lib/form-errors";
import { formatCup, multiplyMoney } from "@/lib/money";
import { createExchange, updateExchange } from "../actions";
import { type ExchangeInput, exchangeSchema } from "../schemas";

export type ExchangeInitial = {
  id: string;
  occurredOn: string;
  usdAmount: number;
  rate: number;
  note: string | null;
};

export function ExchangeDialog({
  trigger,
  initial,
}: {
  trigger: ReactNode;
  initial?: ExchangeInitial;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar venta de USD" : "Vender USD"}</DialogTitle>
          <DialogDescription>Los CUP recibidos se suman al saldo de la casa.</DialogDescription>
        </DialogHeader>
        {/* El formulario se monta al abrir: la fecha por defecto es la de ese momento. */}
        {open && <ExchangeForm initial={initial} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ExchangeForm({ initial, onDone }: { initial?: ExchangeInitial; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(exchangeSchema),
    defaultValues: {
      occurredOn: initial?.occurredOn ?? todayIso(),
      usdAmount: initial ? String(initial.usdAmount) : "",
      rate: initial ? String(initial.rate) : "",
      note: initial?.note ?? "",
    } satisfies ExchangeInput,
  });

  const [usd, rate] = useWatch({ control: form.control, name: ["usdAmount", "rate"] });
  const usdOk = exchangeSchema.shape.usdAmount.safeParse(usd);
  const rateOk = exchangeSchema.shape.rate.safeParse(rate);
  const total = usdOk.success && rateOk.success ? multiplyMoney(usdOk.data, rateOk.data) : null;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = initial
        ? await updateExchange(initial.id, values)
        : await createExchange(values);
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error);
        return;
      }
      toast.success(initial ? "Venta actualizada" : "Venta registrada");
      onDone();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Controller
          name="occurredOn"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="exchange-date">Fecha</FieldLabel>
              <Input {...field} id="exchange-date" type="date" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="usdAmount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="exchange-usd">USD vendidos</FieldLabel>
                <Input
                  {...field}
                  value={String(field.value ?? "")}
                  id="exchange-usd"
                  inputMode="decimal"
                  placeholder="100"
                  autoFocus
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="rate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="exchange-rate">Tasa (CUP por USD)</FieldLabel>
                <Input
                  {...field}
                  value={String(field.value ?? "")}
                  id="exchange-rate"
                  inputMode="decimal"
                  placeholder="400"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        <div className="bg-muted flex items-center justify-between rounded-lg px-4 py-3">
          <span className="text-muted-foreground text-sm">Recibes</span>
          <span className="text-lg font-semibold tabular-nums" data-testid="exchange-total">
            {total === null ? "—" : formatCup(total)}
          </span>
        </div>
        <Controller
          name="note"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="exchange-note">Nota (opcional)</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="exchange-note" rows={2} />
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

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  useForm,
  useWatch,
} from "react-hook-form";
import { Plus } from "lucide-react";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayIso } from "@/lib/dates";
import { applyServerErrors } from "@/lib/form-errors";
import { type Currency, formatCup, formatMoney, multiplyMoney } from "@/lib/money";
import { createExpense, updateExpense } from "../actions";
import type { CategoryOption, ProductOption } from "../queries";
import {
  type ExpenseInput,
  expenseSchema,
  paymentFields,
  quantity as quantityField,
  unitPrice as unitPriceField,
} from "../schemas";
import { type Unit, UNITS } from "../units";
import { NewProductForm } from "./new-product-form";
import { ProductCombobox } from "./product-combobox";

export type ExpenseInitial = {
  id: string;
  occurredOn: string;
  productId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: Currency;
  rate: number | null;
  note: string | null;
};

type Props = {
  trigger: ReactNode;
  products: ProductOption[];
  categories: CategoryOption[];
  initial?: ExpenseInitial;
  /** Moneda de un gasto nuevo (al editar manda la del gasto). */
  currency?: Currency;
  /** Tasa propuesta para gastos en USD: la de la última venta. */
  defaultRate?: number | null;
};

export function ExpenseDialog({ trigger, initial, currency = "CUP", ...props }: Props) {
  const [open, setOpen] = useState(false);
  const paidIn = initial?.currency ?? currency;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? "Editar gasto"
              : paidIn === "USD"
                ? "Registrar gasto en USD"
                : "Registrar gasto"}
          </DialogTitle>
          <DialogDescription>
            {paidIn === "USD"
              ? "Pagado en dólares: no cambia el saldo en CUP."
              : "El total se descuenta del saldo en CUP."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ExpenseForm
            {...props}
            initial={initial}
            currency={paidIn}
            onDone={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function emptyValues(
  occurredOn: string,
  currency: Currency,
  rate: number | string | null | undefined,
): ExpenseInput {
  return {
    occurredOn,
    productId: "",
    quantity: "1",
    unit: "unidad",
    unitPrice: "",
    currency,
    rate: currency === "USD" && rate != null ? String(rate) : "",
    note: "",
  };
}

function ExpenseForm({
  products: initialProducts,
  categories,
  initial,
  currency,
  defaultRate,
  onDone,
}: Omit<Props, "trigger" | "currency"> & { currency: Currency; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [products, setProducts] = useState(initialProducts);
  const [creating, setCreating] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: initial
      ? ({
          occurredOn: initial.occurredOn,
          productId: initial.productId,
          quantity: String(initial.quantity),
          unit: initial.unit as Unit,
          unitPrice: String(initial.unitPrice),
          currency: initial.currency,
          rate: initial.rate === null ? "" : String(initial.rate),
          note: initial.note ?? "",
        } satisfies ExpenseInput)
      : emptyValues(todayIso(), currency, defaultRate),
  });

  const [quantity, unitPrice, rate] = useWatch({
    control: form.control,
    name: ["quantity", "unitPrice", "rate"],
  });
  const { total, cupEquivalent } = liveTotal(quantity, unitPrice, rate);

  function selectProduct(product: ProductOption) {
    form.setValue("productId", product.id, { shouldValidate: true });
    form.setValue("unit", (product.lastUnit ?? product.defaultUnit) as Unit);
    const lastPrice = product.lastPrice[currency];
    if (lastPrice !== null && !initial) {
      form.setValue("unitPrice", String(lastPrice));
    }
  }

  function submit(addAnother: boolean) {
    return form.handleSubmit((values) => {
      startTransition(async () => {
        const result = initial
          ? await updateExpense(initial.id, values)
          : await createExpense(values);
        if (!result.ok) {
          applyServerErrors(form, result);
          toast.error(result.error);
          return;
        }
        toast.success(initial ? "Gasto actualizado" : "Gasto registrado");
        if (addAnother) {
          // Misma fecha (y tasa), listo para el siguiente producto de la compra.
          form.reset(emptyValues(values.occurredOn, currency, values.rate));
        } else {
          onDone();
        }
      });
    });
  }

  if (creating !== null) {
    return (
      <NewProductForm
        initialName={creating}
        categories={categories}
        onCancel={() => setCreating(null)}
        onCreated={(product) => {
          const option: ProductOption = {
            ...product,
            lastPrice: { CUP: null, USD: null },
            lastUnit: null,
          };
          setProducts((list) => [...list, option]);
          selectProduct(option);
          setCreating(null);
        }}
      />
    );
  }

  return (
    <form onSubmit={submit(false)} noValidate>
      <FieldGroup>
        <Controller
          name="productId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="expense-product">Producto</FieldLabel>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <ProductCombobox
                    id="expense-product"
                    products={products}
                    value={field.value}
                    onChange={selectProduct}
                    onCreate={setCreating}
                    invalid={fieldState.invalid}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Nuevo producto"
                  title="Nuevo producto"
                  onClick={() => setCreating("")}
                >
                  <Plus />
                </Button>
              </div>
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
                <FieldLabel htmlFor="expense-quantity">Cantidad</FieldLabel>
                <Input
                  {...field}
                  value={String(field.value ?? "")}
                  id="expense-quantity"
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
                <FieldLabel htmlFor="expense-unit">Unidad</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="expense-unit"
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
                <FieldLabel htmlFor="expense-price">Precio por unidad ({currency})</FieldLabel>
                <Input
                  {...field}
                  value={String(field.value ?? "")}
                  id="expense-price"
                  inputMode="decimal"
                  placeholder="0"
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
                <FieldLabel htmlFor="expense-date">Fecha</FieldLabel>
                <Input {...field} id="expense-date" type="date" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        {currency === "USD" && <RateField control={form.control} id="expense-rate" />}
        <TotalBox
          currency={currency}
          total={total}
          cupEquivalent={cupEquivalent}
          testId="expense-total"
        />
        <Controller
          name="note"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="expense-note">Nota (opcional)</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="expense-note" rows={2} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <DialogFooter className="gap-2">
          {!initial && (
            <Button type="button" variant="outline" disabled={pending} onClick={submit(true)}>
              Guardar y añadir otro
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

/** Total en la moneda del gasto y, en USD, su equivalente en CUP con la tasa indicada. */
export function liveTotal(quantity: unknown, unitPrice: unknown, rate: unknown) {
  const q = quantityField.safeParse(quantity);
  const p = unitPriceField.safeParse(unitPrice);
  const r = paymentFields.rate.safeParse(rate);
  const total = q.success && p.success ? multiplyMoney(q.data, p.data) : null;
  const cupEquivalent = total !== null && r.success && r.data ? multiplyMoney(total, r.data) : null;
  return { total, cupEquivalent };
}

export function RateField<T extends FieldValues>({
  control,
  id,
}: {
  control: Control<T>;
  id: string;
}) {
  return (
    <Controller
      name={"rate" as Path<T>}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>Tasa (CUP por USD)</FieldLabel>
          <Input
            {...field}
            value={String(field.value ?? "")}
            id={id}
            inputMode="decimal"
            placeholder="0"
            aria-invalid={fieldState.invalid}
          />
          <FieldDescription>
            Se propone la de tu última venta de USD. Sirve para comparar con lo que pagas en CUP.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function TotalBox({
  currency,
  total,
  cupEquivalent,
  testId,
}: {
  currency: Currency;
  total: number | null;
  cupEquivalent: number | null;
  testId: string;
}) {
  return (
    <div className="bg-muted flex items-center justify-between rounded-lg px-4 py-3">
      <span className="text-muted-foreground text-sm">Total</span>
      <span className="text-right">
        <span className="block text-lg font-semibold tabular-nums" data-testid={testId}>
          {total === null ? "—" : formatMoney(total, currency)}
        </span>
        {currency === "USD" && cupEquivalent !== null && (
          <span className="text-muted-foreground block text-xs tabular-nums">
            ≈ {formatCup(cupEquivalent)}
          </span>
        )}
      </span>
    </div>
  );
}

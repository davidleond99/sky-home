"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewProductForm } from "@/features/economia/components/new-product-form";
import { ProductCombobox } from "@/features/economia/components/product-combobox";
import type { CategoryOption, ProductOption } from "@/features/economia/queries";
import { type Unit, UNITS } from "@/features/economia/units";
import { applyServerErrors } from "@/lib/form-errors";
import { addItem } from "../actions";
import { type ListItemInput, listItemSchema } from "../schemas";

const empty: ListItemInput = { productId: "", quantity: "", unit: "unidad", note: "" };

/** Apuntar un producto del catálogo (o uno nuevo) en la lista. */
export function AddItemForm({
  listId,
  products: initialProducts,
  categories,
  inList,
}: {
  listId: string;
  products: ProductOption[];
  categories: CategoryOption[];
  /** Productos ya apuntados: no se ofrecen otra vez. */
  inList: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [created, setCreated] = useState<ProductOption[]>([]);
  const [creating, setCreating] = useState<string | null>(null);
  const products = [...initialProducts, ...created].filter((p) => !inList.includes(p.id));

  const form = useForm({ resolver: zodResolver(listItemSchema), defaultValues: empty });

  function selectProduct(product: ProductOption) {
    form.setValue("productId", product.id, { shouldValidate: true });
    form.setValue("unit", (product.lastUnit ?? product.defaultUnit) as Unit);
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await addItem(listId, values);
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error);
        return;
      }
      const name = products.find((p) => p.id === values.productId)?.name ?? "Producto";
      toast.success(`«${name}» apuntado`);
      form.reset(empty);
    });
  });

  if (creating !== null) {
    return (
      <div className="rounded-lg border p-4">
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
            setCreated((list) => [...list, option]);
            selectProduct(option);
            setCreating(null);
          }}
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Apuntar producto"
      className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_7rem_8rem_auto] sm:items-start"
    >
      <Controller
        name="productId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="item-product">Producto</FieldLabel>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <ProductCombobox
                  id="item-product"
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
      <Controller
        name="quantity"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="item-quantity">Cantidad</FieldLabel>
            <Input
              {...field}
              value={String(field.value ?? "")}
              id="item-quantity"
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
            <FieldLabel htmlFor="item-unit">Unidad</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="item-unit" className="w-full" aria-invalid={fieldState.invalid}>
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
      <Button type="submit" disabled={pending} className="sm:mt-[1.375rem]">
        <Plus />
        {pending ? "Apuntando…" : "Apuntar"}
      </Button>
    </form>
  );
}

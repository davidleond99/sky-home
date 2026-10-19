"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";
import { applyServerErrors } from "@/lib/form-errors";
import { createProduct, type CreatedProduct } from "../actions";
import type { CategoryOption } from "../queries";
import { type ProductInput, productSchema } from "../schemas";
import { UNITS } from "../units";

/**
 * Formulario de producto. Sin `onSubmitProduct`, crea un producto nuevo;
 * con él, delega el guardado (p. ej. para editar uno existente).
 */
export function NewProductForm({
  initialName = "",
  initialValues,
  categories,
  onCancel,
  onCreated,
  onSubmitProduct,
  submitLabel = "Crear producto",
}: {
  initialName?: string;
  initialValues?: ProductInput;
  categories: CategoryOption[];
  onCancel: () => void;
  onCreated?: (product: CreatedProduct) => void;
  onSubmitProduct?: (values: ProductInput) => Promise<ActionResult<unknown>>;
  submitLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues:
      initialValues ??
      ({
        name: initialName,
        categoryId: categories[0]?.id ?? "",
        defaultUnit: "unidad",
      } satisfies ProductInput),
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      if (onSubmitProduct) {
        const result = await onSubmitProduct(values);
        if (!result.ok) {
          applyServerErrors(form, result);
          toast.error(result.error);
          return;
        }
        toast.success("Producto actualizado");
        onCancel();
        return;
      }
      const result = await createProduct(values);
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error);
        return;
      }
      toast.success(`Producto «${values.name}» creado`);
      onCreated?.(result.data);
    });
  });

  return (
    // Se evita el submit anidado: este formulario puede vivir dentro del diálogo de gasto.
    <div
      className="flex flex-col"
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
          e.preventDefault();
          void onSubmit();
        }
      }}
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="product-name">Nombre del producto</FieldLabel>
              <Input {...field} id="product-name" autoFocus aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="categoryId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-category">Categoría</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="product-category"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Elige…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="defaultUnit"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-unit">Unidad habitual</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="product-unit" className="w-full">
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
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={pending}>
            {pending ? "Guardando…" : submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </div>
  );
}

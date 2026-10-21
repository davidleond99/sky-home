"use client";

import { Archive, ArchiveRestore, Pencil, Plus } from "lucide-react";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import {
  createCategory,
  setCategoryArchived,
  setProductArchived,
  updateCategory,
  updateProduct,
} from "../actions";
import type { CatalogCategory, CatalogProduct, CategoryOption } from "../queries";
import { UNITS } from "../units";
import { NewProductForm } from "./new-product-form";

const unitLabel = (value: string) => UNITS.find((u) => u.value === value)?.label ?? value;

function useRun() {
  const [pending, startTransition] = useTransition();
  function run(action: () => Promise<ActionResult<unknown>>, success: string, after?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        after?.();
      } else {
        toast.error(result.error);
      }
    });
  }
  return { pending, run };
}

export function CatalogManager({
  catalog,
  categories,
}: {
  catalog: CatalogCategory[];
  categories: CategoryOption[];
}) {
  const [showArchived, setShowArchived] = useState(false);
  const visible = catalog.filter((c) => showArchived || !c.archived);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm text-pretty">
        Productos y categorías con los que se registran los gastos.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NewCategoryForm />
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Mostrar archivados
        </label>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] items-start gap-4">
        {visible.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            categories={categories}
            showArchived={showArchived}
          />
        ))}
      </div>
    </div>
  );
}

function NewCategoryForm() {
  const [name, setName] = useState("");
  const { pending, run } = useRun();

  function submit(e: FormEvent) {
    e.preventDefault();
    run(
      () => createCategory({ name }),
      `Categoría «${name.trim()}» creada`,
      () => setName(""),
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nueva categoría"
        aria-label="Nombre de la nueva categoría"
        className="w-56"
      />
      <Button type="submit" variant="secondary" size="lg" disabled={pending || !name.trim()}>
        <Plus />
        Añadir
      </Button>
    </form>
  );
}

function CategoryCard({
  category,
  categories,
  showArchived,
}: {
  category: CatalogCategory;
  categories: CategoryOption[];
  showArchived: boolean;
}) {
  const { pending, run } = useRun();
  const products = category.products.filter((p) => showArchived || !p.archived);

  return (
    <Card className={cn("gap-0 py-0", category.archived && "opacity-60")}>
      <CardHeader className="px-4 py-3.5">
        <CardTitle className="flex items-center gap-2 text-[15px]">
          {category.name}
          {category.archived && <Badge variant="secondary">Archivada</Badge>}
        </CardTitle>
        <CardDescription className="text-xs">
          {products.length} {products.length === 1 ? "producto" : "productos"}
        </CardDescription>
        <CardAction className="text-muted-foreground flex">
          <RenameCategoryDialog category={category} />
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            aria-label={category.archived ? "Restaurar categoría" : "Archivar categoría"}
            onClick={() =>
              run(
                () => setCategoryArchived(category.id, !category.archived),
                category.archived ? "Categoría restaurada" : "Categoría archivada",
              )
            }
          >
            {category.archived ? <ArchiveRestore /> : <Archive />}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col px-0">
        {products.length === 0 && (
          <p className="text-muted-foreground border-t px-4 py-2.5 text-sm">Sin productos.</p>
        )}
        {products.map((product) => (
          <ProductRow key={product.id} product={product} categories={categories} />
        ))}
        {!category.archived && (
          <ProductDialog
            title={`Nuevo producto en ${category.name}`}
            categories={categories}
            initialValues={{ name: "", categoryId: category.id, defaultUnit: "unidad" }}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary m-2 self-start"
              >
                <Plus />
                Añadir producto
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

function ProductRow({
  product,
  categories,
}: {
  product: CatalogProduct;
  categories: CategoryOption[];
}) {
  const { pending, run } = useRun();
  return (
    <div
      className={cn(
        "hover:bg-glass-inset flex items-center gap-2 border-t py-1 pr-2 pl-4 text-sm",
        product.archived && "opacity-60",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{product.name}</span>
      <span className="text-muted-foreground text-xs">{unitLabel(product.defaultUnit)}</span>
      {product.uses > 0 && (
        <Badge variant="outline" title="Gastos registrados con este producto">
          {product.uses}
        </Badge>
      )}
      {product.archived && <Badge variant="secondary">Archivado</Badge>}
      <ProductDialog
        title={`Editar «${product.name}»`}
        categories={categories}
        productId={product.id}
        initialValues={{
          name: product.name,
          categoryId: product.categoryId,
          defaultUnit: product.defaultUnit as (typeof UNITS)[number]["value"],
        }}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-7"
            aria-label="Editar producto"
          >
            <Pencil />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground size-7"
        disabled={pending}
        aria-label={product.archived ? "Restaurar producto" : "Archivar producto"}
        onClick={() =>
          run(
            () => setProductArchived(product.id, !product.archived),
            product.archived ? "Producto restaurado" : "Producto archivado",
          )
        }
      >
        {product.archived ? <ArchiveRestore /> : <Archive />}
      </Button>
    </div>
  );
}

function ProductDialog({
  title,
  categories,
  initialValues,
  productId,
  trigger,
}: {
  title: string;
  categories: CategoryOption[];
  initialValues: { name: string; categoryId: string; defaultUnit: (typeof UNITS)[number]["value"] };
  productId?: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Los productos aparecen al registrar un gasto.</DialogDescription>
        </DialogHeader>
        {open && (
          <NewProductForm
            categories={categories}
            initialValues={initialValues}
            onCancel={() => setOpen(false)}
            onCreated={() => setOpen(false)}
            onSubmitProduct={productId ? (values) => updateProduct(productId, values) : undefined}
            submitLabel={productId ? "Guardar" : "Crear producto"}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RenameCategoryDialog({ category }: { category: CatalogCategory }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const { pending, run } = useRun();

  function submit(e: FormEvent) {
    e.preventDefault();
    run(
      () => updateCategory(category.id, { name }),
      "Categoría renombrada",
      () => setOpen(false),
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setName(category.name);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Renombrar categoría">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Renombrar categoría</DialogTitle>
          <DialogDescription>El cambio queda registrado en la actividad.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={pending || !name.trim()}>
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

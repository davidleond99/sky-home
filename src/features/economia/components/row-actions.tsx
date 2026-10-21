"use client";

import { Pencil } from "lucide-react";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Button } from "@/components/ui/button";
import { formatCup, formatMoney, formatUsd } from "@/lib/money";
import { deleteExchange, deleteExpense } from "../actions";
import { useCatalogOptions } from "./catalog-options";
import { ExchangeDialog, type ExchangeInitial } from "./exchange-dialog";
import { ExpenseDialog, type ExpenseInitial } from "./expense-dialog";

const editButton = (
  <Button variant="ghost" size="icon" aria-label="Editar">
    <Pencil />
  </Button>
);

export function ExchangeRowActions({
  exchange,
}: {
  exchange: ExchangeInitial & { cupAmount: number };
}) {
  return (
    <div className="flex justify-end">
      <ExchangeDialog initial={exchange} trigger={editButton} />
      <ConfirmDelete
        title="¿Eliminar esta venta?"
        description={`Se restarán ${formatCup(exchange.cupAmount)} del saldo (venta de ${formatUsd(exchange.usdAmount)}). Quedará registrado en la actividad.`}
        onConfirm={() => deleteExchange(exchange.id)}
        successMessage="Venta eliminada"
      />
    </div>
  );
}

export function ExpenseRowActions({
  expense,
}: {
  expense: ExpenseInitial & { total: number; productName: string };
}) {
  const { products, categories } = useCatalogOptions();
  // Si el producto se archivó, se añade para poder editar el gasto sin cambiarlo.
  const options = products.some((p) => p.id === expense.productId)
    ? products
    : [
        ...products,
        {
          id: expense.productId,
          name: expense.productName,
          defaultUnit: expense.unit,
          categoryId: "",
          categoryName: "Archivados",
          lastPrice: { CUP: null, USD: null },
          lastUnit: null,
        },
      ];

  return (
    <div className="flex justify-end">
      <ExpenseDialog
        initial={expense}
        products={options}
        categories={categories}
        trigger={editButton}
      />
      <ConfirmDelete
        title="¿Eliminar este gasto?"
        description={
          expense.currency === "USD"
            ? `${expense.productName}: se anulará el gasto de ${formatMoney(expense.total, "USD")} (no cambia el saldo en CUP). Quedará registrado en la actividad.`
            : `${expense.productName}: se devolverán ${formatCup(expense.total)} al saldo. Quedará registrado en la actividad.`
        }
        onConfirm={() => deleteExpense(expense.id)}
        successMessage="Gasto eliminado"
      />
    </div>
  );
}

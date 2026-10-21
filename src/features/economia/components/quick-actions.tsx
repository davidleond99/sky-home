import { ArrowDownLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listActiveCategories, listProductOptions } from "../queries";
import { ExchangeDialog } from "./exchange-dialog";
import { ExpenseDialog } from "./expense-dialog";

export async function QuickActions() {
  const [products, categories] = await Promise.all([listProductOptions(), listActiveCategories()]);
  return (
    <>
      <ExchangeDialog
        trigger={
          <Button variant="outline" size="lg">
            <ArrowDownLeft />
            Vender USD
          </Button>
        }
      />
      <ExpenseDialog
        products={products}
        categories={categories}
        trigger={
          <Button size="lg">
            <ShoppingCart />
            Registrar gasto
          </Button>
        }
      />
    </>
  );
}

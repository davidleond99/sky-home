import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseDialog } from "@/features/economia/components/expense-dialog";
import {
  getLatestRate,
  listActiveCategories,
  listProductOptions,
} from "@/features/economia/queries";

export async function UsdQuickActions() {
  const [products, categories, latestRate] = await Promise.all([
    listProductOptions(),
    listActiveCategories(),
    getLatestRate(),
  ]);
  return (
    <ExpenseDialog
      currency="USD"
      defaultRate={latestRate}
      products={products}
      categories={categories}
      trigger={
        <Button size="lg">
          <DollarSign />
          Registrar gasto USD
        </Button>
      }
    />
  );
}

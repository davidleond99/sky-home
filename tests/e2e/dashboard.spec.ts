import { expect, test } from "@playwright/test";
import { DAVID, login } from "./helpers";

test("inicio muestra KPIs, gráficas y permite cambiar de periodo", async ({ page }) => {
  await login(page, DAVID);
  for (const title of ["Saldo disponible", "Gastado"]) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
  for (const title of [
    "Saldo en CUP",
    "Gasto diario promedio",
    "¿En qué se va el dinero?",
    "Top 5 productos",
    "Gasto mensual",
  ]) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
  for (const title of ["USD vendidos", "Gasto por persona", "Tasa de cambio"]) {
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  }
  await page.getByRole("tab", { name: "Todo" }).click();
  await expect(page).toHaveURL(/period=all/);
  await expect(page.getByRole("tab", { name: "Todo" })).toHaveAttribute("data-state", "active");
});

import { expect, test } from "@playwright/test";
import { DAVID, login } from "./helpers";

test("inicio muestra KPIs, gráficas y permite cambiar de periodo", async ({ page }) => {
  await login(page, DAVID);
  for (const title of ["Saldo disponible", "USD vendidos", "Gastado", "Tasa media"]) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
  for (const title of [
    "Saldo en CUP",
    "¿En qué se va el dinero?",
    "Gasto mensual",
    "Tasa de cambio",
  ]) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
  await page.getByRole("tab", { name: "Todo" }).click();
  await expect(page).toHaveURL(/period=all/);
  await expect(page.getByRole("tab", { name: "Todo" })).toHaveAttribute("data-state", "active");
});

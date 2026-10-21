import { expect, test, type Page } from "@playwright/test";
import { DAVID, expectBalance, login, readBalance } from "./helpers";

test.describe.configure({ mode: "serial" });

function rowWith(page: Page, text: string) {
  return page.getByRole("row").filter({ hasText: text });
}

async function pickProduct(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Producto" }).click();
  await page.getByPlaceholder("Buscar producto…").fill(name);
  await page.getByRole("option", { name, exact: true }).click();
}

async function deleteRow(page: Page, text: string) {
  await rowWith(page, text).getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Gasto eliminado")).toBeVisible();
}

test("gasto en USD: no toca el saldo CUP y se compara con lo pagado en CUP", async ({ page }) => {
  const stamp = Date.now();
  const product = `Producto USD e2e ${stamp}`;
  const tag = `e2e-usd-${stamp}`;

  await login(page, DAVID);
  await page.goto("/economia");
  const start = await readBalance(page);

  // ── Registra en USD un producto nuevo: 2 × 3,50 USD a 400 = 7 USD ≈ 2.800 CUP ──
  await page.getByRole("link", { name: "Dólares" }).click();
  await page.getByRole("tab", { name: "Gastos USD" }).click();
  await page.getByRole("button", { name: "Registrar gasto USD" }).click();
  const dialog = page.getByRole("dialog", { name: "Registrar gasto en USD" });
  await dialog.getByRole("combobox", { name: "Producto" }).click();
  await page.getByPlaceholder("Buscar producto…").fill(product);
  await page.getByRole("option", { name: `Crear «${product}»` }).click();
  await dialog.getByRole("button", { name: "Crear producto" }).click();
  await expect(page.getByText(`Producto «${product}» creado`)).toBeVisible();

  await dialog.getByLabel("Cantidad").fill("2");
  await dialog.getByLabel("Precio por unidad (USD)").fill("3,50");
  await dialog.getByLabel("Tasa (CUP por USD)").fill("400");
  await dialog.getByLabel("Nota (opcional)").fill(tag);
  await expect(dialog.getByTestId("expense-total")).toHaveText("7 USD");
  await expect(dialog).toContainText("≈ 2.800 CUP");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Gasto registrado")).toBeVisible();
  await expect(rowWith(page, tag)).toContainText("2.800 CUP");

  // ── El saldo en CUP no cambia ──
  await page.goto("/economia");
  await expectBalance(page, start);
  await page.goto("/economia/gastos");
  await expect(rowWith(page, tag)).toHaveCount(0);

  // ── El mismo producto en CUP: 1 × 1.500 → el USD salió más barato (1.400 CUP/unidad) ──
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  const cup = page.getByRole("dialog", { name: "Registrar gasto" });
  await pickProduct(page, product);
  await cup.getByLabel("Cantidad").fill("1");
  await cup.getByLabel("Precio por unidad (CUP)").fill("1500");
  await cup.getByLabel("Nota (opcional)").fill(tag);
  await cup.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Gasto registrado")).toBeVisible();
  await expectBalance(page, start - 1500);

  await page.goto("/dolares/comparativa?period=month");
  const comparison = page.getByTestId("comparison-row").filter({ hasText: product });
  await expect(comparison).toContainText("Más barato en USD");
  await expect(comparison).toContainText("1.500 CUP / unidad");
  await expect(comparison).toContainText("3,50 USD / unidad");
  await expect(comparison).toContainText("−6,7 %");

  // ── Resumen en USD ──
  await page.getByRole("tab", { name: "Resumen" }).click();
  await expect(page.getByText("Gastado en USD")).toBeVisible();
  await expect(page.getByText("Tasa a la que vendiste USD")).toBeVisible();

  // ── Limpieza ──
  await page.goto("/dolares/gastos");
  await deleteRow(page, tag);
  await page.goto("/economia/gastos");
  await deleteRow(page, tag);
  await expectBalance(page, start);

  await page.goto("/economia/catalogo");
  await page
    .locator("div", { hasText: new RegExp(`^${product}`) })
    .last()
    .getByRole("button", { name: "Archivar producto" })
    .click();
  await expect(page.getByText("Producto archivado")).toBeVisible();
});

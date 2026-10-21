import { expect, test, type Page } from "@playwright/test";
import { DAVID, expectBalance, GABRIELA, login, readBalance } from "./helpers";

test.describe.configure({ mode: "serial" });

async function sellUsd(page: Page, usd: string, rate: string, note: string) {
  await page.getByRole("button", { name: "Vender USD" }).click();
  const dialog = page.getByRole("dialog", { name: "Vender USD" });
  await dialog.getByLabel("USD vendidos").fill(usd);
  await dialog.getByLabel("Tasa (CUP por USD)").fill(rate);
  await dialog.getByLabel("Nota (opcional)").fill(note);
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Venta registrada")).toBeVisible();
}

function rowWith(page: Page, text: string) {
  return page.getByRole("row").filter({ hasText: text });
}

test("flujo completo: vender USD, gastar, editar, borrar y trazas", async ({ page, browser }) => {
  const tag = `e2e-${Date.now()}`;

  // ── David vende 100 USD a 400 ──
  await login(page, DAVID);
  await page.goto("/economia");
  const start = await readBalance(page);

  await sellUsd(page, "100", "400", `${tag} venta David`);
  await expectBalance(page, start + 40_000);

  // ── Registra arroz: 2 lb × 250 = 500 ──
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  const dialog = page.getByRole("dialog", { name: "Registrar gasto" });
  await dialog.getByRole("combobox", { name: "Producto" }).click();
  await page.getByPlaceholder("Buscar producto…").fill("Arroz");
  await page.getByRole("option", { name: "Arroz", exact: true }).click();
  await dialog.getByLabel("Cantidad").fill("2");
  await dialog.getByLabel("Precio por unidad (CUP)").fill("250");
  await dialog.getByLabel("Nota (opcional)").fill(`${tag} gasto`);
  await expect(dialog.getByTestId("expense-total")).toHaveText("500 CUP");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Gasto registrado")).toBeVisible();
  await expectBalance(page, start + 39_500);

  // ── Edita el gasto: 3 lb → 750 ──
  await rowWith(page, `${tag} gasto`).getByRole("button", { name: "Editar" }).click();
  const edit = page.getByRole("dialog", { name: "Editar gasto" });
  await edit.getByLabel("Cantidad").fill("3");
  await expect(edit.getByTestId("expense-total")).toHaveText("750 CUP");
  await edit.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Gasto actualizado")).toBeVisible();
  await expectBalance(page, start + 39_250);

  // ── Gabriela vende 100 USD a 410 desde su sesión ──
  const gabiContext = await browser.newContext();
  const gabi = await gabiContext.newPage();
  await login(gabi, GABRIELA);
  await gabi.goto("/economia");
  await sellUsd(gabi, "100", "410", `${tag} venta Gabriela`);
  await expectBalance(gabi, start + 80_250);
  await expect(rowWith(gabi, `${tag} venta Gabriela`)).toContainText("Gabriela");
  await gabiContext.close();

  // ── David borra el gasto: vuelve el dinero ──
  await page.reload();
  await expectBalance(page, start + 80_250);
  await rowWith(page, `${tag} gasto`).getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Gasto eliminado")).toBeVisible();
  await expectBalance(page, start + 81_000);

  // ── La actividad registra quién hizo cada cosa ──
  await page.getByRole("link", { name: "Actividad" }).click();
  await expect(rowWith(page, "Arroz: 3 lb × 250 CUP = 750 CUP").first()).toContainText("Eliminó");
  await expect(rowWith(page, "Arroz: 3 lb × 250 CUP = 750 CUP").nth(1)).toContainText("Editó");
  await expect(rowWith(page, "Venta de 100 USD a 410 CUP/USD").first()).toContainText("Gabriela");
  await expect(rowWith(page, "Venta de 100 USD a 400 CUP/USD").first()).toContainText("David León");

  // Detalle del cambio: cantidad 2 → 3
  await rowWith(page, "Editó")
    .filter({ hasText: "Arroz" })
    .first()
    .getByRole("button", { name: "Ver cambios" })
    .click();
  const detail = page.getByRole("dialog", { name: "Detalle" });
  await expect(detail.getByRole("row", { name: /Cantidad 2 3/ })).toBeVisible();
  await page.keyboard.press("Escape");

  // ── Limpieza: borra las ventas de prueba (también queda trazado) ──
  await page.goto("/economia/ventas");
  for (const who of ["David", "Gabriela"]) {
    await rowWith(page, `${tag} venta ${who}`).getByRole("button", { name: "Eliminar" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
    await expect(rowWith(page, `${tag} venta ${who}`)).toHaveCount(0);
  }
  await expectBalance(page, start);
});

test("crear un producto nuevo desde el formulario de gasto", async ({ page }) => {
  const name = `Producto e2e ${Date.now()}`;
  await login(page, DAVID);
  await page.goto("/economia/gastos");

  await page.getByRole("button", { name: "Registrar gasto" }).click();
  const dialog = page.getByRole("dialog", { name: "Registrar gasto" });
  await dialog.getByRole("combobox", { name: "Producto" }).click();
  await page.getByPlaceholder("Buscar producto…").fill(name);
  await page.getByRole("option", { name: `Crear «${name}»` }).click();

  await expect(dialog.getByLabel("Nombre del producto")).toHaveValue(name);
  await dialog.getByRole("button", { name: "Crear producto" }).click();
  await expect(page.getByText(`Producto «${name}» creado`)).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Producto" })).toContainText(name);

  // Se archiva para no ensuciar el catálogo real.
  await page.keyboard.press("Escape");
  await page.goto("/economia/catalogo");
  await page
    .locator("div", { hasText: new RegExp(`^${name}`) })
    .last()
    .getByRole("button", { name: "Archivar producto" })
    .click();
  await expect(page.getByText("Producto archivado")).toBeVisible();
});

test("añadir producto con el botón «Nuevo producto» del formulario de gasto", async ({ page }) => {
  const name = `Producto e2e ${Date.now()}`;
  await login(page, DAVID);
  await page.goto("/economia/gastos");

  await page.getByRole("button", { name: "Registrar gasto" }).click();
  const dialog = page.getByRole("dialog", { name: "Registrar gasto" });
  await dialog.getByRole("button", { name: "Nuevo producto" }).click();

  await dialog.getByLabel("Nombre del producto").fill(name);
  await dialog.getByRole("button", { name: "Crear producto" }).click();
  await expect(page.getByText(`Producto «${name}» creado`)).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Producto" })).toContainText(name);

  await page.keyboard.press("Escape");
  await page.goto("/economia/catalogo");
  await page
    .locator("div", { hasText: new RegExp(`^${name}`) })
    .last()
    .getByRole("button", { name: "Archivar producto" })
    .click();
  await expect(page.getByText("Producto archivado")).toBeVisible();
});

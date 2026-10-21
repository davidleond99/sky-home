import { expect, test, type Page } from "@playwright/test";
import { DAVID, expectBalance, login, readBalance } from "./helpers";

test.describe.configure({ mode: "serial" });

async function pickProduct(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Producto" }).click();
  await page.getByPlaceholder("Buscar producto…").fill(name);
  await page.getByRole("option", { name, exact: true }).click();
}

function homeCard(page: Page, listName: string) {
  return page.getByTestId("shopping-list-card").filter({ hasText: listName });
}

test("lista de la compra: apuntar, comprar, deshacer, cerrar y eliminar", async ({ page }) => {
  const stamp = Date.now();
  const listName = `Lista e2e ${stamp}`;
  const newProduct = `Producto lista e2e ${stamp}`;

  await login(page, DAVID);
  await page.goto("/economia");
  const start = await readBalance(page);

  // ── Crea la lista ──
  await page.goto("/compras");
  await page.getByRole("button", { name: "Nueva lista" }).first().click();
  const create = page.getByRole("dialog", { name: "Nueva lista de la compra" });
  await create.getByLabel("Nombre").fill(listName);
  await create.getByRole("button", { name: "Crear lista" }).click();
  await expect(page.getByRole("heading", { name: listName })).toBeVisible();
  const listUrl = page.url();

  // ── Apunta un producto del catálogo y uno nuevo ──
  await pickProduct(page, "Arroz");
  await page.getByLabel("Cantidad").fill("2");
  await page.getByRole("button", { name: "Apuntar" }).click();
  await expect(page.getByText("«Arroz» apuntado")).toBeVisible();

  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre del producto").fill(newProduct);
  await page.getByRole("button", { name: "Crear producto" }).click();
  await expect(page.getByText(`Producto «${newProduct}» creado`)).toBeVisible();
  await page.getByRole("button", { name: "Apuntar" }).click();
  await expect(page.getByText(`«${newProduct}» apuntado`)).toBeVisible();
  await expect(page.getByTestId("pending-item")).toHaveCount(2);

  // ── En Inicio aparece con todo pendiente ──
  await page.goto("/");
  await expect(homeCard(page, listName)).toContainText("Pendientes (2)");
  await expect(homeCard(page, listName)).toContainText("0 de 2 comprados");

  // ── Compra el arroz: 2 lb × 250 = 500 → gasto en Economía ──
  await page.goto(listUrl);
  await page
    .getByTestId("pending-item")
    .filter({ hasText: "Arroz" })
    .getByRole("button", { name: "Comprado" })
    .click();
  const buy = page.getByRole("dialog", { name: "Comprar «Arroz»" });
  await expect(buy.getByLabel("Cantidad")).toHaveValue("2");
  await buy.getByLabel("Precio por unidad (CUP)").fill("250");
  await expect(buy.getByTestId("purchase-total")).toHaveText("500 CUP");
  await buy.getByRole("button", { name: "Marcar como comprado" }).click();
  await expect(page.getByText("«Arroz» comprado")).toBeVisible();
  await expect(page.getByTestId("purchased-item")).toContainText("500 CUP");
  await expect(page.getByTestId("list-spent")).toHaveText("500 CUP");

  await page.goto("/economia");
  await expectBalance(page, start - 500);

  await page.goto("/");
  await expect(homeCard(page, listName)).toContainText("1 de 2 comprados");
  await expect(homeCard(page, listName)).toContainText("Comprados (1)");

  // ── Deshace la compra: el gasto se anula y el saldo vuelve ──
  await page.goto(listUrl);
  await page.getByRole("button", { name: "Deshacer compra" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Deshacer" }).click();
  await expect(page.getByText("«Arroz» vuelve a pendiente")).toBeVisible();
  await expect(page.getByTestId("pending-item")).toHaveCount(2);

  await page.goto("/economia");
  await expectBalance(page, start);

  // ── Cierra la lista: desaparece de Inicio ──
  await page.goto(listUrl);
  await page.getByRole("button", { name: "Cerrar lista" }).click();
  await expect(page.getByText("Lista cerrada", { exact: true })).toBeVisible();
  await page.goto("/");
  await expect(homeCard(page, listName)).toHaveCount(0);

  // ── Limpieza: elimina la lista y archiva el producto creado ──
  await page.goto(listUrl);
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Lista eliminada")).toBeVisible();
  await expect(page).toHaveURL(/\/compras$/);

  await page.goto("/economia/catalogo");
  await page
    .locator("div", { hasText: new RegExp(`^${newProduct}`) })
    .last()
    .getByRole("button", { name: "Archivar producto" })
    .click();
  await expect(page.getByText("Producto archivado")).toBeVisible();
});

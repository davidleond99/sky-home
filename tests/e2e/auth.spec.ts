import { expect, test } from "@playwright/test";
import { DAVID, login } from "./helpers";

test("sin sesión redirige al login conservando la ruta", async ({ page }) => {
  await page.goto("/economia");
  await expect(page).toHaveURL(/\/login\?next=%2Feconomia/);
});

test("credenciales incorrectas muestran un error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(DAVID.email);
  await page.getByLabel("Contraseña").fill("incorrecta-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Correo o contraseña incorrectos")).toBeVisible();
});

test("el registro público está deshabilitado", async ({ request, baseURL }) => {
  const response = await request.post("/api/auth/sign-up/email", {
    headers: { origin: baseURL! },
    data: { email: "intruso@example.com", password: "12345678", name: "Intruso" },
  });
  expect(response.ok()).toBe(false);
});

test("login, navegación y cierre de sesión", async ({ page }) => {
  await login(page, DAVID);
  await page.getByRole("link", { name: "Economía" }).click();
  await expect(page.getByRole("heading", { name: "Economía" })).toBeVisible();

  await page.getByRole("button", { name: /David León/ }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login/);
});

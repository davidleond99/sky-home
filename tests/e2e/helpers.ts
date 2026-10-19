import { expect, type Page } from "@playwright/test";

export const DAVID = { email: "davidleond99@gmail.com", name: "David" };
export const GABRIELA = { email: "gbrlsigler@gmail.com", name: "Gabriela" };

export function password() {
  const value = process.env.E2E_PASSWORD ?? process.env.SEED_PASSWORD;
  if (!value) throw new Error("Define E2E_PASSWORD (o SEED_PASSWORD) para los tests E2E");
  return value;
}

export async function login(page: Page, user: { email: string; name: string }) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(user.email);
  await page.getByLabel("Contraseña").fill(password());
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: `Hola, ${user.name}` })).toBeVisible();
}

/** "40.000 CUP" / "-500 CUP" / "39.500,50 CUP" → número */
export function parseCup(text: string) {
  return Number(
    text
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );
}

export async function readBalance(page: Page) {
  const text = await page.getByTestId("balance").innerText();
  return parseCup(text);
}

export async function expectBalance(page: Page, expected: number) {
  await expect.poll(() => readBalance(page), { timeout: 30_000 }).toBe(expected);
}

/**
 * Siembra idempotente: usuarios (David y Gabriela) y catálogo de ejemplo.
 * Uso: `pnpm db:seed` (lee .env.local; requiere SEED_PASSWORD).
 */
import { eq, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { categories, products, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { SEED_CATALOG, SEED_USERS } from "./seed-data";

async function seedUsers() {
  const password = process.env.SEED_PASSWORD;
  if (!password) throw new Error("SEED_PASSWORD no está definida");

  const ctx = await auth.$context;
  const ids: string[] = [];

  for (const { name, email } of SEED_USERS) {
    const existing = await ctx.internalAdapter.findUserByEmail(email);
    if (existing) {
      console.log(`  = ${email} ya existe`);
      ids.push(existing.user.id);
      continue;
    }
    // El registro público está deshabilitado: se crea igual que lo haría el plugin admin.
    const created = await ctx.internalAdapter.createUser(
      { name, email, emailVerified: true },
      { method: "admin" },
    );
    await ctx.internalAdapter.linkAccount({
      userId: created.id,
      providerId: "credential",
      accountId: created.id,
      password: await ctx.password.hash(password),
    });
    console.log(`  + ${email}`);
    ids.push(created.id);
  }
  return ids;
}

async function seedCatalog(ownerId: string) {
  let newCategories = 0;
  let newProducts = 0;

  for (const [index, { name, products: items }] of SEED_CATALOG.entries()) {
    const [inserted] = await db
      .insert(categories)
      .values({ name, sortOrder: index, createdBy: ownerId, updatedBy: ownerId })
      .onConflictDoNothing()
      .returning({ id: categories.id });
    if (inserted) newCategories++;

    const categoryId =
      inserted?.id ??
      (await db.query.categories.findFirst({
        where: eq(sql`lower(${categories.name})`, name.toLowerCase()),
        columns: { id: true },
      }))!.id;

    const rows = await db
      .insert(products)
      .values(
        items.map(([productName, unit]) => ({
          categoryId,
          name: productName,
          defaultUnit: unit,
          createdBy: ownerId,
          updatedBy: ownerId,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: products.id });
    newProducts += rows.length;
  }

  console.log(`  + ${newCategories} categorías, ${newProducts} productos nuevos`);
}

async function main() {
  console.log("Usuarios:");
  const [davidId] = await seedUsers();
  console.log("Catálogo:");
  await seedCatalog(davidId);

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(user);
  console.log(`Listo. Usuarios en BD: ${count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

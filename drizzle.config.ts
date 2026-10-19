import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", quiet: true });

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_UNPOOLED (o DATABASE_URL) no está definida");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  // El proyecto Neon tiene un esquema `neon_auth` que no gestionamos.
  schemaFilter: ["public"],
  dbCredentials: { url },
  strict: true,
  verbose: true,
});

import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está definida");

// Pool TCP reutilizado entre invocaciones (Vercel Fluid compute).
// attachDatabasePool cierra las conexiones ociosas antes de suspender la función.
export const pool = new Pool({ connectionString });
attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema, casing: "snake_case" });

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

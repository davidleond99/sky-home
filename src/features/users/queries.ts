import "server-only";
import { asc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { user } from "@/db/schema";
import { requireUser } from "@/lib/session";

export type HouseholdUser = { id: string; name: string };

/** Miembros del hogar (para filtros y gráficas por persona). */
export async function listHouseholdUsers(): Promise<HouseholdUser[]> {
  await requireUser();
  return listHouseholdUsersCached();
}

async function listHouseholdUsersCached(): Promise<HouseholdUser[]> {
  "use cache";
  cacheTag("users");
  cacheLife("hours");
  return db.select({ id: user.id, name: user.name }).from(user).orderBy(asc(user.name));
}

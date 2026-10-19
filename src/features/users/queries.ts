import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { requireUser } from "@/lib/session";

export type HouseholdUser = { id: string; name: string };

/** Miembros del hogar (para filtros y gráficas por persona). */
export async function listHouseholdUsers(): Promise<HouseholdUser[]> {
  await requireUser();
  return db.select({ id: user.id, name: user.name }).from(user).orderBy(asc(user.name));
}

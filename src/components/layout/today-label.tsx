import { connection } from "next/server";
import { formatLongDate } from "@/lib/dates";

/** Fecha de hoy en Cuba; se calcula en cada petición (va dentro de <Suspense>). */
export async function TodayLabel() {
  await connection();
  return <span className="text-muted-foreground text-[13px]">{formatLongDate()}</span>;
}

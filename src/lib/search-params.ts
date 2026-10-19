/** Aplana los searchParams de Next a Record<string, string> (descarta arrays). */
export function flattenSearchParams(raw: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(raw).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])),
  ) as Record<string, string>;
}

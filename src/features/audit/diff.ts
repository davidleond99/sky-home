export type FieldChange = { field: string; before: unknown; after: unknown };

/** Campos técnicos que no aportan al leer la traza. */
const IGNORED = new Set(["id", "createdAt", "createdBy", "updatedAt", "updatedBy"]);

/** Lista los campos que cambiaron entre dos snapshots (orden estable). */
export function diffSnapshots(before: unknown, after: unknown): FieldChange[] {
  const a = asRecord(before);
  const b = asRecord(after);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !IGNORED.has(k));
  return keys
    .filter((k) => JSON.stringify(a[k] ?? null) !== JSON.stringify(b[k] ?? null))
    .map((field) => ({ field, before: a[field] ?? null, after: b[field] ?? null }));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

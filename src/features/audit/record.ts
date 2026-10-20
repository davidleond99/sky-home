import type { Db, Tx } from "@/db";
import { auditAction, auditLog } from "@/db/schema";
import type { AUDIT_ENTITIES } from "./schemas";

export type AuditAction = (typeof auditAction.enumValues)[number];
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

export type AuditEntry = {
  userId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  /** Frase legible en español, p. ej. "Vendió 100 USD a 400 CUP". */
  summary: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type Executor = Pick<Db | Tx, "insert">;

/**
 * Registra una acción en la traza. Para mutaciones, llámalo con la misma
 * transacción (`tx`) para que la acción y su traza sean atómicas.
 */
export async function recordAudit(executor: Executor, entry: AuditEntry) {
  await executor.insert(auditLog).values({
    userId: entry.userId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    summary: entry.summary,
    before: toJson(entry.before),
    after: toJson(entry.after),
    ipAddress: entry.ipAddress ?? null,
    userAgent: entry.userAgent ?? null,
  });
}

/** Normaliza (Date → ISO, undefined → se omite) para guardar en jsonb. */
function toJson(value: unknown) {
  return value === undefined ? null : (JSON.parse(JSON.stringify(value)) as unknown);
}

import { relations } from "drizzle-orm";
import { bigint, index, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const auditAction = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "restore",
  "archive",
  "login",
  "logout",
]);

/** Traza inmutable de cada acción de cada usuario. Solo se inserta, nunca se modifica. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: text().references(() => user.id, { onDelete: "set null" }),
    action: auditAction().notNull(),
    /** Tipo de entidad: exchange | expense | product | category | session */
    entity: text().notNull(),
    entityId: text(),
    /** Descripción legible, p. ej. "Vendió 100 USD a 400 CUP". */
    summary: text().notNull(),
    before: jsonb(),
    after: jsonb(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_log_created_at_idx").on(t.createdAt.desc()),
    index("audit_log_user_idx").on(t.userId),
    index("audit_log_entity_idx").on(t.entity, t.entityId),
  ],
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, { fields: [auditLog.userId], references: [user.id] }),
}));

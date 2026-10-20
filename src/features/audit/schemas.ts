import { z } from "zod";
import { auditAction } from "@/db/schema/audit";

export const AUDIT_ENTITIES = [
  "exchange",
  "expense",
  "product",
  "category",
  "shopping_list",
  "shopping_list_item",
  "session",
] as const;

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" || v === "all" ? undefined : v), schema.optional());

export const auditFiltersSchema = z.object({
  user: optional(z.string()),
  entity: optional(z.enum(AUDIT_ENTITIES)),
  action: optional(z.enum(auditAction.enumValues)),
  page: z.coerce.number().int().min(1).catch(1),
});

export type AuditFilters = z.infer<typeof auditFiltersSchema>;

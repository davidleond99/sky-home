import "server-only";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, user } from "@/db/schema";
import { pageCount, pageOffset } from "@/lib/pagination";
import { requireUser } from "@/lib/session";
import type { AuditFilters } from "./schemas";

export const AUDIT_PAGE_SIZE = 25;

export async function listAuditLog(filters: AuditFilters) {
  await requireUser();

  const where: SQL[] = [];
  if (filters.user) where.push(eq(auditLog.userId, filters.user));
  if (filters.entity) where.push(eq(auditLog.entity, filters.entity));
  if (filters.action) where.push(eq(auditLog.action, filters.action));

  const rows = await db
    .select({
      id: auditLog.id,
      createdAt: auditLog.createdAt,
      action: auditLog.action,
      entity: auditLog.entity,
      summary: auditLog.summary,
      before: auditLog.before,
      after: auditLog.after,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      userName: user.name,
      totalCount: sql<number>`count(*) over ()`.mapWith(Number),
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.userId, user.id))
    .where(and(...where))
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(AUDIT_PAGE_SIZE)
    .offset(pageOffset(filters.page, AUDIT_PAGE_SIZE));

  const total = rows[0]?.totalCount ?? 0;
  return { rows, pages: pageCount(total, AUDIT_PAGE_SIZE) };
}

export type AuditRow = Awaited<ReturnType<typeof listAuditLog>>["rows"][number];

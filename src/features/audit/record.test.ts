import { describe, expect, it, vi } from "vitest";
import { recordAudit } from "./record";

vi.mock("@/db/schema", () => ({ auditLog: { _: "audit_log" }, auditAction: { enumValues: [] } }));

function fakeExecutor() {
  const values = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn(() => ({ values }));
  return { executor: { insert } as never, insert, values };
}

describe("recordAudit", () => {
  it("inserta la entrada en audit_log con los snapshots serializados", async () => {
    const { executor, insert, values } = fakeExecutor();
    const when = new Date("2026-10-19T12:00:00Z");

    await recordAudit(executor, {
      userId: "u1",
      action: "update",
      entity: "expense",
      entityId: "e1",
      summary: "Editó un gasto",
      before: { total: 500, updatedAt: when },
      after: { total: 600, note: undefined },
    });

    expect(insert).toHaveBeenCalledOnce();
    expect(values).toHaveBeenCalledWith({
      userId: "u1",
      action: "update",
      entity: "expense",
      entityId: "e1",
      summary: "Editó un gasto",
      before: { total: 500, updatedAt: "2026-10-19T12:00:00.000Z" },
      after: { total: 600 },
      ipAddress: null,
      userAgent: null,
    });
  });

  it("guarda null cuando no hay snapshots", async () => {
    const { executor, values } = fakeExecutor();
    await recordAudit(executor, {
      userId: "u1",
      action: "login",
      entity: "session",
      summary: "Inició sesión",
    });
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ before: null, after: null, entityId: null }),
    );
  });

  it("propaga el error para que la transacción haga rollback", async () => {
    const values = vi.fn().mockRejectedValue(new Error("db down"));
    const executor = { insert: () => ({ values }) } as never;
    await expect(
      recordAudit(executor, { userId: "u1", action: "create", entity: "expense", summary: "x" }),
    ).rejects.toThrow("db down");
  });
});

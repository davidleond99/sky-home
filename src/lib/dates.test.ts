import { describe, expect, it } from "vitest";
import { formatDay, formatMonth, todayIso } from "./dates";

describe("dates", () => {
  it("todayIso usa la hora de Cuba (UTC-4/-5)", () => {
    // 02:00 UTC del 20 de octubre aún es 19 de octubre en La Habana.
    expect(todayIso(new Date("2026-10-20T02:00:00Z"))).toBe("2026-10-19");
    expect(todayIso(new Date("2026-10-20T12:00:00Z"))).toBe("2026-10-20");
  });

  it("formatDay no desplaza el día por zona horaria", () => {
    expect(formatDay("2026-01-01")).toMatch(/^01 ene/);
  });

  it("formatMonth", () => {
    expect(formatMonth("2026-10")).toMatch(/oct/);
  });
});

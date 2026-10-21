import { describe, expect, it } from "vitest";
import { formatDay, formatLongDate, formatMonth, todayIso } from "./dates";

describe("dates", () => {
  it("todayIso usa la hora de Cuba (UTC-4/-5)", () => {
    // 02:00 UTC del 20 de octubre aún es 19 de octubre en La Habana.
    expect(todayIso(new Date("2026-10-20T02:00:00Z"))).toBe("2026-10-19");
    expect(todayIso(new Date("2026-10-20T12:00:00Z"))).toBe("2026-10-20");
  });

  it("formatDay no desplaza el día por zona horaria", () => {
    expect(formatDay("2026-01-01")).toMatch(/^01 ene/);
  });

  it("formatLongDate escribe el día de la semana en mayúscula y en hora de Cuba", () => {
    expect(formatLongDate(new Date("2026-10-21T15:00:00Z"))).toBe(
      "Miércoles, 21 de octubre de 2026",
    );
    // 02:00 UTC del 22 aún es 21 en La Habana.
    expect(formatLongDate(new Date("2026-10-22T02:00:00Z"))).toBe(
      "Miércoles, 21 de octubre de 2026",
    );
  });

  it("formatMonth", () => {
    expect(formatMonth("2026-10")).toMatch(/oct/);
  });
});

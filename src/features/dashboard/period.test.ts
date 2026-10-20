import { describe, expect, it } from "vitest";
import { daysBetween, lastMonths, periodSchema, periodStart, previousWindow } from "./period";

describe("period", () => {
  it("periodStart", () => {
    expect(periodStart("month", "2026-10-19")).toBe("2026-10-01");
    expect(periodStart("3m", "2026-10-19")).toBe("2026-08-01");
    expect(periodStart("3m", "2026-02-10")).toBe("2025-12-01");
    expect(periodStart("year", "2026-10-19")).toBe("2026-01-01");
    expect(periodStart("all", "2026-10-19")).toBeNull();
  });

  it("lastMonths cruza años", () => {
    expect(lastMonths(3, "2026-02-10")).toEqual(["2025-12", "2026-01", "2026-02"]);
  });

  it("periodo inválido cae en el mes", () => {
    expect(periodSchema.parse("xyz")).toBe("month");
  });

  it("daysBetween incluye ambos extremos", () => {
    expect(daysBetween("2026-10-01", "2026-10-01")).toBe(1);
    expect(daysBetween("2026-10-01", "2026-10-20")).toBe(20);
    expect(daysBetween("2025-12-30", "2026-01-02")).toBe(4);
  });

  it("previousWindow: misma longitud justo antes", () => {
    expect(previousWindow("2026-10-01", "2026-10-20")).toEqual({
      days: 20,
      prevFrom: "2026-09-11",
      prevTo: "2026-09-30",
    });
    expect(previousWindow("2026-01-01", "2026-01-01")).toEqual({
      days: 1,
      prevFrom: "2025-12-31",
      prevTo: "2025-12-31",
    });
    expect(previousWindow("2024-03-01", "2024-03-02").prevFrom).toBe("2024-02-28");
  });
});

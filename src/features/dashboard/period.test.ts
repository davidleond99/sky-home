import { describe, expect, it } from "vitest";
import { lastMonths, periodSchema, periodStart } from "./period";

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
});

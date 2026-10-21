import { describe, expect, it } from "vitest";
import { comparableUnit, LB_PER_KG } from "./units";

describe("comparableUnit", () => {
  it("pasa los kg a lb", () => {
    expect(comparableUnit("kg", 2)).toEqual({ unit: "lb", quantity: 2 * LB_PER_KG });
  });

  it("deja igual el resto de unidades", () => {
    expect(comparableUnit("lb", 3)).toEqual({ unit: "lb", quantity: 3 });
    expect(comparableUnit("litro", 1.5)).toEqual({ unit: "litro", quantity: 1.5 });
  });
});

import { describe, expect, it } from "vitest";
import { categorySlots, pivotMonthly } from "./pivot";

describe("categorySlots", () => {
  it("top 5 con color fijo y el resto en Otras", () => {
    const { slots, keyOf } = categorySlots(["A", "B", "C", "D", "E", "F", "G"]);
    expect(slots.map((s) => s.key)).toEqual(["c0", "c1", "c2", "c3", "c4", "other"]);
    expect(slots[0].color).toBe("var(--chart-1)");
    expect(slots.at(-1)).toMatchObject({ name: "Otras", color: "var(--chart-6)" });
    expect(keyOf("B")).toBe("c1");
    expect(keyOf("G")).toBe("other");
  });

  it("sin Otras si hay 5 o menos", () => {
    expect(categorySlots(["A", "B"]).slots).toHaveLength(2);
  });
});

describe("pivotMonthly", () => {
  it("rellena meses vacíos con 0 y agrupa Otras", () => {
    const { keyOf, slots } = categorySlots(["A", "B", "C", "D", "E", "F", "G"]);
    const data = pivotMonthly(
      ["2026-09", "2026-10"],
      [
        { month: "2026-10", category: "A", total: 100 },
        { month: "2026-10", category: "F", total: 0.1 },
        { month: "2026-10", category: "G", total: 0.2 },
      ],
      keyOf,
      slots.map((s) => s.key),
    );
    expect(data[0]).toMatchObject({ month: "2026-09", c0: 0, other: 0 });
    expect(data[1]).toMatchObject({ month: "2026-10", c0: 100, other: 0.3 });
  });
});

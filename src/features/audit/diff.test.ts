import { describe, expect, it } from "vitest";
import { diffSnapshots } from "./diff";

describe("diffSnapshots", () => {
  it("devuelve solo los campos modificados, ignorando los técnicos", () => {
    expect(
      diffSnapshots(
        { id: "1", total: 500, note: null, updatedAt: "a" },
        { id: "1", total: 600, note: null, updatedAt: "b" },
      ),
    ).toEqual([{ field: "total", before: 500, after: 600 }]);
  });

  it("trata una creación como cambios desde null", () => {
    expect(diffSnapshots(null, { total: 10 })).toEqual([
      { field: "total", before: null, after: 10 },
    ]);
  });

  it("considera undefined y null equivalentes", () => {
    expect(diffSnapshots({ note: undefined }, { note: null })).toEqual([]);
  });
});

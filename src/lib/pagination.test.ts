import { describe, expect, it } from "vitest";
import { pageCount, pageOffset } from "./pagination";

describe("pageCount", () => {
  it("devuelve al menos una página", () => {
    expect(pageCount(0, 25)).toBe(1);
  });

  it("redondea hacia arriba", () => {
    expect(pageCount(25, 25)).toBe(1);
    expect(pageCount(26, 25)).toBe(2);
    expect(pageCount(51, 25)).toBe(3);
  });
});

describe("pageOffset", () => {
  it("la primera página empieza en 0", () => {
    expect(pageOffset(1, 25)).toBe(0);
    expect(pageOffset(3, 25)).toBe(50);
  });
});

import { describe, expect, it } from "vitest";
import {
  formatAmounts,
  formatCup,
  formatUsd,
  fromCents,
  hasMaxDecimals,
  multiplyMoney,
  sumMoney,
  toCents,
} from "./money";

describe("money", () => {
  it("toCents redondea bien los casos problemáticos de coma flotante", () => {
    expect(toCents(1.005)).toBe(101);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(fromCents(4000000)).toBe(40000);
  });

  it("multiplyMoney: USD × tasa", () => {
    expect(multiplyMoney(100, 400)).toBe(40000);
    expect(multiplyMoney(55.55, 412.5)).toBe(22914.38);
  });

  it("multiplyMoney: cantidad con decimales × precio", () => {
    expect(multiplyMoney(2, 250)).toBe(500);
    expect(multiplyMoney(2.5, 250.25)).toBe(625.63);
    expect(multiplyMoney(0.333, 3)).toBe(1);
  });

  it("sumMoney es exacta", () => {
    expect(sumMoney([0.1, 0.2, 0.3])).toBe(0.6);
    expect(sumMoney([40000, -500, 41000])).toBe(80500);
  });

  it("hasMaxDecimals", () => {
    expect(hasMaxDecimals(10.25, 2)).toBe(true);
    expect(hasMaxDecimals(10.255, 2)).toBe(false);
    expect(hasMaxDecimals(2.125, 3)).toBe(true);
  });

  it("formatea en español con el código de moneda", () => {
    expect(formatCup(40000)).toBe("40.000 CUP");
    expect(formatCup(39500.5)).toBe("39.500,50 CUP");
    expect(formatUsd(100)).toBe("100 USD");
    expect(formatCup(-500)).toBe("-500 CUP");
  });

  it("formatAmounts junta monedas y omite las que están a cero", () => {
    expect(formatAmounts({ CUP: 2500, USD: 12 })).toBe("2.500 CUP + 12 USD");
    expect(formatAmounts({ CUP: 2500, USD: 0 })).toBe("2.500 CUP");
    expect(formatAmounts({ CUP: 0, USD: 7.5 })).toBe("7,50 USD");
    expect(formatAmounts({})).toBe("0 CUP");
  });
});

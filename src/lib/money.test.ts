import { describe, expect, it } from "vitest";
import { formatAmount, formatMoney, formatQuantity, parseDecimal } from "./money";

describe("parseDecimal", () => {
  it("přijme čárku i tečku", () => {
    expect(parseDecimal("1,5")).toBe(1.5);
    expect(parseDecimal("1.5")).toBe(1.5);
    expect(parseDecimal("10")).toBe(10);
    expect(parseDecimal("1 200,50")).toBe(1200.5);
    expect(parseDecimal("1.200,50")).toBe(1200.5);
  });

  it("odmítne nečíselný text", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
    expect(parseDecimal("1,200,50")).toBeNull();
  });
});

describe("formátování", () => {
  it("formátuje částky česky", () => {
    expect(formatAmount(1234.5)).toBe("1\u00a0234,50");
    expect(formatMoney(1234.5)).toBe("1\u00a0234,50\u00a0Kč");
    expect(formatMoney(0)).toBe("0,00\u00a0Kč");
    expect(formatQuantity(1.5)).toBe("1,5");
    expect(formatQuantity(2)).toBe("2");
  });
});

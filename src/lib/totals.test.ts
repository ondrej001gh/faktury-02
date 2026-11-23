import { describe, expect, it } from "vitest";
import type { InvoiceItem } from "../types";
import { computeTotals, lineBase } from "./totals";

function item(partial: Partial<InvoiceItem> & Pick<InvoiceItem, "quantity" | "unitPrice" | "vatRate">): InvoiceItem {
  return {
    id: "1",
    description: "Práce",
    unit: "hod.",
    ...partial,
  };
}

describe("součty faktury", () => {
  it("spočítá DPH ze základu sazby", () => {
    const totals = computeTotals([item({ quantity: 2, unitPrice: 100, vatRate: 21 })], true);
    expect(totals.base).toBe(200);
    expect(totals.vat).toBe(42);
    expect(totals.total).toBe(242);
    expect(totals.rows).toEqual([{ rate: 21, base: 200, vat: 42, total: 242 }]);
  });

  it("u neplátce DPH ignoruje sazbu", () => {
    const totals = computeTotals([item({ quantity: 1, unitPrice: 100, vatRate: 21 })], false);
    expect(totals.vat).toBe(0);
    expect(totals.total).toBe(100);
    expect(totals.rows[0]?.rate).toBe(0);
  });

  it("zaokrouhlí daň ze součtu, ne po položkách", () => {
    const items = [1, 2, 3].map((id) => item({ id: String(id), quantity: 1, unitPrice: 0.01, vatRate: 21 }));
    const totals = computeTotals(items, true);
    expect(lineBase(1, 0.01)).toBe(0.01);
    expect(totals.base).toBe(0.03);
    expect(totals.vat).toBe(0.01);
    expect(totals.total).toBe(0.04);
  });

  it("rozdělí rekapitulaci podle sazeb", () => {
    const totals = computeTotals(
      [
        item({ quantity: 1, unitPrice: 100, vatRate: 21 }),
        item({ id: "2", quantity: 1, unitPrice: 50, vatRate: 12 }),
      ],
      true,
    );
    expect(totals.rows.map((row) => row.rate)).toEqual([21, 12]);
    expect(totals.base).toBe(150);
    expect(totals.vat).toBe(27);
    expect(totals.total).toBe(177);
  });
});

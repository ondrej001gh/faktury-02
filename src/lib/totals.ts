import type { InvoiceItem, VatRate } from "../types";

export interface VatRecapRow {
  rate: VatRate;
  base: number;
  vat: number;
  total: number;
}

export interface InvoiceTotals {
  rows: VatRecapRow[];
  base: number;
  vat: number;
  total: number;
}

export function lineBaseCents(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100);
}

export function lineBase(quantity: number, unitPrice: number): number {
  return lineBaseCents(quantity, unitPrice) / 100;
}

function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * DPH se počítá ze součtu základů v jednotlivých sazbách a zaokrouhlí na haléře.
 * Tak se má daň na dokladu určit, ne součtem daně za každou položku zvlášť.
 */
export function computeTotals(items: InvoiceItem[], vatPayer: boolean): InvoiceTotals {
  const buckets = new Map<VatRate, number>([
    [21, 0],
    [12, 0],
    [0, 0],
  ]);
  for (const item of items) {
    const rate: VatRate = vatPayer ? item.vatRate : 0;
    buckets.set(rate, (buckets.get(rate) ?? 0) + lineBaseCents(item.quantity, item.unitPrice));
  }
  const rows: VatRecapRow[] = [];
  for (const rate of [21, 12, 0] as const) {
    const baseCents = buckets.get(rate) ?? 0;
    if (baseCents === 0) continue;
    const vatCents = vatPayer ? Math.round((baseCents * rate) / 100) : 0;
    rows.push({
      rate,
      base: fromCents(baseCents),
      vat: fromCents(vatCents),
      total: fromCents(baseCents + vatCents),
    });
  }
  const baseCents = rows.reduce((sum, row) => sum + Math.round(row.base * 100), 0);
  const vatCents = rows.reduce((sum, row) => sum + Math.round(row.vat * 100), 0);
  return {
    rows,
    base: fromCents(baseCents),
    vat: fromCents(vatCents),
    total: fromCents(baseCents + vatCents),
  };
}

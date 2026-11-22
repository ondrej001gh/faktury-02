import { describe, expect, it } from "vitest";
import { emptySupplier } from "../model";
import type { Invoice } from "../types";
import { defaultData, parseBackup, serializeBackup } from "./backup";

describe("záloha", () => {
  it("uloží a znovu načte data", () => {
    const data = defaultData(new Date(2026, 10, 22));
    data.supplier = { ...emptySupplier(), name: "Truhlářství Novák", vatPayer: true, ico: "27082440" };
    data.invoices = [
      {
        id: "inv-1",
        number: "2026001",
        clientId: null,
        customer: { ...emptySupplier(), name: "Studio Lomen", logoDataUrl: undefined } as Invoice["customer"],
        supplier: {
          name: "Truhlářství Novák",
          street: "",
          city: "",
          zip: "",
          country: "Česká republika",
          ico: "",
          dic: "",
          email: "",
          phone: "",
          vatPayer: true,
          accountNumber: "",
          iban: "",
          bic: "",
        },
        issueDate: "2026-11-22",
        dueDate: "2026-12-06",
        taxableSupplyDate: "2026-11-22",
        variableSymbol: "2026001",
        constantSymbol: "",
        specificSymbol: "",
        paymentMethod: "prevod",
        items: [{ id: "i1", description: "Police", quantity: 1, unit: "ks", unitPrice: 1000, vatRate: 21 }],
        note: "",
        status: "unpaid",
        paidDate: "",
        createdAt: "2026-11-22T00:00:00.000Z",
        updatedAt: "2026-11-22T00:00:00.000Z",
      },
    ];
    const parsed = parseBackup(JSON.parse(serializeBackup(data)) as unknown);
    expect(parsed.supplier.name).toBe("Truhlářství Novák");
    expect(parsed.invoices[0]?.number).toBe("2026001");
    expect(parsed.invoices[0]?.items[0]?.vatRate).toBe(21);
    expect(parsed.settings.numberPattern).toBe("{RRRR}{NNN}");
  });

  it("odmítne cizí soubor", () => {
    expect(() => parseBackup({})).toThrow(/záloha/i);
    expect(() => parseBackup({ app: "faktury", version: 2, clients: [], invoices: [] })).toThrow(/verzi/i);
  });
});

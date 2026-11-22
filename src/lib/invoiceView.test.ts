import { describe, expect, it } from "vitest";
import { emptyParty, snapshotSupplier, emptySupplier } from "../model";
import type { Invoice } from "../types";
import { buildInvoiceView } from "./invoiceView";

function sample(vatPayer: boolean): Invoice {
  const supplier = snapshotSupplier({
    ...emptySupplier(),
    name: "Truhlářství Novák",
    street: "Dlouhá 12",
    city: "Brno",
    zip: "602 00",
    ico: "27082440",
    dic: vatPayer ? "CZ27082440" : "",
    vatPayer,
    accountNumber: "19-2000145399/0800",
    iban: "CZ6508000000192000145399",
    email: "dilo@example.cz",
    phone: "+420 777 000 111",
  });
  return {
    id: "1",
    number: "2026001",
    clientId: "c1",
    customer: { ...emptyParty(), name: "Studio Lomen", street: "Krátká 3", city: "Praha", zip: "110 00", ico: "12345679" },
    supplier,
    issueDate: "2026-11-22",
    dueDate: "2026-12-06",
    taxableSupplyDate: vatPayer ? "2026-11-22" : "",
    variableSymbol: "2026001",
    constantSymbol: "0308",
    specificSymbol: "",
    paymentMethod: "prevod",
    items: [{ id: "i", description: "Police na míru", quantity: 2, unit: "ks", unitPrice: 100, vatRate: 21 }],
    note: "Děkujeme.",
    status: "unpaid",
    paidDate: "",
    createdAt: "",
    updatedAt: "",
  };
}

describe("náhled faktury", () => {
  it("u plátce připraví daňový doklad a QR platbu", () => {
    const view = buildInvoiceView(sample(true));
    expect(view.title).toBe("Faktura – daňový doklad");
    expect(view.totals.total).toBe(242);
    expect(view.facts.some((fact) => fact.label === "DUZP")).toBe(true);
    expect(view.spd).toContain("SPD*1.0*ACC:CZ6508000000192000145399*");
    expect(view.spd).toContain("AM:242.00*");
    expect(view.spd).toContain("X-VS:2026001*");
    expect(view.nonVatNote).toBeNull();
  });

  it("u neplátce neuvede DPH ani QR s daní navíc", () => {
    const view = buildInvoiceView(sample(false));
    expect(view.title).toBe("Faktura");
    expect(view.totals.total).toBe(200);
    expect(view.totals.vat).toBe(0);
    expect(view.nonVatNote).toMatch(/není plátcem/);
    expect(view.spd).toContain("AM:200.00*");
    expect(view.facts.some((fact) => fact.label === "DUZP")).toBe(false);
  });
});

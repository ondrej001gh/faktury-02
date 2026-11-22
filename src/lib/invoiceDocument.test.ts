import { describe, expect, it } from "vitest";
import { emptyParty, emptySupplier, snapshotSupplier } from "../model";
import type { Invoice } from "../types";
import { buildInvoiceDocument } from "./invoiceDocument";

function invoice(vatPayer: boolean): Invoice {
  return {
    id: "1",
    number: "2026001",
    clientId: null,
    customer: { ...emptyParty(), name: "Studio Lomen" },
    supplier: snapshotSupplier({
      ...emptySupplier(),
      name: "Truhlářství Novák",
      vatPayer,
      dic: vatPayer ? "CZ27082440" : "",
      iban: "CZ6508000000192000145399",
      accountNumber: "19-2000145399/0800",
    }),
    issueDate: "2026-11-22",
    dueDate: "2026-12-06",
    taxableSupplyDate: vatPayer ? "2026-11-22" : "",
    variableSymbol: "2026001",
    constantSymbol: "",
    specificSymbol: "",
    paymentMethod: "prevod",
    items: [{ id: "i", description: "Police na míru", quantity: 2, unit: "ks", unitPrice: 100, vatRate: 21 }],
    note: "Děkujeme za spolupráci.",
    status: "unpaid",
    paidDate: "",
    createdAt: "",
    updatedAt: "",
  };
}

describe("PDF doklad", () => {
  it("obsahuje náležitosti daňového dokladu a QR", () => {
    const doc = buildInvoiceDocument(invoice(true), { qrDataUrl: "data:image/png;base64,aaa" });
    const json = JSON.stringify(doc.content);
    expect(json).toContain("Faktura – daňový doklad");
    expect(json).toContain("2026001");
    expect(json).toContain("Studio Lomen");
    expect(json).toContain("Truhlářství Novák");
    expect(json).toContain("DUZP");
    expect(json).toContain("242,00");
    expect(json).toContain("data:image/png;base64,aaa");
    expect(json).toContain("Děkujeme za spolupráci.");
  });

  it("u neplátce neuvede daňový doklad ani obrázek QR, když kód není", () => {
    const cash = invoice(false);
    cash.paymentMethod = "hotovost";
    const doc = buildInvoiceDocument(cash);
    const json = JSON.stringify(doc.content);
    expect(json).toContain("Faktura");
    expect(json).not.toContain("daňový doklad");
    expect(json).toContain("není plátcem DPH");
    expect(json).not.toContain("data:image");
  });
});

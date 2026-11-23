import { paymentLabel } from "../model";
import type { Invoice, Party, SupplierSnapshot } from "../types";
import { formatCzechDate } from "./dates";
import { formatIban, formatCzechAccount } from "./iban";
import { formatAmount, formatMoney, formatPercent, formatQuantity } from "./money";
import { buildSpd } from "./spd";
import { computeTotals, lineBase, type InvoiceTotals } from "./totals";

export interface InvoiceViewItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  base: string;
  baseValue: number;
}

export interface LabeledValue {
  label: string;
  value: string;
}

export interface InvoiceView {
  title: string;
  number: string;
  supplierLines: string[];
  supplierMeta: LabeledValue[];
  customerLines: string[];
  customerMeta: LabeledValue[];
  facts: LabeledValue[];
  items: InvoiceViewItem[];
  totals: InvoiceTotals;
  priceNote: string;
  nonVatNote: string | null;
  paymentLabel: string;
  account: string;
  iban: string;
  bic: string;
  variableSymbol: string;
  constantSymbol: string;
  specificSymbol: string;
  note: string;
  vatPayer: boolean;
  grandTotalLabel: string;
  spd: string | null;
}

function addressLines(party: { name: string; street: string; zip: string; city: string; country: string }): string[] {
  const cityLine = [party.zip.trim(), party.city.trim()].filter(Boolean).join(" ");
  return [party.name.trim(), party.street.trim(), cityLine, party.country.trim()].filter((line) => line.length > 0);
}

function idLines(party: Party | SupplierSnapshot): LabeledValue[] {
  const lines: LabeledValue[] = [];
  if (party.ico.trim()) lines.push({ label: "IČO", value: party.ico.trim() });
  if (party.dic.trim()) lines.push({ label: "DIČ", value: party.dic.trim() });
  return lines;
}

export function invoiceDocumentTitle(vatPayer: boolean): string {
  return vatPayer ? "Faktura – daňový doklad" : "Faktura";
}

export function buildInvoiceView(invoice: Invoice): InvoiceView {
  const vatPayer = invoice.supplier.vatPayer;
  const totals = computeTotals(invoice.items, vatPayer);
  const facts: LabeledValue[] = [
    { label: "Datum vystavení", value: formatCzechDate(invoice.issueDate) },
    { label: "Datum splatnosti", value: formatCzechDate(invoice.dueDate) },
  ];
  if (vatPayer && invoice.taxableSupplyDate) {
    facts.push({ label: "DUZP", value: formatCzechDate(invoice.taxableSupplyDate) });
  }
  if (invoice.variableSymbol.trim()) facts.push({ label: "Variabilní symbol", value: invoice.variableSymbol.trim() });
  if (invoice.constantSymbol.trim()) facts.push({ label: "Konstantní symbol", value: invoice.constantSymbol.trim() });
  if (invoice.specificSymbol.trim()) facts.push({ label: "Specifický symbol", value: invoice.specificSymbol.trim() });
  facts.push({ label: "Způsob úhrady", value: paymentLabel(invoice.paymentMethod) });

  const supplierMeta = idLines(invoice.supplier);
  if (invoice.supplier.email.trim()) supplierMeta.push({ label: "E-mail", value: invoice.supplier.email.trim() });
  if (invoice.supplier.phone.trim()) supplierMeta.push({ label: "Telefon", value: invoice.supplier.phone.trim() });

  const spd =
    invoice.paymentMethod === "prevod"
      ? buildSpd({
          iban: invoice.supplier.iban,
          bic: invoice.supplier.bic,
          amount: totals.total,
          dueDate: invoice.dueDate,
          message: `Faktura ${invoice.number}`,
          variableSymbol: invoice.variableSymbol,
          constantSymbol: invoice.constantSymbol,
          specificSymbol: invoice.specificSymbol,
          recipientName: invoice.supplier.name,
        })
      : null;

  return {
    title: invoiceDocumentTitle(vatPayer),
    number: invoice.number,
    supplierLines: addressLines(invoice.supplier),
    supplierMeta,
    customerLines: addressLines(invoice.customer),
    customerMeta: idLines(invoice.customer),
    facts,
    items: invoice.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: formatQuantity(item.quantity),
      unit: item.unit,
      unitPrice: formatAmount(item.unitPrice),
      vatRate: formatPercent(item.vatRate),
      base: formatAmount(lineBase(item.quantity, item.unitPrice)),
      baseValue: lineBase(item.quantity, item.unitPrice),
    })),
    totals,
    priceNote: vatPayer ? "Jednotkové ceny jsou uvedeny bez DPH." : "Ceny jsou konečné.",
    nonVatNote: vatPayer ? null : "Dodavatel není plátcem DPH.",
    paymentLabel: paymentLabel(invoice.paymentMethod),
    account: invoice.supplier.accountNumber.trim() ? formatCzechAccount(invoice.supplier.accountNumber) : "",
    iban: invoice.supplier.iban ? formatIban(invoice.supplier.iban) : "",
    bic: invoice.supplier.bic.trim(),
    variableSymbol: invoice.variableSymbol.trim(),
    constantSymbol: invoice.constantSymbol.trim(),
    specificSymbol: invoice.specificSymbol.trim(),
    note: invoice.note.trim(),
    vatPayer,
    grandTotalLabel: "Celkem k úhradě",
    spd,
  };
}

export function formatMoneyLabeled(view: InvoiceView): string {
  return formatMoney(view.totals.total);
}

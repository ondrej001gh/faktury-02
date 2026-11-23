import type { Invoice } from "../types";
import { buildInvoiceView, type InvoiceView, type LabeledValue } from "./invoiceView";
import { formatAmount, formatMoney, formatPercent } from "./money";

const PINE = "#1b4332";
const INK = "#1d1a16";
const MUTED = "#5e584e";
const LINE = "#d9d0c2";
const SOFT = "#f6f1e8";

type Cell = Record<string, unknown>;

function text(value: string, extra: Record<string, unknown> = {}): Cell {
  return { text: value, ...extra };
}

function partyStack(title: string, lines: string[], meta: LabeledValue[]): Cell {
  return {
    stack: [
      text(title.toUpperCase(), { fontSize: 8, bold: true, color: PINE, margin: [0, 0, 0, 4] }),
      ...lines.map((line, index) => text(line, { bold: index === 0, fontSize: index === 0 ? 11 : 9, margin: [0, 0, 0, 1] })),
      ...meta.map((item) => text(`${item.label}: ${item.value}`, { fontSize: 8.5, color: MUTED, margin: [0, 1, 0, 0] })),
    ],
  };
}

function itemsTable(view: InvoiceView): Cell {
  if (view.vatPayer) {
    const body: Cell[][] = [
      [
        text("Popis", { color: "#ffffff", bold: true, fontSize: 8 }),
        text("Mn.", { color: "#ffffff", bold: true, fontSize: 8, alignment: "right" }),
        text("MJ", { color: "#ffffff", bold: true, fontSize: 8 }),
        text("Cena/MJ", { color: "#ffffff", bold: true, fontSize: 8, alignment: "right" }),
        text("DPH", { color: "#ffffff", bold: true, fontSize: 8, alignment: "right" }),
        text("Základ", { color: "#ffffff", bold: true, fontSize: 8, alignment: "right" }),
      ],
      ...view.items.map((item) => [
        text(item.description, { fontSize: 9 }),
        text(item.quantity, { fontSize: 9, alignment: "right" }),
        text(item.unit, { fontSize: 9 }),
        text(item.unitPrice, { fontSize: 9, alignment: "right" }),
        text(item.vatRate, { fontSize: 9, alignment: "right" }),
        text(item.base, { fontSize: 9, alignment: "right" }),
      ]),
    ];
    return {
      table: { headerRows: 1, widths: ["*", 36, 32, 58, 40, 62], body },
      layout: tableLayout(true),
      margin: [0, 4, 0, 0],
    };
  }
  const body: Cell[][] = [
    [
      text("Popis", { color: "#ffffff", bold: true, fontSize: 8 }),
      text("Mn.", { color: "#ffffff", bold: true, fontSize: 8, alignment: "right" }),
      text("MJ", { color: "#ffffff", bold: true, fontSize: 8 }),
      text("Cena/MJ", { color: "#ffffff", bold: true, fontSize: 8, alignment: "right" }),
      text("Celkem", { color: "#ffffff", bold: true, fontSize: 8, alignment: "right" }),
    ],
    ...view.items.map((item) => [
      text(item.description, { fontSize: 9 }),
      text(item.quantity, { fontSize: 9, alignment: "right" }),
      text(item.unit, { fontSize: 9 }),
      text(item.unitPrice, { fontSize: 9, alignment: "right" }),
      text(item.base, { fontSize: 9, alignment: "right" }),
    ]),
  ];
  return {
    table: { headerRows: 1, widths: ["*", 40, 36, 70, 70], body },
    layout: tableLayout(true),
    margin: [0, 4, 0, 0],
  };
}

function tableLayout(header: boolean) {
  return {
    hLineWidth(index: number, node: { table: { body: unknown[] } }) {
      if (index === 0 || index === 1 || index === node.table.body.length) return 0.6;
      return 0.25;
    },
    vLineWidth() {
      return 0;
    },
    hLineColor() {
      return LINE;
    },
    paddingLeft() {
      return 4;
    },
    paddingRight() {
      return 4;
    },
    paddingTop() {
      return 5;
    },
    paddingBottom() {
      return 5;
    },
    fillColor(index: number) {
      if (header && index === 0) return PINE;
      return index > 0 && index % 2 === 0 ? "#f7f4ee" : null;
    },
  };
}

function recap(view: InvoiceView): Cell {
  const body: Cell[][] = [];
  if (view.vatPayer) {
    body.push([
      text("Sazba", { bold: true, fontSize: 8, color: MUTED }),
      text("Základ", { bold: true, fontSize: 8, color: MUTED, alignment: "right" }),
      text("DPH", { bold: true, fontSize: 8, color: MUTED, alignment: "right" }),
      text("Celkem", { bold: true, fontSize: 8, color: MUTED, alignment: "right" }),
    ]);
    for (const row of view.totals.rows) {
      body.push([
        text(formatPercent(row.rate), { fontSize: 9 }),
        text(formatAmount(row.base), { fontSize: 9, alignment: "right" }),
        text(formatAmount(row.vat), { fontSize: 9, alignment: "right" }),
        text(formatAmount(row.total), { fontSize: 9, alignment: "right" }),
      ]);
    }
    body.push([
      text("Základ daně", { colSpan: 3, fontSize: 9 }),
      {},
      {},
      text(formatMoney(view.totals.base), { fontSize: 9, alignment: "right" }),
    ]);
    body.push([
      text("DPH celkem", { colSpan: 3, fontSize: 9 }),
      {},
      {},
      text(formatMoney(view.totals.vat), { fontSize: 9, alignment: "right" }),
    ]);
  }
  body.push([
    text(view.grandTotalLabel, { colSpan: view.vatPayer ? 3 : 1, bold: true, fontSize: 11, margin: [0, 3, 0, 3] }),
    ...(view.vatPayer ? [{}, {}] : []),
    text(formatMoney(view.totals.total), {
      bold: true,
      fontSize: 12,
      alignment: "right",
      color: PINE,
      margin: [0, 3, 0, 3],
    }),
  ]);
  return {
    table: {
      widths: view.vatPayer ? ["*", 70, 70, 80] : ["*", 110],
      body,
    },
    layout: {
      hLineWidth(index: number, node: { table: { body: unknown[] } }) {
        if (index === 0 || index === node.table.body.length) return 0;
        return 0.4;
      },
      vLineWidth() {
        return 0;
      },
      hLineColor() {
        return LINE;
      },
      paddingTop() {
        return 3;
      },
      paddingBottom() {
        return 3;
      },
      paddingLeft() {
        return 2;
      },
      paddingRight() {
        return 2;
      },
    },
  };
}

function paymentBox(view: InvoiceView, qrDataUrl?: string): Cell {
  const lines: Cell[] = [
    text("K úhradě", { fontSize: 8, bold: true, color: PINE }),
    text(formatMoney(view.totals.total), { fontSize: 16, bold: true, margin: [0, 2, 0, 6] }),
    text(view.paymentLabel, { fontSize: 9 }),
  ];
  if (view.account) lines.push(text(`Účet: ${view.account}`, { fontSize: 9, margin: [0, 2, 0, 0] }));
  if (view.iban) lines.push(text(`IBAN: ${view.iban}`, { fontSize: 9 }));
  if (view.bic) lines.push(text(`BIC: ${view.bic}`, { fontSize: 9 }));
  if (view.variableSymbol) lines.push(text(`Variabilní symbol: ${view.variableSymbol}`, { fontSize: 9 }));
  if (view.constantSymbol) lines.push(text(`Konstantní symbol: ${view.constantSymbol}`, { fontSize: 9 }));
  if (view.specificSymbol) lines.push(text(`Specifický symbol: ${view.specificSymbol}`, { fontSize: 9 }));
  if (qrDataUrl) lines.push(text("QR platba", { fontSize: 8, color: MUTED, margin: [0, 4, 0, 0] }));

  const info = { stack: lines, margin: [4, 2, 0, 2] };
  const body = qrDataUrl
    ? [[{ image: qrDataUrl, width: 92, margin: [0, 2, 0, 0] }, info]]
    : [[info]];
  return {
    table: { widths: qrDataUrl ? [100, "*"] : ["*"], body },
    layout: {
      hLineWidth() {
        return 0.6;
      },
      vLineWidth() {
        return 0.6;
      },
      hLineColor() {
        return LINE;
      },
      vLineColor() {
        return LINE;
      },
      paddingTop() {
        return 6;
      },
      paddingBottom() {
        return 6;
      },
      paddingLeft() {
        return 6;
      },
      paddingRight() {
        return 6;
      },
      fillColor() {
        return SOFT;
      },
    },
  };
}

export interface InvoicePdfExtras {
  qrDataUrl?: string;
  logoDataUrl?: string;
}

export function buildInvoiceDocument(invoice: Invoice, extras: InvoicePdfExtras = {}) {
  const view = buildInvoiceView(invoice);
  const logo =
    extras.logoDataUrl && /^data:image\/(?:png|jpeg|jpg);/i.test(extras.logoDataUrl) ? extras.logoDataUrl : undefined;
  const content: unknown[] = [
    {
      canvas: [{ type: "rect", x: 0, y: 0, w: 523, h: 4, color: PINE }],
      margin: [0, 0, 0, 12],
    },
    {
      columns: [
        {
          width: "*",
          stack: [
            ...(logo ? [{ image: logo, fit: [140, 48], margin: [0, 0, 0, 6] }] : []),
            text(view.title, { fontSize: 16, bold: true, color: INK }),
          ],
        },
        {
          width: 170,
          stack: [
            text("Číslo", { alignment: "right", fontSize: 8, color: MUTED }),
            text(view.number, { alignment: "right", fontSize: 16, bold: true, color: PINE }),
          ],
        },
      ],
    },
    {
      columns: [partyStack("Dodavatel", view.supplierLines, view.supplierMeta), { width: 18, text: "" }, partyStack("Odběratel", view.customerLines, view.customerMeta)],
      columnGap: 8,
      margin: [0, 16, 0, 0],
    },
    {
      margin: [0, 12, 0, 8],
      table: {
        widths: view.facts.map(() => "*"),
        body: [
          view.facts.map((fact) => ({
            stack: [
              text(fact.label, { fontSize: 7.5, color: MUTED }),
              text(fact.value || "—", { fontSize: 9, bold: true, margin: [0, 2, 0, 0] }),
            ],
            fillColor: SOFT,
            margin: [2, 2, 2, 2],
          })),
        ],
      },
      layout: "noBorders",
    },
    itemsTable(view),
    text(view.priceNote, { fontSize: 8, color: MUTED, margin: [0, 4, 0, 0] }),
  ];

  const closing: unknown[] = [];
  if (view.nonVatNote) closing.push(text(view.nonVatNote, { bold: true, margin: [0, 8, 0, 4] }));
  closing.push({ margin: [0, 8, 0, 0], columns: [{ width: "*", text: "" }, { width: view.vatPayer ? 340 : 250, ...recap(view) }] });
  closing.push({ margin: [0, 12, 0, 0], ...paymentBox(view, view.spd ? extras.qrDataUrl : undefined) });
  if (view.note) {
    closing.push(text("Poznámka", { fontSize: 8, bold: true, color: PINE, margin: [0, 12, 0, 2] }));
    closing.push(text(view.note, { fontSize: 9 }));
  }
  content.push({ unbreakable: true, stack: closing });

  return {
    pageSize: "A4" as const,
    pageMargins: [36, 32, 36, 40] as [number, number, number, number],
    defaultStyle: { font: "Roboto", fontSize: 9, color: INK },
    info: {
      title: `${view.title} ${view.number}`,
      author: invoice.supplier.name,
    },
    content,
    footer() {
      return {
        margin: [36, 0, 36, 12],
        columns: [
          text(invoice.supplier.name || "Faktury", { fontSize: 8, color: "#8a8175" }),
          text("Vystaveno v aplikaci Faktury", { fontSize: 8, color: "#8a8175", alignment: "right" }),
        ],
      };
    },
  };
}

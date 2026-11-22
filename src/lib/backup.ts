import { emptySupplier, partyFromUnknown } from "../model";
import type {
  AppData,
  Client,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  PaymentMethod,
  Settings,
  Supplier,
  SupplierSnapshot,
  VatRate,
} from "../types";
import { todayISO } from "./dates";

const PAYMENT_METHODS: PaymentMethod[] = ["prevod", "hotovost", "karta", "dobirka"];

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asVatRate(value: unknown): VatRate {
  if (value === 0 || value === 12 || value === 21) return value;
  return 21;
}

function asPayment(value: unknown): PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod) ? (value as PaymentMethod) : "prevod";
}

function asStatus(value: unknown): InvoiceStatus {
  return value === "paid" ? "paid" : "unpaid";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeSupplier(value: unknown): Supplier {
  const record = asRecord(value);
  const base = emptySupplier();
  if (!record) return base;
  const party = partyFromUnknown(record as Partial<Supplier>);
  const logo = asString(record.logoDataUrl);
  return {
    ...base,
    ...party,
    vatPayer: asBoolean(record.vatPayer),
    accountNumber: asString(record.accountNumber),
    iban: asString(record.iban).replace(/\s/g, "").toUpperCase(),
    bic: asString(record.bic).replace(/\s/g, "").toUpperCase(),
    logoDataUrl: logo.startsWith("data:image/") ? logo : "",
  };
}

function normalizeSnapshot(value: unknown, fallback: Supplier): SupplierSnapshot {
  const supplier = normalizeSupplier(value ?? fallback);
  return {
    name: supplier.name,
    street: supplier.street,
    city: supplier.city,
    zip: supplier.zip,
    country: supplier.country,
    ico: supplier.ico,
    dic: supplier.dic,
    email: supplier.email,
    phone: supplier.phone,
    vatPayer: supplier.vatPayer,
    accountNumber: supplier.accountNumber,
    iban: supplier.iban,
    bic: supplier.bic,
  };
}

function normalizeItem(value: unknown, index: number): InvoiceItem | null {
  const record = asRecord(value);
  if (!record) return null;
  const quantity = asNumber(record.quantity, Number.NaN);
  const unitPrice = asNumber(record.unitPrice, Number.NaN);
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return null;
  return {
    id: asString(record.id, `polozka-${index + 1}`),
    description: asString(record.description),
    quantity,
    unit: asString(record.unit, "ks"),
    unitPrice,
    vatRate: asVatRate(record.vatRate),
  };
}

function normalizeInvoice(value: unknown, supplier: Supplier): Invoice | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = asString(record.id);
  const number = asString(record.number);
  if (!id || !number) return null;
  const items = Array.isArray(record.items)
    ? record.items.map((item, index) => normalizeItem(item, index)).filter((item): item is InvoiceItem => item !== null)
    : [];
  const issueDate = /^\d{4}-\d{2}-\d{2}$/.test(asString(record.issueDate)) ? asString(record.issueDate) : todayISO();
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(asString(record.dueDate)) ? asString(record.dueDate) : issueDate;
  const taxable = asString(record.taxableSupplyDate);
  return {
    id,
    number,
    clientId: typeof record.clientId === "string" ? record.clientId : null,
    customer: partyFromUnknown(asRecord(record.customer) as Partial<Invoice["customer"]> | undefined),
    supplier: normalizeSnapshot(record.supplier, supplier),
    issueDate,
    dueDate,
    taxableSupplyDate: /^\d{4}-\d{2}-\d{2}$/.test(taxable) ? taxable : "",
    variableSymbol: asString(record.variableSymbol),
    constantSymbol: asString(record.constantSymbol),
    specificSymbol: asString(record.specificSymbol),
    paymentMethod: asPayment(record.paymentMethod),
    items,
    note: asString(record.note),
    status: asStatus(record.status),
    paidDate: /^\d{4}-\d{2}-\d{2}$/.test(asString(record.paidDate)) ? asString(record.paidDate) : "",
    createdAt: asString(record.createdAt, new Date().toISOString()),
    updatedAt: asString(record.updatedAt, new Date().toISOString()),
  };
}

function normalizeClient(value: unknown): Client | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = asString(record.id);
  if (!id) return null;
  return {
    ...partyFromUnknown(record as Partial<Client>),
    id,
    note: asString(record.note),
  };
}

export function defaultSettings(now = new Date()): Settings {
  return {
    numberPattern: "{RRRR}{NNN}",
    nextSequence: 1,
    sequenceYear: now.getFullYear(),
    resetSequenceEachYear: true,
    defaultDueDays: 14,
    defaultPaymentMethod: "prevod",
    defaultVatRate: 21,
    defaultNote: "",
  };
}

export function defaultData(now = new Date()): AppData {
  return {
    version: 1,
    supplier: emptySupplier(),
    clients: [],
    invoices: [],
    settings: defaultSettings(now),
  };
}

export function normalizeAppData(value: unknown): AppData {
  const record = asRecord(value);
  const fallback = defaultData();
  if (!record) return fallback;
  const supplier = normalizeSupplier(record.supplier);
  const settingsRecord = asRecord(record.settings);
  const settings = settingsRecord
    ? {
        numberPattern: asString(settingsRecord.numberPattern, fallback.settings.numberPattern) || "{RRRR}{NNN}",
        nextSequence: Math.max(1, Math.trunc(asNumber(settingsRecord.nextSequence, 1))),
        sequenceYear: Math.trunc(asNumber(settingsRecord.sequenceYear, fallback.settings.sequenceYear)),
        resetSequenceEachYear: asBoolean(settingsRecord.resetSequenceEachYear, true),
        defaultDueDays: Math.min(365, Math.max(0, Math.trunc(asNumber(settingsRecord.defaultDueDays, 14)))),
        defaultPaymentMethod: asPayment(settingsRecord.defaultPaymentMethod),
        defaultVatRate: asVatRate(settingsRecord.defaultVatRate),
        defaultNote: asString(settingsRecord.defaultNote),
      }
    : fallback.settings;
  const clients = Array.isArray(record.clients)
    ? record.clients.map(normalizeClient).filter((client): client is Client => client !== null)
    : [];
  const invoices = Array.isArray(record.invoices)
    ? record.invoices
        .map((invoice) => normalizeInvoice(invoice, supplier))
        .filter((invoice): invoice is Invoice => invoice !== null)
    : [];
  return { version: 1, supplier, clients, invoices, settings };
}

export function serializeBackup(data: AppData): string {
  return JSON.stringify(
    {
      app: "faktury",
      version: 1,
      exportedAt: new Date().toISOString(),
      supplier: data.supplier,
      clients: data.clients,
      invoices: data.invoices,
      settings: data.settings,
    },
    null,
    2,
  );
}

export function parseBackup(value: unknown): AppData {
  const record = asRecord(value);
  if (!record) throw new Error("Soubor neobsahuje platný JSON objekt.");
  if (record.app !== "faktury") throw new Error("Soubor není záloha aplikace Faktury.");
  if (record.version !== 1) throw new Error("Tuto verzi zálohy aplikace neumí načíst.");
  if (!Array.isArray(record.invoices) || !Array.isArray(record.clients)) {
    throw new Error("V záloze chybí seznamy faktur nebo odběratelů.");
  }
  return normalizeAppData(record);
}

export const STORAGE_KEY = "faktury.data.v1";

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    return normalizeAppData(JSON.parse(raw) as unknown);
  } catch {
    return defaultData();
  }
}

export function saveData(data: AppData): { ok: true } | { ok: false; error: string } {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Prohlížeč odmítl data uložit, úložiště je plné. Stáhněte zálohu a případně zmenšete logo.",
    };
  }
}

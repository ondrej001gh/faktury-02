export type VatRate = 0 | 12 | 21;

export type PaymentMethod = "prevod" | "hotovost" | "karta" | "dobirka";

export type InvoiceStatus = "unpaid" | "paid";

export interface Party {
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  ico: string;
  dic: string;
  email: string;
  phone: string;
}

export interface Supplier extends Party {
  vatPayer: boolean;
  accountNumber: string;
  iban: string;
  bic: string;
  logoDataUrl: string;
}

export type SupplierSnapshot = Omit<Supplier, "logoDataUrl">;

export interface Client extends Party {
  id: string;
  note: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: VatRate;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string | null;
  customer: Party;
  supplier: SupplierSnapshot;
  issueDate: string;
  dueDate: string;
  taxableSupplyDate: string;
  variableSymbol: string;
  constantSymbol: string;
  specificSymbol: string;
  paymentMethod: PaymentMethod;
  items: InvoiceItem[];
  note: string;
  status: InvoiceStatus;
  paidDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  numberPattern: string;
  nextSequence: number;
  sequenceYear: number;
  resetSequenceEachYear: boolean;
  defaultDueDays: number;
  defaultPaymentMethod: PaymentMethod;
  defaultVatRate: VatRate;
  defaultNote: string;
}

export interface AppData {
  version: 1;
  supplier: Supplier;
  clients: Client[];
  invoices: Invoice[];
  settings: Settings;
}

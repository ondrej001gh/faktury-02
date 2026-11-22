import type { Party, PaymentMethod, Supplier, SupplierSnapshot, VatRate } from "./types";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "prevod", label: "Bankovní převod" },
  { id: "hotovost", label: "Hotovost" },
  { id: "karta", label: "Platební karta" },
  { id: "dobirka", label: "Dobírka" },
];

export const VAT_RATES: VatRate[] = [21, 12, 0];

export const UNITS = ["ks", "hod.", "m", "m²", "kg", "km", "soubor", "paušál"];

export function paymentLabel(method: PaymentMethod): string {
  return PAYMENT_METHODS.find((item) => item.id === method)?.label ?? "Bankovní převod";
}

export function emptyParty(): Party {
  return {
    name: "",
    street: "",
    city: "",
    zip: "",
    country: "Česká republika",
    ico: "",
    dic: "",
    email: "",
    phone: "",
  };
}

export function emptySupplier(): Supplier {
  return {
    ...emptyParty(),
    vatPayer: false,
    accountNumber: "",
    iban: "",
    bic: "",
    logoDataUrl: "",
  };
}

export function snapshotSupplier(supplier: Supplier): SupplierSnapshot {
  return {
    name: supplier.name.trim(),
    street: supplier.street.trim(),
    city: supplier.city.trim(),
    zip: supplier.zip.trim(),
    country: supplier.country.trim(),
    ico: supplier.ico.trim(),
    dic: supplier.dic.trim(),
    email: supplier.email.trim(),
    phone: supplier.phone.trim(),
    vatPayer: supplier.vatPayer,
    accountNumber: supplier.accountNumber.trim(),
    iban: supplier.iban.replace(/\s/g, "").toUpperCase(),
    bic: supplier.bic.replace(/\s/g, "").toUpperCase(),
  };
}

export function partyFromUnknown(value: Partial<Party> | undefined): Party {
  const blank = emptyParty();
  if (!value) return blank;
  return {
    name: value.name ?? blank.name,
    street: value.street ?? blank.street,
    city: value.city ?? blank.city,
    zip: value.zip ?? blank.zip,
    country: value.country ?? blank.country,
    ico: value.ico ?? blank.ico,
    dic: value.dic ?? blank.dic,
    email: value.email ?? blank.email,
    phone: value.phone ?? blank.phone,
  };
}

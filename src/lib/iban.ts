export interface CzechAccount {
  prefix: string;
  number: string;
  bank: string;
}

/** Nápověda k častým kódům bank. Na fakturu se netiskne. */
const CZECH_BANKS: Record<string, string> = {
  "0100": "Komerční banka",
  "0300": "ČSOB",
  "0600": "MONETA Money Bank",
  "0710": "Česká národní banka",
  "0800": "Česká spořitelna",
  "2010": "Fio banka",
  "2060": "Citfin",
  "2070": "TRINITY BANK",
  "2100": "Hypoteční banka",
  "2250": "Banka CREDITAS",
  "2600": "Citibank",
  "2700": "UniCredit Bank",
  "3030": "Air Bank",
  "3050": "Hello bank!",
  "3500": "ING Bank",
  "4000": "Max banka",
  "4300": "Národní rozvojová banka",
  "5500": "Raiffeisenbank",
  "5800": "J&T Banka",
  "6000": "PPF banka",
  "6200": "Commerzbank",
  "6210": "mBank",
  "6300": "BNP Paribas",
  "6363": "Partners Banka",
  "6700": "VÚB",
  "7910": "Deutsche Bank",
  "8040": "Oberbank",
  "8090": "Česká exportní banka",
  "8150": "HSBC",
  "8250": "Bank of China",
};

export function mod97(digits: string): number {
  let remainder = 0;
  for (const char of digits) {
    remainder = (remainder * 10 + Number(char)) % 97;
  }
  return remainder;
}

function expandLetters(value: string): string {
  return value.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
}

export function parseCzechAccount(input: string): CzechAccount | null {
  const compact = input.replace(/[\s\u00a0]/g, "");
  const withPrefix = /^(\d{1,6})-(\d{1,10})\/(\d{4})$/.exec(compact);
  if (withPrefix) {
    return {
      prefix: withPrefix[1].padStart(6, "0"),
      number: withPrefix[2].padStart(10, "0"),
      bank: withPrefix[3],
    };
  }
  const plain = /^(\d{1,10})\/(\d{4})$/.exec(compact);
  if (!plain) return null;
  return {
    prefix: "000000",
    number: plain[1].padStart(10, "0"),
    bank: plain[2],
  };
}

/** IBAN z českého čísla účtu: kód banky + předčíslí (6) + číslo (10) a kontrolní číslice CZ. */
export function czechAccountToIban(account: string): string | null {
  const parsed = parseCzechAccount(account);
  if (!parsed) return null;
  const bban = `${parsed.bank}${parsed.prefix}${parsed.number}`;
  const check = 98 - mod97(expandLetters(`${bban}CZ00`));
  return `CZ${String(check).padStart(2, "0")}${bban}`;
}

export function compactIban(iban: string): string {
  return iban.replace(/[\s\u00a0]/g, "").toUpperCase();
}

export function isValidIban(iban: string): boolean {
  const compact = compactIban(iban);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(compact)) return false;
  if (compact.startsWith("CZ") && compact.length !== 24) return false;
  const rearranged = compact.slice(4) + compact.slice(0, 4);
  return mod97(expandLetters(rearranged)) === 1;
}

export function isValidBic(value: string): boolean {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value.replace(/\s/g, "").toUpperCase());
}

export function formatIban(iban: string): string {
  return compactIban(iban).replace(/(.{4})/g, "$1 ").trim();
}

export function formatCzechAccount(input: string): string {
  const parsed = parseCzechAccount(input);
  if (!parsed) return input.trim();
  const number = parsed.number.replace(/^0+/, "") || "0";
  const prefix = parsed.prefix.replace(/^0+/, "");
  if (!prefix) return `${number}/${parsed.bank}`;
  return `${prefix}-${number}/${parsed.bank}`;
}

export function ibanMatchesCzechAccount(account: string, iban: string): boolean {
  const computed = czechAccountToIban(account);
  const compact = compactIban(iban);
  if (!computed || !compact) return true;
  return computed === compact;
}

export function bankNameFromAccount(account: string): string | null {
  const parsed = parseCzechAccount(account);
  if (!parsed) return null;
  return CZECH_BANKS[parsed.bank] ?? null;
}

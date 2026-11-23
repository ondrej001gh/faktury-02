import { isValidBic, isValidIban, compactIban } from "./iban";

const FOLD: Record<string, string> = {
  á: "a",
  č: "c",
  ď: "d",
  é: "e",
  ě: "e",
  í: "i",
  ň: "n",
  ó: "o",
  ř: "r",
  š: "s",
  ť: "t",
  ú: "u",
  ů: "u",
  ý: "y",
  ž: "z",
  Á: "A",
  Č: "C",
  Ď: "D",
  É: "E",
  Ě: "E",
  Í: "I",
  Ň: "N",
  Ó: "O",
  Ř: "R",
  Š: "S",
  Ť: "T",
  Ú: "U",
  Ů: "U",
  Ý: "Y",
  Ž: "Z",
};

export interface SpdInput {
  iban: string;
  bic?: string;
  amount: number;
  dueDate?: string;
  message?: string;
  variableSymbol?: string;
  specificSymbol?: string;
  constantSymbol?: string;
  recipientName?: string;
}

/** Text do QR platby: velká písmena bez diakritiky, ať zůstane v alfanumerickém režimu. */
export function toSpdText(value: string, max: number): string {
  const folded = Array.from(value)
    .map((char) => FOLD[char] ?? char)
    .join("");
  const cleaned = folded
    .toUpperCase()
    .replace(/[^0-9A-Z +\-./:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, max).trim();
}

export function formatSpdAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const cents = Math.round(amount * 100);
  if (cents > 999_999_999) return null;
  const whole = Math.floor(cents / 100);
  const frac = String(cents % 100).padStart(2, "0");
  return `${whole}.${frac}`;
}

function symbol(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "").slice(-10);
}

/**
 * Řetězec QR platby podle standardu ČBA (SPD 1.0).
 * Každá hodnota končí hvězdičkou. Částka používá tečku a měna je CZK.
 */
export function buildSpd(input: SpdInput): string | null {
  const iban = compactIban(input.iban);
  if (!isValidIban(iban)) return null;
  const amount = formatSpdAmount(input.amount);
  if (!amount) return null;
  const bic = (input.bic ?? "").replace(/\s/g, "").toUpperCase();
  const account = isValidBic(bic) ? `${iban}+${bic}` : iban;
  const parts = [`ACC:${account}`, `AM:${amount}`, `CC:CZK`];
  const due = (input.dueDate ?? "").replace(/-/g, "");
  if (/^\d{8}$/.test(due)) parts.push(`DT:${due}`);
  const message = toSpdText(input.message ?? "", 60);
  if (message) parts.push(`MSG:${message}`);
  const variableSymbol = symbol(input.variableSymbol);
  if (variableSymbol) parts.push(`X-VS:${variableSymbol}`);
  const specificSymbol = symbol(input.specificSymbol);
  if (specificSymbol) parts.push(`X-SS:${specificSymbol}`);
  const constantSymbol = symbol(input.constantSymbol);
  if (constantSymbol) parts.push(`X-KS:${constantSymbol}`);
  const recipient = toSpdText(input.recipientName ?? "", 35);
  if (recipient) parts.push(`RN:${recipient}`);
  return `SPD*1.0*${parts.join("*")}*`;
}

import type { Settings } from "../types";
import { parseISODate } from "./dates";

export function patternHasSequence(pattern: string): boolean {
  return /\{N+\}/.test(pattern);
}

export function formatInvoiceNumber(pattern: string, isoDate: string, sequence: number): string {
  const parsed = parseISODate(isoDate);
  const year = parsed?.year ?? new Date().getFullYear();
  const month = parsed?.month ?? new Date().getMonth() + 1;
  const safeSequence = Math.max(0, Math.trunc(sequence));
  return pattern.replace(/\{(RRRR|RR|MM|N+)\}/g, (_full, token: string) => {
    if (token === "RRRR") return String(year);
    if (token === "RR") return String(year).slice(2);
    if (token === "MM") return String(month).padStart(2, "0");
    return String(safeSequence).padStart(token.length, "0");
  });
}

export function variableSymbolFromNumber(invoiceNumber: string): string {
  return invoiceNumber.replace(/\D/g, "").slice(-10);
}

function yearOf(isoDate: string): number {
  return parseISODate(isoDate)?.year ?? new Date().getFullYear();
}

export function effectiveSequence(settings: Settings, isoDate: string): { sequence: number; year: number } {
  const year = yearOf(isoDate);
  if (settings.resetSequenceEachYear && settings.sequenceYear !== year) {
    return { sequence: 1, year };
  }
  return { sequence: settings.nextSequence, year };
}

export function peekNextNumber(settings: Settings, isoDate: string): string {
  const { sequence } = effectiveSequence(settings, isoDate);
  return formatInvoiceNumber(settings.numberPattern, isoDate, sequence);
}

export function advanceSequence(settings: Settings, isoDate: string, usedNumber: string): Settings {
  const { sequence, year } = effectiveSequence(settings, isoDate);
  const expected = formatInvoiceNumber(settings.numberPattern, isoDate, sequence);
  if (usedNumber.trim() !== expected) return settings;
  return {
    ...settings,
    nextSequence: sequence + 1,
    sequenceYear: year,
  };
}

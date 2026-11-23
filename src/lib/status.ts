import type { Invoice } from "../types";
import { todayISO } from "./dates";

export function isOverdue(invoice: Invoice, today = todayISO()): boolean {
  return invoice.status === "unpaid" && invoice.dueDate < today;
}

export function statusLabel(invoice: Invoice, today = todayISO()): string {
  if (invoice.status === "paid") return "Uhrazeno";
  if (isOverdue(invoice, today)) return "Po splatnosti";
  return "Neuhrazeno";
}

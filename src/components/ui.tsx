import { useEffect, type ReactNode } from "react";
import type { Invoice } from "../types";
import { isOverdue, statusLabel } from "../lib/status";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title === "Přehled" ? "Faktury" : `${title} · Faktury`;
  }, [title]);
}

export function PageHeader({ title, lede, actions }: { title: string; lede?: string; actions?: ReactNode }) {
  usePageTitle(title);
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "bad" | "ok"; children: ReactNode }) {
  return <div className={`notice notice-${tone}`}>{children}</div>;
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function StatusBadge({ invoice }: { invoice: Invoice }) {
  const label = statusLabel(invoice);
  const tone = invoice.status === "paid" ? "paid" : isOverdue(invoice) ? "overdue" : "unpaid";
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

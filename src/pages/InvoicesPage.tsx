import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader, StatusBadge } from "../components/ui";
import { todayISO, formatCzechDate } from "../lib/dates";
import { formatAmount, formatMoney } from "../lib/money";
import { isOverdue } from "../lib/status";
import { computeTotals } from "../lib/totals";
import { useStore } from "../store";
import type { Invoice } from "../types";

const FILTERS = [
  { id: "vse", label: "Vše" },
  { id: "neuhrazene", label: "Neuhrazené" },
  { id: "uhrazene", label: "Uhrazené" },
  { id: "po-splatnosti", label: "Po splatnosti" },
  { id: "mesic", label: "Tento měsíc" },
] as const;

export function InvoicesPage() {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const filter = params.get("stav") ?? "vse";
  const [query, setQuery] = useState("");
  const today = todayISO();
  const monthKey = today.slice(0, 7);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("cs");
    return data.invoices
      .filter((invoice) => matchesFilter(invoice, filter, today, monthKey))
      .filter((invoice) => matchesQuery(invoice, needle))
      .sort(byDate);
  }, [data.invoices, filter, query, today, monthKey]);

  return (
    <div className="page">
      <PageHeader
        title="Faktury"
        lede="Seznam dokladů v tomto prohlížeči."
        actions={
          <Link className="btn btn-primary" to="/faktury/nova">
            Nová faktura
          </Link>
        }
      />
      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="Hledat číslo, odběratele, text…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Hledat faktury"
        />
        <div className="chips" role="toolbar" aria-label="Filtr">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? "chip chip-active" : "chip"}
              aria-pressed={filter === item.id}
              onClick={() => setParams(item.id === "vse" ? {} : { stav: item.id }, { replace: true })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {data.invoices.length === 0 ? (
        <div className="empty">
          <p className="empty-title">Žádná faktura.</p>
          <Link className="btn btn-primary" to="/faktury/nova">
            Vystavit první
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p className="empty-title">Nic neodpovídá filtru.</p>
        </div>
      ) : (
        <div className="stack">
          {visible.map((invoice) => {
            const total = computeTotals(invoice.items, invoice.supplier.vatPayer).total;
            return (
              <Link key={invoice.id} className="invoice-card" to={`/faktury/${invoice.id}`}>
                <div className="invoice-card-top">
                  <strong className="invoice-no">{invoice.number}</strong>
                  <span className={invoice.status === "paid" ? "amount-paid" : "amount-due"}>{formatMoney(total)}</span>
                </div>
                <div className="invoice-card-sub">
                  <span>{invoice.customer.name || "Bez odběratele"}</span>
                  <StatusBadge invoice={invoice} />
                </div>
                <p className="invoice-meta">
                  Vystaveno {formatCzechDate(invoice.issueDate)} · splatnost {formatCzechDate(invoice.dueDate)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function matchesFilter(invoice: Invoice, filter: string, today: string, monthKey: string): boolean {
  if (filter === "neuhrazene") return invoice.status === "unpaid";
  if (filter === "uhrazene") return invoice.status === "paid";
  if (filter === "po-splatnosti") return isOverdue(invoice, today);
  if (filter === "mesic") return invoice.issueDate.startsWith(monthKey);
  return true;
}

function matchesQuery(invoice: Invoice, needle: string): boolean {
  if (!needle) return true;
  const total = computeTotals(invoice.items, invoice.supplier.vatPayer).total;
  const hay = [
    invoice.number,
    invoice.customer.name,
    invoice.variableSymbol,
    invoice.note,
    formatAmount(total),
    ...invoice.items.map((item) => item.description),
  ]
    .join(" ")
    .toLocaleLowerCase("cs");
  return hay.includes(needle);
}

function byDate(a: Invoice, b: Invoice): number {
  if (a.issueDate !== b.issueDate) return b.issueDate.localeCompare(a.issueDate);
  return b.number.localeCompare(a.number, "cs");
}

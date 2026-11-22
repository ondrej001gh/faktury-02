import { Link } from "react-router-dom";
import { PageHeader, StatusBadge } from "../components/ui";
import { formatCzechDate } from "../lib/dates";
import { formatMoney } from "../lib/money";
import { isOverdue } from "../lib/status";
import { computeTotals } from "../lib/totals";
import { useStore } from "../store";
import type { Invoice } from "../types";

function totalOf(invoice: Invoice): number {
  return computeTotals(invoice.items, invoice.supplier.vatPayer).total;
}

function sumOf(invoices: Invoice[]): number {
  const cents = invoices.reduce((sum, invoice) => sum + Math.round(totalOf(invoice) * 100), 0);
  return cents / 100;
}

export function DashboardPage() {
  const { data } = useStore();
  const today = new Date();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const unpaid = data.invoices.filter((invoice) => invoice.status === "unpaid");
  const overdue = data.invoices.filter((invoice) => isOverdue(invoice));
  const month = data.invoices.filter((invoice) => invoice.issueDate.startsWith(monthKey));
  const recent = [...data.invoices].sort(byDate).slice(0, 5);
  const supplierReady = data.supplier.name.trim().length > 0;

  return (
    <div className="page">
      <PageHeader
        title="Přehled"
        lede="Co je vystavené a co ještě není zaplacené."
        actions={
          <Link className="btn btn-primary" to="/faktury/nova">
            Nová faktura
          </Link>
        }
      />
      {!supplierReady ? (
        <div className="notice notice-warn">
          Než vystavíte doklad, <Link to="/dodavatel">doplňte údaje dodavatele</Link>. Bez nich na faktuře chybí jméno, účet i IČO.
        </div>
      ) : null}
      <div className="stats">
        <Link className="stat stat-unpaid" to="/faktury?stav=neuhrazene">
          <span className="stat-label">K úhradě</span>
          <span className="stat-value">{formatMoney(sumOf(unpaid))}</span>
          <span className="stat-note">{countLabel(unpaid.length)}</span>
        </Link>
        <Link className="stat stat-overdue" to="/faktury?stav=po-splatnosti">
          <span className="stat-label">Po splatnosti</span>
          <span className="stat-value">{formatMoney(sumOf(overdue))}</span>
          <span className="stat-note">{countLabel(overdue.length)}</span>
        </Link>
        <Link className="stat stat-month" to="/faktury?stav=mesic">
          <span className="stat-label">Tento měsíc</span>
          <span className="stat-value">{formatMoney(sumOf(month))}</span>
          <span className="stat-note">{countLabel(month.length)}</span>
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="empty">
          <p className="empty-title">Zatím tu není žádná faktura.</p>
          <ol className="steps">
            <li>
              <Link to="/dodavatel">Vyplňte dodavatele</Link>
            </li>
            <li>
              <Link to="/odberatele/novy">Přidejte odběratele</Link>
            </li>
            <li>
              <Link to="/faktury/nova">Vystavte první fakturu</Link>
            </li>
          </ol>
        </div>
      ) : (
        <section className="stack">
          <h2 className="section-title">Poslední faktury</h2>
          {recent.map((invoice) => (
            <Link key={invoice.id} className="invoice-card" to={`/faktury/${invoice.id}`}>
              <div className="invoice-card-top">
                <strong className="invoice-no">{invoice.number}</strong>
                <span className={invoice.status === "paid" ? "amount-paid" : "amount-due"}>{formatMoney(totalOf(invoice))}</span>
              </div>
              <div className="invoice-card-sub">
                <span>{invoice.customer.name || "Bez odběratele"}</span>
                <StatusBadge invoice={invoice} />
              </div>
              <p className="invoice-meta">
                Vystaveno {formatCzechDate(invoice.issueDate)} · splatnost {formatCzechDate(invoice.dueDate)}
              </p>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

function countLabel(count: number): string {
  if (count === 1) return "1 faktura";
  if (count >= 2 && count <= 4) return `${count} faktury`;
  return `${count} faktur`;
}

function byDate(a: Invoice, b: Invoice): number {
  if (a.issueDate !== b.issueDate) return b.issueDate.localeCompare(a.issueDate);
  return b.number.localeCompare(a.number, "cs");
}

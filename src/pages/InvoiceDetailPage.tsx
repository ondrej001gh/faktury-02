import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { InvoiceSheet } from "../components/InvoiceSheet";
import { Notice, StatusBadge, usePageTitle } from "../components/ui";
import { addDays, formatCzechDate, todayISO } from "../lib/dates";
import { buildInvoiceView } from "../lib/invoiceView";
import { downloadInvoicePdf } from "../lib/pdf";
import { paymentQrDataUrl } from "../lib/qr";
import { createId } from "../lib/id";
import { peekNextNumber, variableSymbolFromNumber } from "../lib/numbering";
import { snapshotSupplier } from "../model";
import { useStore } from "../store";

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, deleteInvoice, setPaid, saveInvoice } = useStore();
  const invoice = data.invoices.find((item) => item.id === id);
  const [paidDate, setPaidDate] = useState(todayISO());
  const [qr, setQr] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const view = invoice ? buildInvoiceView(invoice) : null;
  usePageTitle(invoice ? `Faktura ${invoice.number}` : "Faktura");

  useEffect(() => {
    if (!view?.spd) {
      setQr(null);
      return;
    }
    let cancelled = false;
    paymentQrDataUrl(view.spd)
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [view?.spd]);

  if (!invoice || !view) {
    return (
      <div className="page">
        <p>Faktura nenalezena.</p>
        <Link to="/faktury">Zpět na seznam</Link>
      </div>
    );
  }

  async function download() {
    if (!invoice) return;
    setPdfBusy(true);
    setPdfError("");
    try {
      await downloadInvoicePdf(invoice, data.supplier.logoDataUrl);
    } catch (error) {
      console.error(error);
      setPdfError("PDF se nepodařilo vytvořit. Použijte Tisk a v nabídce zvolte uložení jako PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  function duplicate() {
    if (!invoice) return;
    const issueDate = todayISO();
    const number = peekNextNumber(data.settings, issueDate);
    const now = new Date().toISOString();
    const copy = {
      ...invoice,
      id: createId(),
      number,
      issueDate,
      dueDate: addDays(issueDate, data.settings.defaultDueDays),
      taxableSupplyDate: invoice.supplier.vatPayer ? issueDate : "",
      variableSymbol: variableSymbolFromNumber(number),
      status: "unpaid" as const,
      paidDate: "",
      supplier: data.supplier.name.trim() ? snapshotSupplier(data.supplier) : invoice.supplier,
      createdAt: now,
      updatedAt: now,
    };
    saveInvoice(copy, "create");
    navigate(`/faktury/${copy.id}`);
  }

  function remove() {
    if (!invoice) return;
    if (!window.confirm(`Smazat fakturu ${invoice.number}?`)) return;
    deleteInvoice(invoice.id);
    navigate("/faktury");
  }

  return (
    <div className="page">
      <div className="detail-toolbar no-print">
        <Link className="back-link" to="/faktury">
          ← Faktury
        </Link>
        <div className="detail-status">
          <StatusBadge invoice={invoice} />
          {invoice.status === "paid" && invoice.paidDate ? <span>dne {formatCzechDate(invoice.paidDate)}</span> : null}
        </div>
      </div>
      {pdfError ? <Notice tone="bad">{pdfError}</Notice> : null}
      {!view.spd && invoice.paymentMethod === "prevod" ? (
        <div className="no-print">
          <Notice tone="warn">QR platba se ukáže, až bude u dodavatele platný IBAN a částka větší než nula.</Notice>
        </div>
      ) : null}
      <div className="actions no-print">
        <button className="btn btn-primary" type="button" onClick={() => void download()} disabled={pdfBusy}>
          {pdfBusy ? "Připravuji PDF…" : "Stáhnout PDF"}
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => window.print()}>
          Tisk
        </button>
        <Link className="btn btn-secondary" to={`/faktury/${invoice.id}/upravit`}>
          Upravit
        </Link>
        <button className="btn btn-secondary" type="button" onClick={duplicate}>
          Duplikovat
        </button>
      </div>
      <div className="paid-box no-print">
        {invoice.status === "paid" ? (
          <button className="btn btn-ghost" type="button" onClick={() => setPaid(invoice.id, false, "")}>
            Označit jako neuhrazenou
          </button>
        ) : (
          <>
            <label className="field paid-date">
              <span className="field-label">Datum úhrady</span>
              <input type="date" value={paidDate} onChange={(event) => setPaidDate(event.target.value)} />
            </label>
            <button className="btn btn-secondary" type="button" onClick={() => setPaid(invoice.id, true, paidDate || todayISO())}>
              Označit jako uhrazenou
            </button>
          </>
        )}
        <button className="btn btn-danger" type="button" onClick={remove}>
          Smazat
        </button>
      </div>
      <InvoiceSheet view={view} logoDataUrl={data.supplier.logoDataUrl} qrDataUrl={qr} />
    </div>
  );
}

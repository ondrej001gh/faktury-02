import type { InvoiceView } from "../lib/invoiceView";
import { formatAmount, formatMoney, formatPercent } from "../lib/money";

export function InvoiceSheet({ view, logoDataUrl, qrDataUrl }: { view: InvoiceView; logoDataUrl?: string; qrDataUrl?: string | null }) {
  return (
    <article className="sheet">
      <div className="sheet-bar" />
      <header className="sheet-top">
        <div>
          {logoDataUrl ? <img className="sheet-logo" src={logoDataUrl} alt="" /> : null}
          <p className="sheet-kicker">{view.title}</p>
        </div>
        <div className="sheet-number-block">
          <p className="sheet-number-label">Číslo faktury</p>
          <p className="sheet-number">{view.number}</p>
        </div>
      </header>

      <div className="sheet-parties">
        <section>
          <h2>Dodavatel</h2>
          {view.supplierLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {view.supplierMeta.map((item) => (
            <p key={item.label} className="meta-line">
              {item.label}: {item.value}
            </p>
          ))}
        </section>
        <section>
          <h2>Odběratel</h2>
          {view.customerLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {view.customerMeta.map((item) => (
            <p key={item.label} className="meta-line">
              {item.label}: {item.value}
            </p>
          ))}
        </section>
      </div>

      <div className="sheet-facts">
        {view.facts.map((fact) => (
          <div key={fact.label}>
            <span>{fact.label}</span>
            <strong>{fact.value || "—"}</strong>
          </div>
        ))}
      </div>

      <div className="table-scroll">
        <table className="sheet-table">
          <thead>
            <tr>
              <th>Popis</th>
              <th className="num">Množství</th>
              <th>MJ</th>
              <th className="num">Cena/MJ</th>
              {view.vatPayer ? <th className="num">DPH</th> : null}
              <th className="num">{view.vatPayer ? "Základ" : "Celkem"}</th>
            </tr>
          </thead>
          <tbody>
            {view.items.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td className="num">{item.quantity}</td>
                <td>{item.unit}</td>
                <td className="num">{item.unitPrice}</td>
                {view.vatPayer ? <td className="num">{item.vatRate}</td> : null}
                <td className="num">{item.base}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sheet-items-mobile">
        {view.items.map((item) => (
          <div className="mobile-line" key={item.id}>
            <strong>{item.description}</strong>
            <p>
              {item.quantity} {item.unit} × {item.unitPrice} Kč
              {view.vatPayer ? ` · DPH ${item.vatRate}` : ""}
            </p>
            <p>Základ {item.base} Kč</p>
          </div>
        ))}
      </div>
      <p className="price-note">{view.priceNote}</p>

      <div className="sheet-bottom">
        <table className="recap">
          {view.vatPayer ? (
            <>
              <thead>
                <tr>
                  <th>Sazba</th>
                  <th className="num">Základ</th>
                  <th className="num">DPH</th>
                  <th className="num">Celkem</th>
                </tr>
              </thead>
              <tbody>
                {view.totals.rows.map((row) => (
                  <tr key={row.rate}>
                    <td>{formatPercent(row.rate)}</td>
                    <td className="num">{formatAmount(row.base)}</td>
                    <td className="num">{formatAmount(row.vat)}</td>
                    <td className="num">{formatAmount(row.total)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}>Základ daně</td>
                  <td className="num">{formatMoney(view.totals.base)}</td>
                </tr>
                <tr>
                  <td colSpan={3}>DPH celkem</td>
                  <td className="num">{formatMoney(view.totals.vat)}</td>
                </tr>
              </tbody>
            </>
          ) : null}
          <tbody>
            <tr className="grand">
              <td colSpan={view.vatPayer ? 3 : 1}>{view.grandTotalLabel}</td>
              <td className="num">{formatMoney(view.totals.total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="sheet-pay">
          {qrDataUrl ? <img src={qrDataUrl} alt="QR platba" /> : null}
          <div>
            <p className="sheet-pay-label">K úhradě</p>
            <p className="sheet-grand">{formatMoney(view.totals.total)}</p>
            <p>{view.paymentLabel}</p>
            {view.account ? <p>Účet: {view.account}</p> : null}
            {view.iban ? <p>IBAN: {view.iban}</p> : null}
            {view.bic ? <p>BIC: {view.bic}</p> : null}
            {view.variableSymbol ? <p>Variabilní symbol: {view.variableSymbol}</p> : null}
            {view.constantSymbol ? <p>Konstantní symbol: {view.constantSymbol}</p> : null}
            {view.specificSymbol ? <p>Specifický symbol: {view.specificSymbol}</p> : null}
            {qrDataUrl ? <p className="qr-caption">QR platba</p> : null}
          </div>
        </div>
      </div>

      {view.nonVatNote ? <p className="nonvat">{view.nonVatNote}</p> : null}
      {view.note ? (
        <div className="sheet-note">
          <h3>Poznámka</h3>
          <p>{view.note}</p>
        </div>
      ) : null}
    </article>
  );
}

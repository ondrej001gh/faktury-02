import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PartyFields } from "../components/PartyFields";
import { Notice } from "../components/ui";
import { addDays, isIsoDate, todayISO } from "../lib/dates";
import { createId } from "../lib/id";
import { isValidIban } from "../lib/iban";
import { formatAmount, parseDecimal } from "../lib/money";
import { peekNextNumber, variableSymbolFromNumber } from "../lib/numbering";
import { computeTotals, lineBase } from "../lib/totals";
import { PAYMENT_METHODS, UNITS, emptyParty, snapshotSupplier } from "../model";
import { useStore } from "../store";
import type { Invoice, InvoiceItem, Party, PaymentMethod, SupplierSnapshot, VatRate } from "../types";

const DRAFT_KEY = "faktury.draft.invoice";

interface ItemDraft {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: VatRate;
}

interface DraftState {
  number: string;
  clientId: string;
  customer: Party;
  issueDate: string;
  dueDate: string;
  taxableSupplyDate: string;
  variableSymbol: string;
  constantSymbol: string;
  specificSymbol: string;
  paymentMethod: PaymentMethod;
  items: ItemDraft[];
  note: string;
  numberTouched: boolean;
  dueTouched: boolean;
  vsTouched: boolean;
  duzpTouched: boolean;
}

export function InvoiceFormPage() {
  const { id } = useParams();
  return <InvoiceForm key={id ?? "nova"} />;
}

function blankItem(rate: VatRate): ItemDraft {
  return { key: createId(), description: "", quantity: "1", unit: "ks", unitPrice: "", vatRate: rate };
}

function createBlank(settings: { numberPattern: string; nextSequence: number; sequenceYear: number; resetSequenceEachYear: boolean; defaultDueDays: number; defaultPaymentMethod: PaymentMethod; defaultVatRate: VatRate; defaultNote: string }): DraftState {
  const issueDate = todayISO();
  const number = peekNextNumber(settings, issueDate);
  return {
    number,
    clientId: "",
    customer: emptyParty(),
    issueDate,
    dueDate: addDays(issueDate, settings.defaultDueDays),
    taxableSupplyDate: issueDate,
    variableSymbol: variableSymbolFromNumber(number),
    constantSymbol: "",
    specificSymbol: "",
    paymentMethod: settings.defaultPaymentMethod,
    items: [blankItem(settings.defaultVatRate)],
    note: settings.defaultNote,
    numberTouched: false,
    dueTouched: false,
    vsTouched: false,
    duzpTouched: false,
  };
}

function fromInvoice(invoice: Invoice): DraftState {
  return {
    number: invoice.number,
    clientId: invoice.clientId ?? "",
    customer: invoice.customer,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    taxableSupplyDate: invoice.taxableSupplyDate || invoice.issueDate,
    variableSymbol: invoice.variableSymbol,
    constantSymbol: invoice.constantSymbol,
    specificSymbol: invoice.specificSymbol,
    paymentMethod: invoice.paymentMethod,
    items: invoice.items.map((item) => ({
      key: item.id,
      description: item.description,
      quantity: String(item.quantity).replace(".", ","),
      unit: item.unit,
      unitPrice: String(item.unitPrice).replace(".", ","),
      vatRate: item.vatRate,
    })),
    note: invoice.note,
    numberTouched: true,
    dueTouched: true,
    vsTouched: true,
    duzpTouched: true,
  };
}

function draftHasContent(state: DraftState): boolean {
  return Boolean(
    state.numberTouched ||
      state.dueTouched ||
      state.vsTouched ||
      state.duzpTouched ||
      state.customer.name ||
      state.note ||
      state.constantSymbol ||
      state.items.some((item) => item.description || item.unitPrice),
  );
}

function readDraft(): DraftState | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number; state?: DraftState };
    if (parsed.version !== 1 || !parsed.state?.items) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

function InvoiceForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { data, saveInvoice } = useStore();
  const existing = isEdit ? data.invoices.find((invoice) => invoice.id === id) ?? null : null;
  const [form, setForm] = useState<DraftState>(() => {
    if (existing) return fromInvoice(existing);
    const draft = readDraft();
    if (draft && draftHasContent(draft)) return draft;
    return createBlank(data.settings);
  });
  const [restored, setRestored] = useState(() => {
    if (existing) return false;
    const draft = readDraft();
    return Boolean(draft && draftHasContent(draft));
  });
  const [supplierSnapshot, setSupplierSnapshot] = useState<SupplierSnapshot>(() =>
    existing ? existing.supplier : snapshotSupplier(data.supplier),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [invoiceId] = useState(() => existing?.id ?? createId());
  const skipDraft = useRef(false);
  const supplier = isEdit ? supplierSnapshot : snapshotSupplier(data.supplier);
  const vatPayer = supplier.vatPayer;

  useEffect(() => {
    if (isEdit || skipDraft.current) return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, state: form }));
  }, [form, isEdit]);

  const suggested = peekNextNumber(data.settings, form.issueDate);
  useEffect(() => {
    if (isEdit || form.numberTouched) return;
    setForm((current) => (current.number === suggested ? current : { ...current, number: suggested }));
  }, [suggested, isEdit, form.numberTouched]);

  const symbol = variableSymbolFromNumber(form.number);
  useEffect(() => {
    if (form.vsTouched) return;
    setForm((current) => (current.variableSymbol === symbol ? current : { ...current, variableSymbol: symbol }));
  }, [symbol, form.vsTouched]);

  useEffect(() => {
    if (isEdit || form.dueTouched) return;
    const nextDue = addDays(form.issueDate, data.settings.defaultDueDays);
    setForm((current) => (current.dueDate === nextDue ? current : { ...current, dueDate: nextDue }));
  }, [form.issueDate, form.dueTouched, isEdit, data.settings.defaultDueDays]);

  useEffect(() => {
    if (isEdit || !vatPayer || form.duzpTouched) return;
    setForm((current) =>
      current.taxableSupplyDate === current.issueDate ? current : { ...current, taxableSupplyDate: current.issueDate },
    );
  }, [form.issueDate, form.duzpTouched, isEdit, vatPayer]);

  if (isEdit && !existing) {
    return (
      <div className="page">
        <p>Faktura nenalezena.</p>
        <Link to="/faktury">Zpět na seznam</Link>
      </div>
    );
  }

  function patch(partial: Partial<DraftState>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function updateItem(key: string, partial: Partial<ItemDraft>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => (item.key === key ? { ...item, ...partial } : item)),
    }));
  }

  const liveItems: InvoiceItem[] = form.items.map((item) => {
    const quantity = parseDecimal(item.quantity);
    const unitPrice = parseDecimal(item.unitPrice);
    return {
      id: item.key,
      description: item.description,
      quantity: quantity !== null && quantity > 0 ? quantity : 0,
      unit: item.unit,
      unitPrice: unitPrice !== null && unitPrice >= 0 ? unitPrice : 0,
      vatRate: vatPayer ? item.vatRate : 0,
    };
  });
  const totals = computeTotals(liveItems, vatPayer);
  const warnings: string[] = [];
  if (isIsoDate(form.issueDate) && isIsoDate(form.dueDate) && form.dueDate < form.issueDate) {
    warnings.push("Datum splatnosti je dřív než datum vystavení.");
  }
  if (vatPayer && !supplier.dic.trim()) warnings.push("U plátce DPH má být na dokladu DIČ.");
  if (vatPayer && form.items.some((item) => item.vatRate === 0)) {
    warnings.push("U sazby 0 % uveďte v poznámce důvod, pokud jde o osvobozené plnění.");
  }
  const profileDiffers = isEdit && JSON.stringify(supplierSnapshot) !== JSON.stringify(snapshotSupplier(data.supplier));

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const problems: string[] = [];
    const parsed: InvoiceItem[] = [];
    form.items.forEach((item, index) => {
      const label = `Položka ${index + 1}`;
      const quantity = parseDecimal(item.quantity);
      const unitPrice = parseDecimal(item.unitPrice);
      const description = item.description.trim();
      if (!description) problems.push(`${label}: vyplňte popis.`);
      if (quantity === null || quantity <= 0) problems.push(`${label}: množství musí být větší než nula.`);
      if (unitPrice === null || unitPrice < 0) problems.push(`${label}: vyplňte cenu.`);
      if (description && quantity !== null && quantity > 0 && unitPrice !== null && unitPrice >= 0) {
        parsed.push({
          id: item.key,
          description,
          quantity: Math.round(quantity * 1000) / 1000,
          unit: item.unit.trim() || "ks",
          unitPrice: Math.round(unitPrice * 100) / 100,
          vatRate: vatPayer ? item.vatRate : 0,
        });
      }
    });
    if (!supplier.name) problems.push("Nejdřív vyplňte dodavatele. Rozpracovaná faktura tu zůstane.");
    if (!form.number.trim()) problems.push("Vyplňte číslo faktury.");
    if (data.invoices.some((invoice) => invoice.id !== (existing?.id ?? "") && invoice.number.trim() === form.number.trim())) {
      problems.push("Faktura s tímto číslem už existuje.");
    }
    if (!isIsoDate(form.issueDate)) problems.push("Vyplňte datum vystavení.");
    if (!isIsoDate(form.dueDate)) problems.push("Vyplňte datum splatnosti.");
    if (vatPayer && !isIsoDate(form.taxableSupplyDate)) problems.push("Vyplňte datum uskutečnění zdanitelného plnění (DUZP).");
    if (!form.customer.name.trim()) problems.push("Vyplňte název odběratele.");
    if (form.items.length === 0) problems.push("Přidejte alespoň jednu položku.");
    if (supplier.iban && !isValidIban(supplier.iban)) problems.push("IBAN dodavatele není platný. Opravte ho v profilu dodavatele.");
    if (problems.length || parsed.length !== form.items.length) {
      setErrors(problems);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: invoiceId,
      number: form.number.trim(),
      clientId: form.clientId || null,
      customer: { ...form.customer, name: form.customer.name.trim() },
      supplier,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      taxableSupplyDate: vatPayer ? form.taxableSupplyDate : "",
      variableSymbol: form.variableSymbol.trim(),
      constantSymbol: form.constantSymbol.trim(),
      specificSymbol: form.specificSymbol.trim(),
      paymentMethod: form.paymentMethod,
      items: parsed,
      note: form.note.trim(),
      status: existing?.status ?? "unpaid",
      paidDate: existing?.paidDate ?? "",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    skipDraft.current = true;
    saveInvoice(invoice, isEdit ? "update" : "create");
    sessionStorage.removeItem(DRAFT_KEY);
    navigate(`/faktury/${invoice.id}`);
  }

  return (
    <div className="page">
      <Link className="back-link" to={isEdit && existing ? `/faktury/${existing.id}` : "/faktury"}>
        ← {isEdit ? "Detail faktury" : "Faktury"}
      </Link>
      <header className="page-header">
        <div>
          <h1>{isEdit ? "Upravit fakturu" : "Nová faktura"}</h1>
          <p className="lede">{supplier.name ? `Dodavatel: ${supplier.name}` : "Dodavatel ještě není vyplněný."}</p>
        </div>
      </header>
      {restored ? (
        <Notice tone="info">
          Obnovil jsem rozpracovanou fakturu.{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              sessionStorage.removeItem(DRAFT_KEY);
              setForm(createBlank(data.settings));
              setRestored(false);
            }}
          >
            Zahodit
          </button>
        </Notice>
      ) : null}
      {!supplier.name ? (
        <Notice tone="warn">
          <Link to="/dodavatel">Vyplňte dodavatele</Link>, jinak fakturu nepůjde uložit. Rozepsané údaje zůstanou v tomto okně.
        </Notice>
      ) : null}
      <form onSubmit={onSubmit}>
        {errors.length > 0 ? (
          <div id="form-errors">
            <Notice tone="bad">
              <ul>
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </Notice>
          </div>
        ) : null}
        {warnings.map((warning) => (
          <Notice key={warning} tone="warn">
            {warning}
          </Notice>
        ))}
        <div className="form-layout">
          <div className="form-main">
            <section className="form-section">
              <h2>Doklad</h2>
              {profileDiffers ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setSupplierSnapshot(snapshotSupplier(data.supplier))}
                >
                  Načíst aktuální údaje dodavatele
                </button>
              ) : null}
              <div className="grid-2">
                <label className="field">
                  <span className="field-label">Číslo faktury</span>
                  <input
                    value={form.number}
                    onChange={(event) => patch({ number: event.target.value, numberTouched: true })}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Variabilní symbol</span>
                  <input
                    value={form.variableSymbol}
                    onChange={(event) => patch({ variableSymbol: event.target.value, vsTouched: true })}
                    inputMode="numeric"
                  />
                </label>
              </div>
              <div className="grid-2">
                <label className="field">
                  <span className="field-label">Datum vystavení</span>
                  <input type="date" value={form.issueDate} onChange={(event) => patch({ issueDate: event.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">Datum splatnosti</span>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => patch({ dueDate: event.target.value, dueTouched: true })}
                  />
                </label>
              </div>
              {vatPayer ? (
                <label className="field">
                  <span className="field-label">Datum uskutečnění zdanitelného plnění</span>
                  <input
                    type="date"
                    value={form.taxableSupplyDate}
                    onChange={(event) => patch({ taxableSupplyDate: event.target.value, duzpTouched: true })}
                  />
                </label>
              ) : null}
              <label className="field">
                <span className="field-label">Způsob úhrady</span>
                <select
                  value={form.paymentMethod}
                  onChange={(event) => patch({ paymentMethod: event.target.value as PaymentMethod })}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid-2">
                <label className="field">
                  <span className="field-label">Konstantní symbol</span>
                  <input
                    value={form.constantSymbol}
                    onChange={(event) => patch({ constantSymbol: event.target.value })}
                    placeholder="např. 0308"
                    inputMode="numeric"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Specifický symbol</span>
                  <input
                    value={form.specificSymbol}
                    onChange={(event) => patch({ specificSymbol: event.target.value })}
                    inputMode="numeric"
                  />
                </label>
              </div>
            </section>

            <section className="form-section">
              <h2>Odběratel</h2>
              <label className="field">
                <span className="field-label">Z adresáře</span>
                <select value={form.clientId} onChange={(event) => applyClient(event.target.value)}>
                  <option value="">Vyplnit ručně</option>
                  {data.clients
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name, "cs"))
                    .map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                </select>
              </label>
              <PartyFields
                party={form.customer}
                onChange={(customer) => patch({ customer })}
                showContact={false}
                showAres
              />
              {data.clients.length === 0 ? (
                <p className="field-hint">
                  Adresář je prázdný. Odběratele můžete <Link to="/odberatele/novy">uložit dopředu</Link>, rozepsaná faktura tu zůstane.
                </p>
              ) : null}
            </section>

            <section className="form-section">
              <h2>Položky</h2>
              <p className="field-hint">Množství a cenu pište s desetinnou čárkou nebo tečkou, třeba 1,5.</p>
              {form.items.map((item, index) => {
                const quantity = parseDecimal(item.quantity);
                const unitPrice = parseDecimal(item.unitPrice);
                const base =
                  quantity !== null && unitPrice !== null && quantity > 0 && unitPrice >= 0
                    ? formatAmount(lineBase(quantity, unitPrice))
                    : "—";
                return (
                  <article className="item-card" key={item.key}>
                    <div className="item-top">
                      <strong>Položka {index + 1}</strong>
                      <button className="btn btn-ghost btn-small" type="button" onClick={() => removeItem(item.key)}>
                        Odebrat
                      </button>
                    </div>
                    <label className="field">
                      <span className="field-label">Popis</span>
                      <input value={item.description} onChange={(event) => updateItem(item.key, { description: event.target.value })} />
                    </label>
                    <div className="item-grid">
                      <label className="field">
                        <span className="field-label">Množství</span>
                        <input
                          inputMode="decimal"
                          value={item.quantity}
                          onChange={(event) => updateItem(item.key, { quantity: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">MJ</span>
                        <input list="unit-list" value={item.unit} onChange={(event) => updateItem(item.key, { unit: event.target.value })} />
                      </label>
                      <label className="field">
                        <span className="field-label">Cena za MJ</span>
                        <input
                          inputMode="decimal"
                          value={item.unitPrice}
                          onChange={(event) => updateItem(item.key, { unitPrice: event.target.value })}
                        />
                      </label>
                      {vatPayer ? (
                        <label className="field">
                          <span className="field-label">DPH</span>
                          <select
                            value={item.vatRate}
                            onChange={(event) => updateItem(item.key, { vatRate: Number(event.target.value) as VatRate })}
                          >
                            <option value={21}>21 %</option>
                            <option value={12}>12 %</option>
                            <option value={0}>0 %</option>
                          </select>
                        </label>
                      ) : null}
                    </div>
                    <p className="item-line-total">Základ {base} Kč</p>
                  </article>
                );
              })}
              <datalist id="unit-list">
                {UNITS.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => patch({ items: [...form.items, blankItem(vatPayer ? data.settings.defaultVatRate : 0)] })}
              >
                Přidat položku
              </button>
            </section>

            <section className="form-section">
              <h2>Poznámka</h2>
              <label className="field">
                <span className="field-label">Text na faktuře</span>
                <textarea value={form.note} onChange={(event) => patch({ note: event.target.value })} />
              </label>
            </section>
          </div>

          <aside className="summary-card" aria-live="polite">
            <h2>Součet</h2>
            {vatPayer ? (
              <>
                <div className="summary-row">
                  <span>Základ daně</span>
                  <strong>{formatAmount(totals.base)} Kč</strong>
                </div>
                <div className="summary-row">
                  <span>DPH</span>
                  <strong>{formatAmount(totals.vat)} Kč</strong>
                </div>
              </>
            ) : (
              <p className="field-hint">Neplátce DPH, ceny jsou konečné.</p>
            )}
            <div className="summary-total">
              <span>Celkem k úhradě</span>
              <strong>{formatAmount(totals.total)} Kč</strong>
            </div>
          </aside>

          <div className="savebar">
            <button className="btn btn-primary" type="submit">
              {isEdit ? "Uložit změny" : "Uložit fakturu"}
            </button>
            <Link className="btn btn-secondary" to={isEdit && existing ? `/faktury/${existing.id}` : "/faktury"}>
              Zrušit
            </Link>
          </div>
        </div>
      </form>
    </div>
  );

  function applyClient(clientId: string) {
    const client = data.clients.find((item) => item.id === clientId);
    if (!client) {
      patch({ clientId: "" });
      return;
    }
    patch({
      clientId,
      customer: {
        name: client.name,
        street: client.street,
        city: client.city,
        zip: client.zip,
        country: client.country,
        ico: client.ico,
        dic: client.dic,
        email: client.email,
        phone: client.phone,
      },
    });
  }

  function removeItem(key: string) {
    setForm((current) => ({ ...current, items: current.items.filter((item) => item.key !== key) }));
  }
}


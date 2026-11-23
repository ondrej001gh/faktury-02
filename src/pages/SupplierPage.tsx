import { useState, type FormEvent } from "react";
import { PartyFields } from "../components/PartyFields";
import { Notice, PageHeader } from "../components/ui";
import {
  bankNameFromAccount,
  compactIban,
  czechAccountToIban,
  formatCzechAccount,
  formatIban,
  ibanMatchesCzechAccount,
  isValidBic,
  isValidIban,
  parseCzechAccount,
} from "../lib/iban";
import { readLogoFile } from "../lib/logo";
import { useStore } from "../store";
import type { Supplier } from "../types";

export function SupplierPage() {
  const { data, saveSupplier } = useStore();
  const [supplier, setSupplier] = useState<Supplier>(data.supplier);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState("");
  const bank = bankNameFromAccount(supplier.accountNumber);

  function fillIban() {
    const iban = czechAccountToIban(supplier.accountNumber);
    if (!iban) {
      setErrors(["Číslo účtu se nepodařilo přečíst. Použijte tvar 123456789/0800 nebo 19-123456789/0100."]);
      return;
    }
    setSupplier({ ...supplier, iban: formatIban(iban), accountNumber: formatCzechAccount(supplier.accountNumber) });
    setErrors([]);
  }

  async function onLogo(file: File | undefined) {
    if (!file) return;
    setLogoError("");
    try {
      const logoDataUrl = await readLogoFile(file);
      setSupplier((current) => ({ ...current, logoDataUrl }));
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : "Logo se nepodařilo načíst.");
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Supplier = {
      ...supplier,
      name: supplier.name.trim(),
      accountNumber: supplier.accountNumber.trim(),
      iban: compactIban(supplier.iban),
      bic: supplier.bic.replace(/\s/g, "").toUpperCase(),
    };
    if (!next.iban && parseCzechAccount(next.accountNumber)) {
      next.iban = czechAccountToIban(next.accountNumber) ?? "";
    }
    const problems: string[] = [];
    if (!next.name) problems.push("Vyplňte název nebo jméno.");
    if (next.iban && !isValidIban(next.iban)) problems.push("IBAN nemá platný kontrolní součet.");
    if (next.accountNumber && !parseCzechAccount(next.accountNumber) && !next.iban) {
      problems.push("Číslo účtu zadejte ve tvaru 123456789/0800, nebo vyplňte IBAN.");
    }
    if (next.accountNumber && next.iban && parseCzechAccount(next.accountNumber) && !ibanMatchesCzechAccount(next.accountNumber, next.iban)) {
      problems.push("IBAN nesedí k číslu účtu. Opravte ho, nebo ho nechte dopočítat.");
    }
    if (next.bic && !isValidBic(next.bic)) problems.push("BIC/SWIFT má mít 8 nebo 11 znaků.");
    if (next.vatPayer && !next.dic.trim()) problems.push("Plátce DPH potřebuje na dokladu DIČ.");
    if (problems.length) {
      setErrors(problems);
      setSaved(false);
      return;
    }
    if (next.accountNumber && parseCzechAccount(next.accountNumber)) next.accountNumber = formatCzechAccount(next.accountNumber);
    saveSupplier(next);
    setSupplier({ ...next, iban: next.iban ? formatIban(next.iban) : "" });
    setErrors([]);
    setSaved(true);
  }

  return (
    <div className="page">
      <PageHeader title="Dodavatel" lede="Tyto údaje se tisknou na fakturu. U nových dokladů se vezme aktuální profil, starší faktury si nechají kopii z doby vystavení." />
      <form className="form-main" onSubmit={onSubmit}>
        {errors.length > 0 ? (
          <Notice tone="bad">
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </Notice>
        ) : null}
        {saved ? <Notice tone="ok">Údaje dodavatele jsou uložené v tomto prohlížeči.</Notice> : null}
        <section className="form-section">
          <PartyFields
            party={supplier}
            onChange={(party) => setSupplier({ ...supplier, ...party })}
            showContact
            showAres
            autoCompleteProfile
          />
          <div className="switch-row">
            <button
              type="button"
              className={supplier.vatPayer ? "switch switch-on" : "switch"}
              aria-pressed={supplier.vatPayer}
              onClick={() => setSupplier({ ...supplier, vatPayer: !supplier.vatPayer })}
            >
              <span className="switch-knob" />
              {supplier.vatPayer ? "Jsem plátce DPH" : "Nejsem plátce DPH"}
            </button>
            <p className="field-hint">
              {supplier.vatPayer
                ? "Faktura bude daňový doklad se sazbami 0, 12 a 21 % a s datem uskutečnění zdanitelného plnění."
                : "Faktura nebude obsahovat DPH. Na dokladu bude věta, že nejste plátce."}
            </p>
          </div>
        </section>
        <section className="form-section">
          <h2>Účet</h2>
          <label className="field">
            <span className="field-label">Číslo účtu</span>
            <input
              value={supplier.accountNumber}
              onChange={(event) => setSupplier({ ...supplier, accountNumber: event.target.value })}
              placeholder="123456789/0800"
              autoComplete="off"
            />
            <span className="field-hint">{bank ? `Vypadá to na ${bank}.` : "Tvar 123456789/0800 nebo 19-123456789/0100."}</span>
          </label>
          <label className="field">
            <span className="field-label">IBAN</span>
            <input
              value={supplier.iban}
              onChange={(event) => setSupplier({ ...supplier, iban: event.target.value })}
              onBlur={() => supplier.iban && setSupplier({ ...supplier, iban: formatIban(supplier.iban) })}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button className="btn btn-secondary" type="button" onClick={fillIban}>
            Dopočítat IBAN z čísla účtu
          </button>
          <label className="field">
            <span className="field-label">BIC / SWIFT</span>
            <input
              value={supplier.bic}
              onChange={(event) => setSupplier({ ...supplier, bic: event.target.value })}
              placeholder="nepovinné"
              autoComplete="off"
            />
          </label>
        </section>
        <section className="form-section">
          <h2>Logo</h2>
          {supplier.logoDataUrl ? <img className="logo-preview" src={supplier.logoDataUrl} alt="Náhled loga" /> : null}
          <label className="btn btn-secondary file-btn">
            {supplier.logoDataUrl ? "Vyměnit logo" : "Nahrát logo"}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                void onLogo(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {supplier.logoDataUrl ? (
            <button className="btn btn-ghost" type="button" onClick={() => setSupplier({ ...supplier, logoDataUrl: "" })}>
              Odstranit logo
            </button>
          ) : (
            <p className="field-hint">Nepovinné. Na faktuře se zobrazí v záhlaví, v datech zůstane jen v tomto prohlížeči.</p>
          )}
          {logoError ? <p className="field-error">{logoError}</p> : null}
        </section>
        <div className="savebar">
          <button className="btn btn-primary" type="submit">
            Uložit údaje
          </button>
        </div>
      </form>
    </div>
  );
}

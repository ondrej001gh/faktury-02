import { useState } from "react";
import { fetchCompanyByIco, type AresCompany } from "../lib/ares";
import { dicLooksCzech, isValidIco, normalizeDic, normalizeIco } from "../lib/ico";
import type { Party } from "../types";

export function PartyFields({
  party,
  onChange,
  showContact,
  showAres,
  autoCompleteProfile,
}: {
  party: Party;
  onChange: (party: Party) => void;
  showContact: boolean;
  showAres?: boolean;
  autoCompleteProfile?: boolean;
}) {
  function set<K extends keyof Party>(key: K, value: Party[K]) {
    onChange({ ...party, [key]: value });
  }
  const auto = autoCompleteProfile ? undefined : "off";
  const ico = normalizeIco(party.ico);
  const icoHint = party.ico.trim() && ico.length === 8 && !isValidIco(ico) ? "Kontrolní součet IČO nesedí. Zkontrolujte překlep." : undefined;
  const dicHint = party.dic.trim() && !dicLooksCzech(party.dic) ? "České DIČ obvykle začíná na CZ a má 8 až 10 číslic." : undefined;

  return (
    <>
      <label className="field">
        <span className="field-label">Název nebo jméno</span>
        <input
          value={party.name}
          onChange={(event) => set("name", event.target.value)}
          autoComplete={autoCompleteProfile ? "organization" : auto}
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Ulice a číslo</span>
        <input
          value={party.street}
          onChange={(event) => set("street", event.target.value)}
          autoComplete={autoCompleteProfile ? "street-address" : auto}
        />
      </label>
      <div className="grid-2 split-zip">
        <label className="field">
          <span className="field-label">PSČ</span>
          <input
            value={party.zip}
            onChange={(event) => set("zip", event.target.value)}
            onBlur={() => {
              const digits = party.zip.replace(/\D/g, "");
              if (digits.length === 5) set("zip", `${digits.slice(0, 3)} ${digits.slice(3)}`);
            }}
            inputMode="numeric"
            autoComplete={autoCompleteProfile ? "postal-code" : auto}
          />
        </label>
        <label className="field">
          <span className="field-label">Město</span>
          <input
            value={party.city}
            onChange={(event) => set("city", event.target.value)}
            autoComplete={autoCompleteProfile ? "address-level2" : auto}
          />
        </label>
      </div>
      <label className="field">
        <span className="field-label">Země</span>
        <input
          value={party.country}
          onChange={(event) => set("country", event.target.value)}
          autoComplete={autoCompleteProfile ? "country-name" : auto}
        />
      </label>
      <div className="grid-2">
        <div className="field">
          <label>
            <span className="field-label">IČO</span>
            <input
              value={party.ico}
              onChange={(event) => set("ico", event.target.value.replace(/[^\d\s]/g, "").slice(0, 12))}
              onBlur={() => set("ico", normalizeIco(party.ico))}
              inputMode="numeric"
              autoComplete="off"
            />
          </label>
          {icoHint ? <span className="field-error">{icoHint}</span> : <span className="field-hint">8 číslic</span>}
          {showAres ? (
            <AresLookup
              ico={party.ico}
              onResult={(company) =>
                onChange({
                  ...party,
                  name: company.name,
                  street: company.street,
                  city: company.city,
                  zip: company.zip,
                  country: company.country || party.country,
                  ico: company.ico,
                  dic: company.dic || party.dic,
                })
              }
            />
          ) : null}
        </div>
        <label className="field">
          <span className="field-label">DIČ</span>
          <input
            value={party.dic}
            onChange={(event) => set("dic", event.target.value)}
            onBlur={() => set("dic", normalizeDic(party.dic))}
            autoComplete="off"
            placeholder="CZ12345678"
          />
          {dicHint ? <span className="field-error">{dicHint}</span> : <span className="field-hint">U plátce DPH povinné na dokladu</span>}
        </label>
      </div>
      {showContact ? (
        <div className="grid-2">
          <label className="field">
            <span className="field-label">E-mail</span>
            <input
              type="email"
              value={party.email}
              onChange={(event) => set("email", event.target.value)}
              autoComplete={autoCompleteProfile ? "email" : auto}
              inputMode="email"
            />
          </label>
          <label className="field">
            <span className="field-label">Telefon</span>
            <input
              type="tel"
              value={party.phone}
              onChange={(event) => set("phone", event.target.value)}
              autoComplete={autoCompleteProfile ? "tel" : auto}
            />
          </label>
        </div>
      ) : null}
    </>
  );
}

function AresLookup({ ico, onResult }: { ico: string; onResult: (company: AresCompany) => void }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const ready = normalizeIco(ico).length === 8;

  async function lookup() {
    setLoading(true);
    setMessage("");
    try {
      const company = await fetchCompanyByIco(ico);
      onResult(company);
      setOk(true);
      setMessage(`Načteno z ARES: ${company.name}`);
    } catch (error) {
      setOk(false);
      setMessage(error instanceof Error ? error.message : "ARES se nepodařilo načíst. Údaje vyplňte ručně.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ares-lookup">
      <button type="button" className="btn btn-secondary" onClick={() => void lookup()} disabled={!ready || loading}>
        {loading ? "Načítám z ARES…" : "Načíst z ARES"}
      </button>
      {message ? <p className={ok ? "field-ok" : "field-error"}>{message}</p> : null}
    </div>
  );
}

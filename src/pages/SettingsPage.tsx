import { useMemo, useState, type FormEvent } from "react";
import { Notice, PageHeader } from "../components/ui";
import { parseBackup, serializeBackup } from "../lib/backup";
import { todayISO } from "../lib/dates";
import { patternHasSequence, peekNextNumber } from "../lib/numbering";
import { PAYMENT_METHODS } from "../model";
import { useStore } from "../store";
import type { PaymentMethod, Settings, VatRate } from "../types";

const PRESETS = [
  { label: "2026001", pattern: "{RRRR}{NNN}" },
  { label: "2026-001", pattern: "{RRRR}-{NNN}" },
  { label: "FV2026001", pattern: "FV{RRRR}{NNN}" },
  { label: "20261101", pattern: "{RRRR}{MM}{NN}" },
];

export function SettingsPage() {
  const { data, saveSettings, replaceAll, clearAll } = useStore();
  const [settings, setSettings] = useState<Settings>(data.settings);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"ok" | "bad">("ok");
  const preview = useMemo(() => peekNextNumber(settings, todayISO()), [settings]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const problems: string[] = [];
    if (!patternHasSequence(settings.numberPattern)) problems.push("Vzor musí obsahovat pořadové číslo, třeba {NNN}.");
    if (settings.numberPattern.length > 40) problems.push("Vzor je příliš dlouhý.");
    if (!Number.isInteger(settings.nextSequence) || settings.nextSequence < 1) problems.push("Další číslo řady musí být celé číslo od 1.");
    if (settings.defaultDueDays < 0 || settings.defaultDueDays > 365) problems.push("Splatnost zadejte v rozmezí 0 až 365 dní.");
    if (problems.length) {
      setErrors(problems);
      return;
    }
    saveSettings(settings);
    setErrors([]);
    setMessageTone("ok");
    setMessage("Nastavení je uložené.");
  }

  function exportBackup() {
    const blob = new Blob([serializeBackup(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `faktury-zaloha-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function importBackup(file: File | undefined) {
    if (!file) return;
    setMessage("");
    try {
      const parsed = parseBackup(JSON.parse(await file.text()) as unknown);
      const confirmed = window.confirm("Načtení zálohy přepíše dodavatele, odběratele, faktury i nastavení v tomto prohlížeči. Pokračovat?");
      if (!confirmed) return;
      replaceAll(parsed);
      setSettings(parsed.settings);
      setMessageTone("ok");
      setMessage("Záloha je načtená.");
    } catch (error) {
      setMessageTone("bad");
      setMessage(error instanceof Error ? error.message : "Zálohu se nepodařilo načíst.");
    }
  }

  function wipe() {
    if (!window.confirm("Smazat všechna data v tomto prohlížeči? Soubor zálohy, který už máte stažený, to neobnoví samo.")) return;
    clearAll();
    setSettings({
      numberPattern: "{RRRR}{NNN}",
      nextSequence: 1,
      sequenceYear: new Date().getFullYear(),
      resetSequenceEachYear: true,
      defaultDueDays: 14,
      defaultPaymentMethod: "prevod",
      defaultVatRate: 21,
      defaultNote: "",
    });
    setMessageTone("ok");
    setMessage("Data v prohlížeči jsou smazaná.");
  }

  return (
    <div className="page">
      <PageHeader title="Nastavení" lede="Číslování, výchozí hodnoty a záloha. Data žijí jen v tomto prohlížeči." />
      <Notice tone="warn">
        Než budete mazat historii prohlížeče nebo měnit telefon, stáhněte zálohu. Bez souboru data nejdou vrátit.
      </Notice>
      {message ? <Notice tone={messageTone}>{message}</Notice> : null}
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
        <section className="form-section">
          <h2>Číslování</h2>
          <p className="preview-number">
            Další číslo: <strong>{preview}</strong>
          </p>
          <div className="chips">
            {PRESETS.map((preset) => (
              <button
                key={preset.pattern}
                type="button"
                className={settings.numberPattern === preset.pattern ? "chip chip-active" : "chip"}
                onClick={() => setSettings({ ...settings, numberPattern: preset.pattern })}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label className="field">
            <span className="field-label">Vzor</span>
            <input
              value={settings.numberPattern}
              onChange={(event) => setSettings({ ...settings, numberPattern: event.target.value })}
              spellCheck={false}
            />
            <span className="field-hint">{"{RRRR} rok, {RR} krátký rok, {MM} měsíc, {NNN} pořadové číslo."}</span>
          </label>
          <div className="grid-2">
            <label className="field">
              <span className="field-label">Další pořadové číslo</span>
              <input
                type="number"
                min={1}
                value={settings.nextSequence}
                onChange={(event) => setSettings({ ...settings, nextSequence: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span className="field-label">Splatnost (dny)</span>
              <input
                type="number"
                min={0}
                max={365}
                value={settings.defaultDueDays}
                onChange={(event) => setSettings({ ...settings, defaultDueDays: Number(event.target.value) })}
              />
            </label>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={settings.resetSequenceEachYear}
              onChange={(event) => setSettings({ ...settings, resetSequenceEachYear: event.target.checked })}
            />
            Každý rok začít řadu znovu od 1
          </label>
        </section>
        <section className="form-section">
          <h2>Výchozí hodnoty nové faktury</h2>
          <label className="field">
            <span className="field-label">Způsob úhrady</span>
            <select
              value={settings.defaultPaymentMethod}
              onChange={(event) => setSettings({ ...settings, defaultPaymentMethod: event.target.value as PaymentMethod })}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Sazba DPH u nové položky</span>
            <select
              value={settings.defaultVatRate}
              onChange={(event) => setSettings({ ...settings, defaultVatRate: Number(event.target.value) as VatRate })}
            >
              <option value={21}>21 %</option>
              <option value={12}>12 %</option>
              <option value={0}>0 %</option>
            </select>
            <span className="field-hint">Použije se, jen když jste plátce DPH.</span>
          </label>
          <label className="field">
            <span className="field-label">Poznámka na nové faktuře</span>
            <textarea value={settings.defaultNote} onChange={(event) => setSettings({ ...settings, defaultNote: event.target.value })} />
          </label>
        </section>
        <div className="savebar">
          <button className="btn btn-primary" type="submit">
            Uložit nastavení
          </button>
        </div>
      </form>
      <section className="form-section">
        <h2>Záloha</h2>
        <p className="field-hint">Soubor JSON obsahuje dodavatele, odběratele, faktury, nastavení i logo. Hodí se pro přenos do jiného prohlížeče.</p>
        <div className="actions">
          <button className="btn btn-secondary" type="button" onClick={exportBackup}>
            Stáhnout zálohu
          </button>
          <label className="btn btn-secondary file-btn">
            Načíst zálohu
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void importBackup(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </section>
      <section className="form-section danger-zone">
        <h2>Smazat data</h2>
        <p className="field-hint">Smaže vše uložené v tomto prohlížeči. Záloha na disku zůstane.</p>
        <button className="btn btn-danger" type="button" onClick={wipe}>
          Smazat všechna data
        </button>
      </section>
    </div>
  );
}

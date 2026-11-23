import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui";

export function MorePage() {
  return (
    <div className="page">
      <PageHeader title="Více" lede="Profil dodavatele, číslování a záloha dat." />
      <div className="stack">
        <Link className="more-link" to="/dodavatel">
          <strong>Dodavatel</strong>
          <span>Jméno, IČO, účet, DIČ a logo na faktuře</span>
        </Link>
        <Link className="more-link" to="/nastaveni">
          <strong>Nastavení a záloha</strong>
          <span>Čísla faktur, výchozí splatnost, export a import JSON</span>
        </Link>
      </div>
      <p className="lede privacy-note">
        Data zůstávají jen v tomto prohlížeči. Před výměnou telefonu nebo vymazáním historie si v nastavení stáhněte zálohu.
      </p>
    </div>
  );
}

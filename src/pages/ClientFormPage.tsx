import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PartyFields } from "../components/PartyFields";
import { Notice, PageHeader } from "../components/ui";
import { createId } from "../lib/id";
import { emptyParty } from "../model";
import { useStore } from "../store";
import type { Client } from "../types";

export function ClientFormPage() {
  const { id } = useParams();
  return <ClientForm key={id ?? "novy"} />;
}

function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, upsertClient, deleteClient } = useStore();
  const existing = id ? data.clients.find((client) => client.id === id) : undefined;
  const [client, setClient] = useState<Client>(() =>
    existing ?? { ...emptyParty(), id: createId(), note: "" },
  );
  const [error, setError] = useState("");

  if (id && !existing) {
    return (
      <div className="page">
        <PageHeader title="Odběratel" />
        <p>Odběratel nenalezen.</p>
        <Link to="/odberatele">Zpět na adresář</Link>
      </div>
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!client.name.trim()) {
      setError("Vyplňte název odběratele.");
      return;
    }
    upsertClient({ ...client, name: client.name.trim() });
    navigate("/odberatele");
  }

  function remove() {
    if (!existing) return;
    if (!window.confirm("Odběratel se smaže z adresáře. Už vystavené faktury zůstanou beze změny.")) return;
    deleteClient(existing.id);
    navigate("/odberatele");
  }

  return (
    <div className="page">
      <Link className="back-link" to="/odberatele">
        ← Odběratelé
      </Link>
      <PageHeader title={existing ? "Upravit odběratele" : "Nový odběratel"} lede="IČO můžete načíst z veřejného rejstříku ARES." />
      <form className="form-main" onSubmit={onSubmit}>
        {error ? <Notice tone="bad">{error}</Notice> : null}
        <section className="form-section">
          <PartyFields party={client} onChange={(party) => setClient({ ...client, ...party })} showContact showAres />
          <label className="field">
            <span className="field-label">Poznámka</span>
            <textarea value={client.note} onChange={(event) => setClient({ ...client, note: event.target.value })} />
          </label>
        </section>
        <div className="savebar">
          <button className="btn btn-primary" type="submit">
            Uložit odběratele
          </button>
          {existing ? (
            <button className="btn btn-danger" type="button" onClick={remove}>
              Smazat
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

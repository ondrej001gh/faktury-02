import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui";
import { useStore } from "../store";

export function ClientsPage() {
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const clients = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("cs");
    return data.clients
      .filter((client) => {
        if (!needle) return true;
        return [client.name, client.city, client.ico, client.dic, client.email].join(" ").toLocaleLowerCase("cs").includes(needle);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "cs"));
  }, [data.clients, query]);

  return (
    <div className="page">
      <PageHeader
        title="Odběratelé"
        lede="Adresář firem a lidí, kterým fakturujete."
        actions={
          <Link className="btn btn-primary" to="/odberatele/novy">
            Nový odběratel
          </Link>
        }
      />
      {data.clients.length > 0 ? (
        <input
          className="search"
          type="search"
          placeholder="Hledat název, město, IČO…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Hledat odběratele"
        />
      ) : null}
      {data.clients.length === 0 ? (
        <div className="empty">
          <p className="empty-title">Adresář je prázdný.</p>
          <p className="lede">Odběratele lze vyplnit i přímo na faktuře. Tady je znovu použijete jedním klepnutím.</p>
          <Link className="btn btn-primary" to="/odberatele/novy">
            Přidat odběratele
          </Link>
        </div>
      ) : clients.length === 0 ? (
        <div className="empty">
          <p className="empty-title">Nikdo neodpovídá hledání.</p>
        </div>
      ) : (
        <div className="stack">
          {clients.map((client) => (
            <Link key={client.id} className="invoice-card" to={`/odberatele/${client.id}`}>
              <div className="invoice-card-top">
                <strong>{client.name || "Bez názvu"}</strong>
              </div>
              <p className="invoice-meta">
                {[client.city, client.ico ? `IČO ${client.ico}` : "", client.dic ? `DIČ ${client.dic}` : ""].filter(Boolean).join(" · ") || "Doplňte adresu"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

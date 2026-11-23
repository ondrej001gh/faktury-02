import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultData, loadData, saveData } from "./lib/backup";
import { advanceSequence } from "./lib/numbering";
import type { AppData, Client, Invoice, Settings, Supplier } from "./types";

interface Store {
  data: AppData;
  persistError: string | null;
  saveSupplier: (supplier: Supplier) => void;
  upsertClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  saveInvoice: (invoice: Invoice, mode: "create" | "update") => void;
  deleteInvoice: (id: string) => void;
  setPaid: (id: string, paid: boolean, paidDate: string) => void;
  saveSettings: (settings: Settings) => void;
  replaceAll: (data: AppData) => void;
  clearAll: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [persistError, setPersistError] = useState<string | null>(null);

  useEffect(() => {
    const result = saveData(data);
    setPersistError(result.ok ? null : result.error);
  }, [data]);

  const store: Store = {
    data,
    persistError,
    saveSupplier(supplier) {
      setData((current) => ({ ...current, supplier }));
    },
    upsertClient(client) {
      setData((current) => {
        const exists = current.clients.some((item) => item.id === client.id);
        const clients = exists
          ? current.clients.map((item) => (item.id === client.id ? client : item))
          : [...current.clients, client];
        return { ...current, clients };
      });
    },
    deleteClient(id) {
      setData((current) => ({ ...current, clients: current.clients.filter((client) => client.id !== id) }));
    },
    saveInvoice(invoice, mode) {
      setData((current) => {
        const now = new Date().toISOString();
        const exists = current.invoices.some((item) => item.id === invoice.id);
        const stamped: Invoice = { ...invoice, updatedAt: now, createdAt: exists ? invoice.createdAt : now };
        const invoices = exists
          ? current.invoices.map((item) => (item.id === stamped.id ? stamped : item))
          : [...current.invoices, stamped];
        const settings =
          mode === "create" && !exists ? advanceSequence(current.settings, stamped.issueDate, stamped.number) : current.settings;
        return { ...current, invoices, settings };
      });
    },
    deleteInvoice(id) {
      setData((current) => ({ ...current, invoices: current.invoices.filter((invoice) => invoice.id !== id) }));
    },
    setPaid(id, paid, paidDate) {
      setData((current) => ({
        ...current,
        invoices: current.invoices.map((invoice) =>
          invoice.id === id
            ? {
                ...invoice,
                status: paid ? "paid" : "unpaid",
                paidDate: paid ? paidDate : "",
                updatedAt: new Date().toISOString(),
              }
            : invoice,
        ),
      }));
    },
    saveSettings(settings) {
      setData((current) => ({ ...current, settings }));
    },
    replaceAll(next) {
      setData(next);
    },
    clearAll() {
      setData(defaultData());
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store není k dispozici.");
  return store;
}

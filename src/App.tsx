import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ClientFormPage } from "./pages/ClientFormPage";
import { ClientsPage } from "./pages/ClientsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";
import { InvoiceFormPage } from "./pages/InvoiceFormPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { MorePage } from "./pages/MorePage";
import { SettingsPage } from "./pages/SettingsPage";
import { SupplierPage } from "./pages/SupplierPage";
import { StoreProvider } from "./store";

export function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="faktury" element={<InvoicesPage />} />
            <Route path="faktury/nova" element={<InvoiceFormPage />} />
            <Route path="faktury/:id" element={<InvoiceDetailPage />} />
            <Route path="faktury/:id/upravit" element={<InvoiceFormPage />} />
            <Route path="odberatele" element={<ClientsPage />} />
            <Route path="odberatele/novy" element={<ClientFormPage />} />
            <Route path="odberatele/:id" element={<ClientFormPage />} />
            <Route path="dodavatel" element={<SupplierPage />} />
            <Route path="nastaveni" element={<SettingsPage />} />
            <Route path="vice" element={<MorePage />} />
            <Route path="*" element={<p className="page">Stránka nenalezena.</p>} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}

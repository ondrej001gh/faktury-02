import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useStore } from "../store";
import { Notice } from "./ui";

function Icon({ path }: { path: string }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const items = [
  { to: "/", label: "Přehled", end: true, icon: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" },
  { to: "/faktury", label: "Faktury", end: false, icon: "M7 3.5h7l5 5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1zM14 3.5V9h5" },
  { to: "/odberatele", label: "Odběratelé", end: false, icon: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16.5 11a2.5 2.5 0 1 0 0-5M4.8 19.5c.5-2.6 2.4-4 4.7-4s4.2 1.4 4.7 4M14.2 15.2c1.8.3 3.2 1.2 3.8 3.3" },
  { to: "/dodavatel", label: "Dodavatel", end: false, icon: "M4 7.5h16v10H4zM4 11h16M8 15h4" },
  { to: "/nastaveni", label: "Nastavení", end: false, icon: "M4 8h16M4 16h16M9 8v.01M9 6.5v3M16 16v.01M16 14.5v3" },
];

export function Layout() {
  const { data, persistError } = useStore();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const moreActive = ["/vice", "/dodavatel", "/nastaveni"].some((path) => location.pathname.startsWith(path));

  return (
    <div className="app">
      <aside className="sidebar no-print">
        <div className="brand">
          <span className="brand-mark">F</span>
          <span className="brand-text">
            <strong>Faktury</strong>
            <small>{data.supplier.name || "Lokální evidence"}</small>
          </span>
        </div>
        <nav className="side-nav" aria-label="Hlavní">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon path={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar no-print">
          <NavLink to="/" className="topbar-link">
            <span className="brand-mark">F</span>
            <span className="brand-text">
              <strong>Faktury</strong>
              <small>{data.supplier.name || "Doplňte dodavatele"}</small>
            </span>
          </NavLink>
        </header>
        <main className="main">
          {persistError ? <Notice tone="bad">{persistError}</Notice> : null}
          <Outlet />
        </main>
      </div>
      <nav className="tabbar no-print" aria-label="Hlavní">
        {items.slice(0, 3).map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "tab-link active" : "tab-link")}>
            <Icon path={item.icon} />
            {item.label}
          </NavLink>
        ))}
        <NavLink to="/vice" className={() => (moreActive ? "tab-link active" : "tab-link")}>
          <Icon path="M6 12h.01M12 12h.01M18 12h.01" />
          Více
        </NavLink>
      </nav>
    </div>
  );
}

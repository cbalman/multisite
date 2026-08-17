import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { PanelContext } from "../lib/panel-context";
import { getSubdomain, platformOrigin, sitePanelUrl, sitePublicUrl } from "../lib/host";
import type { Site, User } from "../lib/types";

const NAV = [
  { to: "/panel", label: "Inicio", end: true },
  { to: "/panel/publicaciones", label: "Publicaciones" },
  { to: "/panel/perfil", label: "Mi perfil" },
  { to: "/panel/contacto", label: "Contacto" },
  { to: "/panel/redes", label: "Redes" },
];

export default function PanelLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const subdomain = getSubdomain();
  const [user, setUser] = useState<User | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSite() {
    const s = await api.get<Site>("/me/site");
    setSite(s);
  }

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/ingresar");
      return;
    }

    api
      .get<User>("/auth/me")
      .then((u) => {
        if (u.role === "superadmin") {
          window.location.href = `${platformOrigin()}/admin`;
          return null;
        }
        setUser(u);
        return api.get<Site>("/me/site");
      })
      .then((s) => {
        if (!s) return;
        if (!subdomain) {
          window.location.href = sitePanelUrl(s.slug);
          return;
        }
        if (s.slug !== subdomain) {
          setError("No tenés permiso para administrar este sitio.");
          return;
        }
        setSite(s);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error");
        localStorage.removeItem("access_token");
        navigate("/ingresar");
      });
  }, [navigate, subdomain]);

  useEffect(() => {
    if (!site) return;
    const onOnboarding = location.pathname.startsWith("/panel/onboarding");
    if (!site.onboarding_completed && !onOnboarding) {
      navigate("/panel/onboarding", { replace: true });
    }
  }, [site, location.pathname, navigate]);

  function logout() {
    localStorage.removeItem("access_token");
    navigate("/");
  }

  if (error && !site) {
    return (
      <div className="shell">
        <p className="error">{error}</p>
        <Link to="/ingresar">Ingresar</Link>
      </div>
    );
  }

  if (!user || !site) {
    return (
      <div className="shell">
        <p>Cargando panel…</p>
      </div>
    );
  }

  const publicUrl = sitePublicUrl(site.slug);
  const onboarding = location.pathname.startsWith("/panel/onboarding");

  return (
    <PanelContext.Provider value={{ user, site, refreshSite: loadSite }}>
      <div className={onboarding ? "dash dash-onboarding" : "dash"}>
        {!onboarding && (
        <aside className="dash-side">
          <div className="brand">Multisite</div>
          <nav className="dash-nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? "dash-link is-active" : "dash-link")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <a className="btn btn-primary dash-cta" href={publicUrl} target="_blank" rel="noreferrer">
            Ver mi sitio
          </a>
        </aside>
        )}
        <div className="dash-main">
          <header className="dash-top">
            <strong>{onboarding ? "Configurar tu sitio" : site.name}</strong>
            <div className="nav-actions">
              <span>{user.name}</span>
              <button className="btn btn-ghost" type="button" onClick={logout}>
                Salir
              </button>
            </div>
          </header>
          <Outlet />
        </div>
      </div>
    </PanelContext.Provider>
  );
}

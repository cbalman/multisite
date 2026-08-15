import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { sitePublicUrl } from "../lib/host";

type User = { id: number; name: string; email: string; role: string };
type Site = {
  id: number;
  slug: string;
  name: string;
  status: string;
  whatsapp: string | null;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/ingresar");
      return;
    }

    Promise.all([api.get<User>("/auth/me"), api.get<Site>("/me/site")])
      .then(([u, s]) => {
        setUser(u);
        setSite(s);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error");
        if (String(err.message).includes("autenticado") || String(err).includes("401")) {
          localStorage.removeItem("access_token");
          navigate("/ingresar");
        }
      });
  }, [navigate]);

  function logout() {
    localStorage.removeItem("access_token");
    navigate("/");
  }

  if (error && !user) {
    return (
      <div className="shell">
        <p className="error">{error}</p>
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

  return (
    <div className="shell">
      <header className="nav">
        <div className="brand">Multisite</div>
        <div className="nav-actions">
          <span>{user.name}</span>
          <button className="btn btn-ghost" type="button" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      <section className="panel">
        <h1>Hola {user.name}</h1>
        <p>
          Tu sitio está <strong>{site.status === "active" ? "activo" : site.status}</strong>
        </p>
        <p>
          <a href={publicUrl} target="_blank" rel="noreferrer">
            {site.slug}.localhost
          </a>
        </p>

        <div className="stats">
          <div className="stat">
            <strong>—</strong>
            <span>visitas</span>
          </div>
          <div className="stat">
            <strong>—</strong>
            <span>WhatsApp</span>
          </div>
          <div className="stat">
            <strong>—</strong>
            <span>publicaciones</span>
          </div>
        </div>

        <a className="btn btn-primary" href={publicUrl} target="_blank" rel="noreferrer">
          Ver mi sitio
        </a>
        <p style={{ marginTop: "1rem", color: "var(--muted)" }}>
          Próximo: publicaciones, contacto, onboarding y admin.
        </p>
        <p>
          <Link to="/">Volver al inicio</Link>
        </p>
      </section>
    </div>
  );
}

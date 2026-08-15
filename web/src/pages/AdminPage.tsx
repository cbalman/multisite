import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { sitePublicUrl } from "../lib/host";

type User = { id: number; name: string; email: string; role: string };
type SiteRow = {
  id: number;
  slug: string;
  name: string;
  status: string;
  owner_name: string;
  owner_email: string;
};
type SlugCheck = { slug: string; available: boolean; full_host: string };
type Created = {
  message: string;
  full_host: string;
  site: SiteRow;
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slugInfo, setSlugInfo] = useState<SlugCheck | null>(null);

  const preview = useMemo(() => {
    const clean = slug.trim().toLowerCase() || "cliente";
    return `${clean}.localhost`;
  }, [slug]);

  function loadSites() {
    return api.get<SiteRow[]>("/admin/sites").then(setSites);
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
        if (u.role !== "superadmin") {
          navigate("/panel");
          return;
        }
        setUser(u);
        return loadSites();
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        navigate("/ingresar");
      });
  }, [navigate]);

  useEffect(() => {
    const clean = slug.trim().toLowerCase();
    if (!user || clean.length < 2) {
      setSlugInfo(null);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<SlugCheck>(`/admin/slug-available/${encodeURIComponent(clean)}`)
        .then(setSlugInfo)
        .catch(() => setSlugInfo(null));
    }, 300);
    return () => clearTimeout(t);
  }, [slug, user]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const data = await api.post<Created>("/admin/sites", {
        name,
        email,
        password,
        site_name: siteName,
        slug: slug.trim().toLowerCase(),
      });
      setOk(`${data.message} → ${data.full_host}`);
      setName("");
      setSiteName("");
      setSlug("");
      setEmail("");
      setPassword("");
      setSlugInfo(null);
      await loadSites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    navigate("/");
  }

  if (!user) {
    return (
      <div className="shell">
        <p>Cargando admin…</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="nav">
        <div className="brand">Multisite · Super Admin</div>
        <div className="nav-actions">
          <span>{user.name}</span>
          <button className="btn btn-ghost" type="button" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      <section className="panel">
        <h1>Nueva vidriera</h1>
        <p className="hint">
          Vos creás la cuenta del cliente. Después María (u otro) solo ingresa y
          administra su página.
        </p>

        <form onSubmit={onCreate}>
          <div className="field">
            <label htmlFor="name">Nombre del cliente</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="siteName">Nombre del sitio</label>
            <input
              id="siteName"
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="slug">Dirección (subdominio)</label>
            <input
              id="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
            />
          </div>
          <div className="preview-host">Quedará: {preview}</div>
          {slugInfo && !slugInfo.available && (
            <p className="error">Esa dirección ya está en uso.</p>
          )}
          <div className="field">
            <label htmlFor="email">Email de acceso del cliente</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña inicial</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error">{error}</p>}
          {ok && <p className="preview-host">{ok}</p>}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || (slugInfo ? !slugInfo.available : false)}
          >
            {loading ? "Creando…" : "Crear vidriera"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Sitios</h2>
        {sites.length === 0 ? (
          <p className="hint">Todavía no hay vidrieras.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {sites.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                  padding: "0.85rem 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <strong>{s.name}</strong>
                  <div style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                    {s.owner_name} · {s.owner_email} · {s.status}
                  </div>
                </div>
                <a href={sitePublicUrl(s.slug)} target="_blank" rel="noreferrer">
                  {s.slug}.localhost
                </a>
              </div>
            ))}
          </div>
        )}
        <p style={{ marginTop: "1rem" }}>
          <Link to="/">Volver al inicio</Link>
        </p>
      </section>
    </div>
  );
}

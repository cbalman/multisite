import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

type TokenResponse = { access_token: string };
type SlugCheck = { slug: string; available: boolean; full_host: string };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [slug, setSlug] = useState(params.get("slug") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slugInfo, setSlugInfo] = useState<SlugCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = useMemo(() => {
    const clean = slug.trim().toLowerCase() || "tu-sitio";
    return `${clean}.localhost`;
  }, [slug]);

  useEffect(() => {
    const clean = slug.trim().toLowerCase();
    if (clean.length < 2) {
      setSlugInfo(null);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<SlugCheck>(`/auth/slug-available/${encodeURIComponent(clean)}`)
        .then(setSlugInfo)
        .catch(() => setSlugInfo(null));
    }, 300);
    return () => clearTimeout(t);
  }, [slug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<TokenResponse>("/auth/register", {
        name,
        email,
        password,
        site_name: siteName,
        slug: slug.trim().toLowerCase(),
      });
      localStorage.setItem("access_token", data.access_token);
      navigate("/panel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el sitio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <header className="nav">
        <Link className="brand" to="/">
          Multisite
        </Link>
      </header>

      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Crear mi sitio</h1>
        <p className="hint">Solo lo necesario para empezar.</p>

        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="siteName">Nombre de mi sitio</label>
          <input
            id="siteName"
            required
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="slug">Dirección</label>
          <input
            id="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
          />
        </div>

        <div className="preview-host">Tu sitio será: {preview}</div>
        {slugInfo && !slugInfo.available && (
          <p className="error">Esa dirección ya está en uso.</p>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
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

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading || (slugInfo ? !slugInfo.available : false)}
        >
          {loading ? "Creando…" : "Crear mi sitio"}
        </button>
      </form>
    </div>
  );
}

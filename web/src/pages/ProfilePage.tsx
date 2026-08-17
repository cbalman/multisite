import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { usePanel } from "../lib/panel-context";
import type { Category } from "../lib/types";

export default function ProfilePage() {
  const { site, refreshSite } = usePanel();
  const [name, setName] = useState(site.name);
  const [description, setDescription] = useState(site.description ?? "");
  const [city, setCity] = useState(site.city ?? "");
  const [categoryId, setCategoryId] = useState(site.category_id ? String(site.category_id) : "");
  const [logoUrl, setLogoUrl] = useState(site.logo_url);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  async function onUpload(file: File) {
    setError(null);
    try {
      const data = await api.upload<{ url: string }>("/me/upload?kind=image", file);
      setLogoUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      await api.patch("/me/site", {
        name,
        description: description || null,
        city: city || null,
        category_id: categoryId ? Number(categoryId) : null,
        logo_url: logoUrl,
      });
      await refreshSite();
      setOk("Perfil guardado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel-card">
      <h1>Mi perfil</h1>
      <p className="hint">Así te van a ver en tu vidriera.</p>
      <form onSubmit={onSubmit}>
        <div className="avatar-row">
          {logoUrl ? (
            <img className="avatar" src={logoUrl} alt="Logo" />
          ) : (
            <div className="avatar">{name.slice(0, 1).toUpperCase()}</div>
          )}
          <label className="btn btn-ghost">
            Subir foto o logo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file);
              }}
            />
          </label>
        </div>
        <div className="field">
          <label htmlFor="name">Nombre del sitio</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="city">Ciudad</label>
          <input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="category">Categoría</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Elegí una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        {ok && <p className="preview-host">{ok}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </section>
  );
}

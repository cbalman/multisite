import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { sitePublicUrl } from "../lib/host";
import { usePanel } from "../lib/panel-context";
import type { Category } from "../lib/types";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const { site, refreshSite } = usePanel();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(site.name);
  const [description, setDescription] = useState(site.description ?? "");
  const [city, setCity] = useState(site.city ?? "");
  const [categoryId, setCategoryId] = useState(site.category_id ? String(site.category_id) : "");
  const [logoUrl, setLogoUrl] = useState(site.logo_url);
  const [categories, setCategories] = useState<Category[]>([]);
  const [whatsapp, setWhatsapp] = useState(site.whatsapp ?? "");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [cover, setCover] = useState<string | null>(null);

  const publicUrl = sitePublicUrl(site.slug);

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  async function finish() {
    await api.post("/me/site/onboarding/complete", {});
    await refreshSite();
    setStep(4);
  }

  async function uploadLogo(file: File) {
    const data = await api.upload<{ url: string }>("/me/upload?kind=image", file);
    setLogoUrl(data.url);
  }

  async function uploadCover(file: File) {
    const data = await api.upload<{ url: string }>("/me/upload?kind=image", file);
    setCover(data.url);
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  async function saveWhatsapp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.patch("/me/site", { whatsapp: whatsapp || null });
      await refreshSite();
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "WhatsApp inválido");
    } finally {
      setLoading(false);
    }
  }

  async function savePublication(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (title.trim().length >= 2) {
        await api.post("/me/publications", {
          title: title.trim(),
          price: price ? Number(price) : null,
          price_visible: Boolean(price),
          status: "published",
          images: cover ? [cover] : [],
        });
        await refreshSite();
      }
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel-card onboarding">
      {step < 4 && (
        <p className="hint">
          Paso {step} de 3 · Podés saltear y completar después desde el panel.
        </p>
      )}

      {step === 1 && (
        <form onSubmit={saveProfile}>
          <h1>Contanos sobre vos</h1>
          <p className="hint">Nombre, una frase y opcionalmente foto, categoría y ciudad.</p>
          <div className="avatar-row">
            {logoUrl ? (
              <img className="avatar" src={logoUrl} alt="Logo" />
            ) : (
              <div className="avatar">{name.slice(0, 1).toUpperCase()}</div>
            )}
            <label className="btn btn-ghost">
              Subir foto
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
              />
            </label>
          </div>
          <div className="field">
            <label htmlFor="ob-name">Nombre del sitio</label>
            <input id="ob-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ob-bio">Descripción</label>
            <textarea id="ob-bio" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ob-city">Ciudad</label>
            <input id="ob-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ob-cat">Categoría</label>
            <select id="ob-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Elegí una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="row-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Continuar"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setStep(2)}>
              Saltear
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={saveWhatsapp}>
          <h1>¿Cómo pueden contactarte?</h1>
          <p className="hint">WhatsApp es el canal principal. Después podés agregar teléfonos.</p>
          <div className="field">
            <label htmlFor="ob-wa">WhatsApp</label>
            <input
              id="ob-wa"
              placeholder="5493415551234"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <div className="row-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Continuar"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setStep(3)}>
              Saltear
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={savePublication}>
          <h1>Tu primera publicación</h1>
          <p className="hint">Un título alcanza. Foto y precio son opcionales.</p>
          {cover && <img src={cover} alt="" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12 }} />}
          <label className="btn btn-ghost" style={{ marginBottom: "1rem" }}>
            {cover ? "Cambiar foto" : "Subir foto"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadCover(file);
              }}
            />
          </label>
          <div className="field">
            <label htmlFor="ob-title">Título</label>
            <input id="ob-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ob-price">Precio (opcional)</label>
            <input id="ob-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          {error && <p className="error">{error}</p>}
          <div className="row-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Guardando…" : title.trim() ? "Publicar y listo" : "Saltar y listo"}
            </button>
            <button className="btn btn-ghost" type="button" disabled={loading} onClick={() => void finish()}>
              Saltear
            </button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div>
          <h1>Tu sitio ya está listo</h1>
          <p className="preview-host">{site.slug}.localhost</p>
          <p className="hint">Ya podés compartirlo. Todo esto también se edita después desde el panel.</p>
          <div className="row-actions">
            <a className="btn btn-primary" href={publicUrl} target="_blank" rel="noreferrer">
              Ver mi sitio
            </a>
            <button className="btn btn-ghost" type="button" onClick={() => navigate("/panel")}>
              Ir al panel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

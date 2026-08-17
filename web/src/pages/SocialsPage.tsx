import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { SOCIAL_PLATFORMS } from "../lib/types";
import { usePanel } from "../lib/panel-context";

export default function SocialsPage() {
  const { site, refreshSite } = usePanel();
  const [urls, setUrls] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const p of SOCIAL_PLATFORMS) initial[p.id] = "";
    for (const s of site.socials) initial[s.platform] = s.url;
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      await api.put("/me/site/socials", {
        socials: SOCIAL_PLATFORMS.map((p) => ({ platform: p.id, url: urls[p.id] || "" })),
      });
      await refreshSite();
      setOk("Redes guardadas. En la vidriera solo se muestran las que tengan URL.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel-card">
      <h1>Redes</h1>
      <p className="hint">Completá solo las que uses. El resto no aparece en tu sitio.</p>
      <form onSubmit={onSubmit}>
        {SOCIAL_PLATFORMS.map((p) => (
          <div className="field" key={p.id}>
            <label htmlFor={p.id}>{p.label}</label>
            <input
              id={p.id}
              type="url"
              placeholder="https://"
              value={urls[p.id]}
              onChange={(e) => setUrls((prev) => ({ ...prev, [p.id]: e.target.value }))}
            />
          </div>
        ))}
        {error && <p className="error">{error}</p>}
        {ok && <p className="preview-host">{ok}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </section>
  );
}

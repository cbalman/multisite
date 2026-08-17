import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { usePanel } from "../lib/panel-context";

export default function ContactPage() {
  const { site, refreshSite } = usePanel();
  const [whatsapp, setWhatsapp] = useState(site.whatsapp ?? "");
  const [phone1, setPhone1] = useState(site.phone1 ?? "");
  const [phone2, setPhone2] = useState(site.phone2 ?? "");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      await api.patch("/me/site", {
        whatsapp: whatsapp || null,
        phone1: phone1 || null,
        phone2: phone2 || null,
      });
      await refreshSite();
      setOk("Contacto guardado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel-card">
      <h1>Contacto</h1>
      <p className="hint">WhatsApp es el canal principal. Los teléfonos son opcionales.</p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="whatsapp">WhatsApp</label>
          <input
            id="whatsapp"
            placeholder="5493415551234"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="phone1">Teléfono 1</label>
          <input id="phone1" value={phone1} onChange={(e) => setPhone1(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="phone2">Teléfono 2</label>
          <input id="phone2" value={phone2} onChange={(e) => setPhone2(e.target.value)} />
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

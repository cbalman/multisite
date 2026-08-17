import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Publication } from "../lib/types";

const STATUS_LABEL: Record<string, string> = {
  published: "Publicada",
  hidden: "Oculta",
  draft: "Borrador",
};

function formatPrice(pub: Publication): string {
  if (pub.price_on_request) return "Precio a consultar";
  if (!pub.price_visible || pub.price == null) return "";
  return Number(pub.price).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default function PublicationsPage() {
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api
      .get<Publication[]>("/me/publications")
      .then(setPubs)
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }

  useEffect(() => {
    load();
  }, []);

  async function hide(pub: Publication) {
    const next = pub.status === "hidden" ? "published" : "hidden";
    await api.patch(`/me/publications/${pub.id}`, { status: next });
    load();
  }

  async function remove(pub: Publication) {
    if (!confirm(`¿Eliminar “${pub.title}”?`)) return;
    await api.delete(`/me/publications/${pub.id}`);
    load();
  }

  return (
    <section className="panel-card">
      <div className="row-between">
        <h1>Publicaciones</h1>
        <Link className="btn btn-primary" to="/panel/publicaciones/nueva">
          + Nueva publicación
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      {pubs.length === 0 && <p className="hint">Todavía no hay publicaciones.</p>}
      <div className="pub-admin-list">
        {pubs.map((p) => (
          <article className="pub-admin" key={p.id}>
            <div className="pub-admin-media">
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt="" />
              ) : (
                <div className="pub-media" />
              )}
            </div>
            <div className="pub-admin-body">
              <h3>{p.title}</h3>
              {formatPrice(p) && <div className="price">{formatPrice(p)}</div>}
              <p className="hint">{STATUS_LABEL[p.status] || p.status}</p>
              <div className="row-actions">
                <Link to={`/panel/publicaciones/${p.id}`}>Editar</Link>
                <button type="button" onClick={() => void hide(p)}>
                  {p.status === "hidden" ? "Publicar" : "Ocultar"}
                </button>
                <button type="button" onClick={() => void remove(p)}>
                  Eliminar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

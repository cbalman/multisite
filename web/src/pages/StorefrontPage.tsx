import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type Site = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  city: string | null;
  whatsapp: string | null;
  phone1: string | null;
  primary_color: string;
  socials: { platform: string; url: string }[];
};

type Publication = {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  price_visible: boolean;
  price_on_request: boolean;
  cover_image_url: string | null;
  video_url: string | null;
};

type Props = { slug: string };

export default function StorefrontPage({ slug }: Props) {
  const [site, setSite] = useState<Site | null>(null);
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Site>(`/public/sites/${slug}`),
      api.get<Publication[]>(`/public/sites/${slug}/publications`),
    ])
      .then(([s, p]) => {
        setSite(s);
        setPubs(p);
        document.title = s.name;
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No disponible"));
  }, [slug]);

  const waLink = useMemo(() => {
    if (!site?.whatsapp) return null;
    const phone = site.whatsapp.replace(/\D/g, "");
    const text = encodeURIComponent(`Hola, quiero hacer una consulta.`);
    return `https://wa.me/${phone}?text=${text}`;
  }, [site]);

  if (error) {
    return (
      <div className="storefront">
        <div className="storefront-inner">
          <h1>Sitio no disponible</h1>
          <p className="bio">{error}</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="storefront">
        <div className="storefront-inner">
          <p>Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="storefront" style={{ ["--accent" as string]: site.primary_color }}>
      <div className="storefront-inner">
        <div className="avatar" aria-hidden>
          {site.name.slice(0, 1).toUpperCase()}
        </div>
        <h1>{site.name}</h1>
        {site.description && <p className="bio">{site.description}</p>}
        {site.city && <p className="meta">📍 {site.city}</p>}

        {site.socials.length > 0 && (
          <p className="meta">
            {site.socials.map((s) => (
              <a key={s.platform} href={s.url} target="_blank" rel="noreferrer" style={{ margin: "0 0.4rem" }}>
                {s.platform}
              </a>
            ))}
          </p>
        )}

        {waLink && (
          <a className="btn btn-primary" href={waLink} target="_blank" rel="noreferrer">
            Contactar por WhatsApp
          </a>
        )}

        <section className="pubs" aria-label="Publicaciones">
          {pubs.length === 0 && (
            <p className="bio" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
              Pronto habrá publicaciones acá.
            </p>
          )}
          {pubs.map((p) => (
            <article className="pub" key={p.id}>
              <div className="pub-media" />
              <div className="pub-body">
                <h3>{p.title}</h3>
                {p.price_on_request ? (
                  <div className="price">Precio a consultar</div>
                ) : p.price_visible && p.price != null ? (
                  <div className="price">
                    {Number(p.price).toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      maximumFractionDigits: 0,
                    })}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        {(site.phone1 || site.whatsapp) && (
          <section style={{ marginTop: "3rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)" }}>Contacto</h2>
            {site.phone1 && <p>{site.phone1}</p>}
            {waLink && (
              <a className="btn btn-ghost" href={waLink} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { SOCIAL_PLATFORMS } from "../lib/types";
import { publicationWhatsappText, profileWhatsappText, whatsappHref } from "../lib/whatsapp";

type Site = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  city: string | null;
  whatsapp: string | null;
  phone1: string | null;
  phone2: string | null;
  primary_color: string;
  socials: { platform: string; url: string }[];
  whatsapp_url: string | null;
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
  images: string[];
  whatsapp_url: string | null;
};

type Props = { slug: string };

function socialLabel(platform: string): string {
  return SOCIAL_PLATFORMS.find((p) => p.id === platform)?.label ?? platform;
}

function formatPrice(pub: Publication): string | null {
  if (pub.price_on_request) return "Precio a consultar";
  if (!pub.price_visible || pub.price == null) return null;
  return Number(pub.price).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

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

  const waProfile = useMemo(() => {
    if (!site) return null;
    return site.whatsapp_url || whatsappHref(site.whatsapp, profileWhatsappText(site.name));
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
        {site.logo_url ? (
          <img className="avatar" src={site.logo_url} alt={site.name} />
        ) : (
          <div className="avatar" aria-hidden>
            {site.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <h1>{site.name}</h1>
        {site.description && <p className="bio">{site.description}</p>}
        {site.city && <p className="meta">📍 {site.city}</p>}

        {site.socials.length > 0 && (
          <p className="meta">
            {site.socials.map((s) => (
              <a key={s.platform} href={s.url} target="_blank" rel="noreferrer" style={{ margin: "0 0.4rem" }}>
                {socialLabel(s.platform)}
              </a>
            ))}
          </p>
        )}

        {waProfile && (
          <a className="btn btn-primary" href={waProfile} target="_blank" rel="noreferrer">
            Contactar por WhatsApp
          </a>
        )}

        <section className="pubs" aria-label="Publicaciones">
          {pubs.length === 0 && (
            <p className="bio" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
              Pronto habrá publicaciones acá.
            </p>
          )}
          {pubs.map((p) => {
            const wa =
              p.whatsapp_url ||
              whatsappHref(site.whatsapp, publicationWhatsappText(site.name, p.title));
            return (
              <article className="pub" key={p.id}>
                {p.cover_image_url ? (
                  <img className="pub-media-img" src={p.cover_image_url} alt={p.title} />
                ) : p.video_url ? (
                  <video className="pub-media-img" src={p.video_url} muted playsInline />
                ) : (
                  <div className="pub-media" />
                )}
                <div className="pub-body">
                  <h3>{p.title}</h3>
                  {formatPrice(p) && <div className="price">{formatPrice(p)}</div>}
                  {p.video_url && p.cover_image_url && (
                    <video src={p.video_url} controls style={{ width: "100%", marginTop: 8, borderRadius: 8 }} />
                  )}
                  {wa && (
                    <a className="btn btn-primary" href={wa} target="_blank" rel="noreferrer" style={{ marginTop: 10 }}>
                      Consultar
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {(site.phone1 || site.phone2 || site.whatsapp) && (
          <section style={{ marginTop: "3rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)" }}>Contacto</h2>
            {site.phone1 && <p>{site.phone1}</p>}
            {site.phone2 && <p>{site.phone2}</p>}
            {waProfile && (
              <a className="btn btn-ghost" href={waProfile} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

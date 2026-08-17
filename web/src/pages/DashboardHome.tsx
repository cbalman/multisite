import { usePanel } from "../lib/panel-context";
import { sitePublicUrl } from "../lib/host";

export default function DashboardHome() {
  const { user, site } = usePanel();
  const publicUrl = sitePublicUrl(site.slug);

  return (
    <section className="panel-card">
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
          <strong>{site.publication_count ?? 0}</strong>
          <span>publicaciones</span>
        </div>
      </div>

      <a className="btn btn-primary" href={publicUrl} target="_blank" rel="noreferrer">
        Ver mi sitio
      </a>
    </section>
  );
}

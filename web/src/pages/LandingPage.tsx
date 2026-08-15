import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const [slug, setSlug] = useState("maria");
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = slug.trim().toLowerCase();
    navigate(`/registro?slug=${encodeURIComponent(clean)}`);
  }

  return (
    <div className="shell">
      <header className="nav">
        <div className="brand">Multisite</div>
        <div className="nav-actions">
          <Link className="btn btn-ghost" to="/ingresar">
            Ingresar
          </Link>
          <Link className="btn btn-primary" to="/registro">
            Registrarme
          </Link>
        </div>
      </header>

      <section className="hero">
        <h1>Tu propia vidriera online</h1>
        <p>
          Mostrá lo que hacés. Compartí tu página. Recibí consultas por WhatsApp.
        </p>

        <form className="slug-box" onSubmit={onSubmit}>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            aria-label="Dirección deseada"
            placeholder="tu-nombre"
            pattern="[a-z0-9-]+"
          />
          <span>.localhost</span>
        </form>

        <button className="btn btn-primary" type="submit" onClick={onSubmit}>
          Crear mi sitio
        </button>
      </section>

      <section className="steps" aria-label="Cómo funciona">
        <div className="step">
          <strong>① Creá tu sitio</strong>
          <span>Elegí tu dirección en segundos.</span>
        </div>
        <div className="step">
          <strong>② Publicá</strong>
          <span>Productos, servicios o trabajos con foto o video.</span>
        </div>
        <div className="step">
          <strong>③ Compartí</strong>
          <span>Link, redes o QR cuando lo tengamos.</span>
        </div>
        <div className="step">
          <strong>④ Recibí consultas</strong>
          <span>WhatsApp con mensaje listo.</span>
        </div>
      </section>
    </div>
  );
}
